const crypto = require('node:crypto');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { readClientSecret } = require('./vault');

function configuration(env = process.env) {
  const domain = (env.AUTH0_DOMAIN || '').trim();
  const clientId = (env.AUTH0_CLIENT_ID || '').trim();
  const production = env.NODE_ENV === 'production' || !!env.RENDER;
  if (!!domain !== !!clientId) throw new Error('Completá AUTH0_DOMAIN y AUTH0_CLIENT_ID juntos.');
  if (!domain && production) throw new Error('Auth0 es obligatorio en producción.');
  if (!domain) return { enabled: false };
  if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(domain) || !domain.includes('.')) {
    throw new Error('AUTH0_DOMAIN debe ser un dominio sin protocolo ni ruta.');
  }
  let base;
  try { base = new URL(env.APP_BASE_URL); } catch { throw new Error('APP_BASE_URL no es válida.'); }
  if (base.username || base.password || base.pathname !== '/' || base.search || base.hash ||
      (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) {
    throw new Error('APP_BASE_URL debe ser un origen HTTPS o localhost HTTP.');
  }
  if (production && base.protocol !== 'https:') throw new Error('Producción requiere APP_BASE_URL HTTPS.');
  return { enabled: true, domain, clientId, base: base.origin, secure: base.protocol === 'https:' };
}

async function probeCredential(config, secret, fetcher = fetch) {
  try {
    const response = await fetcher(`https://${config.domain}/oauth/token`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', client_id: config.clientId,
        client_secret: secret, code: 'vault-startup-probe',
        redirect_uri: `${config.base}/auth/callback`,
        code_verifier: crypto.randomBytes(32).toString('base64url')
      })
    });
    const body = await response.json();
    if (body.error === 'invalid_grant' && response.status >= 400 && response.status < 500) return;
    if (body.error === 'invalid_client') throw new Error('invalid_client');
  } catch (error) {
    if (error.message === 'invalid_client') throw new Error('Auth0: invalid_client. Revisá el secreto de Vault y la aplicación.');
    throw new Error('No se pudo comprobar la credencial de Auth0.');
  }
  throw new Error('Auth0 devolvió un resultado inesperado al comprobar la credencial.');
}

function createAuth(app, io, env = process.env, dependencies = {}) {
  const config = configuration(env);
  let oidc, oidcConfig, middleware, store;
  const sockets = new Map();
  const maxAge = 60 * 60 * 1000;
  const unauthorized = res => res.status(401).type('html').send('<p>Iniciá sesión para entrar al chat.</p><a href="/auth/login">Iniciar sesión</a>');
  const valid = req => !!(req.session?.user && req.session.expiresAt > Date.now());
  app.get('/auth/config', (req, res) => res.json({ enabled: config.enabled, ...(config.enabled ? { domain: config.domain, clientId: config.clientId } : {}) }));

  if (config.enabled) {
    app.set('trust proxy', 1);
    store = new MemoryStore({ checkPeriod: 60000, ttl: maxAge, max: 10000 });
    middleware = session({
      name: 'una.sid', secret: crypto.randomBytes(48).toString('base64url'), store,
      resave: false, saveUninitialized: false,
      cookie: { httpOnly: true, secure: config.secure, sameSite: 'lax', maxAge }
    });
    app.use(middleware);
    io.engine.use(middleware);
    io.use((socket, next) => {
      if (socket.handshake.headers.origin && socket.handshake.headers.origin !== config.base) return next(new Error('Origen inválido.'));
      if (!valid(socket.request)) return next(new Error('Iniciá sesión.'));
      const sid = socket.request.sessionID;
      if (!sockets.has(sid)) sockets.set(sid, new Set());
      sockets.get(sid).add(socket);
      const timer = setTimeout(() => socket.disconnect(true), Math.max(1, socket.request.session.expiresAt - Date.now()));
      timer.unref();
      socket.on('disconnect', () => {
        clearTimeout(timer);
        sockets.get(sid)?.delete(socket);
        if (!sockets.get(sid)?.size) sockets.delete(sid);
      });
      next();
    });
  }

  app.get('/auth/login', async (req, res) => {
    if (!config.enabled) return res.redirect('/');
    if (!oidcConfig) return res.status(503).send('Autenticación no disponible.');
    try {
      const verifier = oidc.randomPKCECodeVerifier();
      const state = oidc.randomState(), nonce = oidc.randomNonce();
      req.session.transaction = { verifier, state, nonce, createdAt: Date.now() };
      const url = oidc.buildAuthorizationUrl(oidcConfig, {
        redirect_uri: `${config.base}/auth/callback`, scope: 'openid profile email',
        code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
        code_challenge_method: 'S256', state, nonce
      });
      req.session.save(error => error ? res.status(503).send('No se pudo iniciar sesión.') : res.redirect(url.href));
    } catch { res.status(503).send('No se pudo iniciar sesión.'); }
  });

  app.get('/auth/callback', async (req, res) => {
    if (!config.enabled) return res.status(400).send('Auth0 no está configurado.');
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    const transaction = req.session.transaction;
    delete req.session.transaction;
    if (!oidcConfig || !transaction || Date.now() - transaction.createdAt > 600000) return res.status(400).send('Inicio de sesión inválido o vencido.');
    try {
      const url = new URL(req.originalUrl, config.base);
      const tokens = await oidc.authorizationCodeGrant(oidcConfig, url, {
        pkceCodeVerifier: transaction.verifier, expectedState: transaction.state,
        expectedNonce: transaction.nonce, idTokenExpected: true
      });
      const claims = tokens.claims();
      if (!claims?.sub) throw new Error();
      await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
      req.session.user = { sub: claims.sub, name: claims.name || claims.nickname || 'Usuario' };
      req.session.expiresAt = Math.min(Date.now() + maxAge, claims.exp * 1000);
      await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
      res.redirect('/sala');
    } catch { res.status(400).send('No se pudo validar el inicio de sesión. Intentá nuevamente.'); }
  });

  app.get('/auth/me', (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!config.enabled) return res.json({ enabled: false });
    if (!valid(req)) return unauthorized(res);
    res.json({ enabled: true, name: req.session.user.name });
  });

  app.post('/auth/logout', (req, res) => {
    if (!config.enabled) return res.redirect('/');
    if (req.get('origin') !== config.base) return res.status(403).send('Origen inválido.');
    const sid = req.sessionID;
    req.session.destroy(error => {
      if (error) return res.status(503).send('No se pudo cerrar sesión.');
      for (const socket of sockets.get(sid) || []) socket.disconnect(true);
      res.clearCookie('una.sid', { httpOnly: true, secure: config.secure, sameSite: 'lax' });
      const target = new URL(`https://${config.domain}/v2/logout`);
      target.searchParams.set('client_id', config.clientId);
      target.searchParams.set('returnTo', config.base);
      res.redirect(303, target.href);
    });
  });

  return {
    config,
    guard(req, res, next) {
      res.set('Cache-Control', 'no-store');
      if (!config.enabled || valid(req)) return next();
      return unauthorized(res);
    },
    entry(req, res, next) {
      if (!config.enabled || valid(req)) return next();
      res.type('html').send('<!doctype html><html lang="es"><meta name="viewport" content="width=device-width"><title>UNA Chat</title><h1>UNA Chat</h1><a href="/auth/login">Iniciar sesión con Auth0</a></html>');
    },
    authorizePacket(socket, next) {
      if (!config.enabled) return next();
      socket.request.session.reload(error => {
        if (error || !valid(socket.request)) return socket.disconnect(true);
        next();
      });
    },
    async initialize() {
      if (!config.enabled) return;
      const secret = await (dependencies.readSecret || readClientSecret)(env);
      await probeCredential(config, secret, dependencies.fetcher);
      oidc = dependencies.oidc || await import('openid-client');
      oidcConfig = await oidc.discovery(new URL(`https://${config.domain}/`), config.clientId,
        { client_secret: secret, id_token_signed_response_alg: 'RS256' }, oidc.ClientSecretPost(secret), { timeout: 10 });
      oidc.enableNonRepudiationChecks(oidcConfig);
      console.log('[Auth0] Vault leído; prueba de credencial: invalid_grant (esperado).');
    },
    close() { store?.stopInterval(); }
  };
}

module.exports = { configuration, probeCredential, createAuth };
