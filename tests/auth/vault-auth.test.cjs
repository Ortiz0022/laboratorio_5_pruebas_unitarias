const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { Server } = require('socket.io');
const { io: connect } = require('socket.io-client');
const { createServer } = require('node:http');
const { configuration, probeCredential, createAuth } = require('../../server/auth');
const { connectionOptions, readClientSecret } = require('../../server/vault');
const env = { AUTH0_DOMAIN: 'example.auth0.com', AUTH0_CLIENT_ID: 'public-id', APP_BASE_URL: 'http://localhost:3000' };
const database = { VAULT_DATABASE_URL: 'postgresql://una_chat_backend.ref:private@aws-0-test.pooler.supabase.com:5432/postgres?sslmode=disable' };
const invalidGrant = async () => ({ status: 400, json: async () => ({ error: 'invalid_grant' }) });

test('configuración distingue modo local, parcial y producción', () => {
  assert.deepEqual(configuration({}), { enabled: false });
  assert.throws(() => configuration({ AUTH0_DOMAIN: env.AUTH0_DOMAIN }));
  assert.throws(() => configuration({ NODE_ENV: 'production' }));
  assert.throws(() => configuration({ ...env, AUTH0_DOMAIN: 'https://example.auth0.com' }));
  assert.throws(() => configuration({ ...env, APP_BASE_URL: 'http://remote.example' }));
  assert.throws(() => configuration({ ...env, NODE_ENV: 'production' }));
  assert.equal(configuration({ ...env, APP_BASE_URL: 'https://chat.example', NODE_ENV: 'production' }).secure, true);
});

test('Vault exige rol dedicado y verifica TLS incluso con sslmode inseguro en URI', () => {
  const options = connectionOptions(database);
  assert.equal(options.ssl.rejectUnauthorized, true);
  assert.equal(new URL(options.connectionString).searchParams.has('sslmode'), false);
  assert.throws(() => connectionOptions({ VAULT_DATABASE_URL: database.VAULT_DATABASE_URL.replace('una_chat_backend.ref', 'postgres') }));
});

for (const failure of ['none', 'connect', 'query', 'empty']) {
  test(`Vault: lectura ${failure} cierra conexión y redacta errores`, async () => {
    let ended = false;
    class FakeClient {
      on() {}
      async connect() { if (failure === 'connect') throw new Error('password=private TLS error'); }
      async query(sql) {
        assert.equal(sql, 'select una_chat_private.get_auth0_client_secret() as secret');
        if (failure === 'query') throw new Error('private');
        return { rows: [{ secret: failure === 'empty' ? '' : 'private-secret' }] };
      }
      async end() { ended = true; }
    }
    if (failure === 'none') assert.equal(await readClientSecret(database, FakeClient), 'private-secret');
    else await assert.rejects(readClientSecret(database, FakeClient), error => !error.message.includes('private'));
    assert.equal(ended, true);
  });
}

test('probe envía Client Secret Post y acepta únicamente invalid_grant esperado', async () => {
  await probeCredential(configuration(env), 'private-secret', async (url, options) => {
    assert.equal(url, 'https://example.auth0.com/oauth/token');
    assert.equal(options.body.get('client_secret'), 'private-secret');
    assert.equal(options.body.get('code'), 'vault-startup-probe');
    assert.ok(options.body.get('code_verifier').length >= 43);
    return invalidGrant();
  });
  await assert.rejects(probeCredential(configuration(env), 'private-secret', async () => ({ status: 401, json: async () => ({ error: 'invalid_client' }) })), /invalid_client/);
  await assert.rejects(probeCredential(configuration(env), 'private-secret', async () => { throw new Error('private-secret'); }), error => !error.message.includes('private-secret'));
  await assert.rejects(probeCredential(configuration(env), 'private-secret', async () => ({ status: 200, json: async () => ({}) })), /inesperado/);
});

async function harness(options = {}) {
  const app = express(), http = createServer(app), io = new Server(http);
  const transactions = [];
  const oidc = {
    randomPKCECodeVerifier: () => 'v'.repeat(43), randomState: () => 'state', randomNonce: () => 'nonce',
    calculatePKCECodeChallenge: async () => 'challenge', ClientSecretPost: secret => ({ secret }),
    discovery: async (...args) => { assert.equal(args[3].secret, 'private-secret'); return {}; },
    enableNonRepudiationChecks() {},
    buildAuthorizationUrl(config, parameters) { transactions.push(parameters); return new URL('https://example.auth0.com/authorize?' + new URLSearchParams(parameters)); },
    async authorizationCodeGrant(config, url, checks) {
      assert.equal(checks.pkceCodeVerifier, 'v'.repeat(43));
      assert.equal(checks.expectedNonce, 'nonce');
      assert.equal(checks.idTokenExpected, true);
      if (url.searchParams.get('state') !== checks.expectedState || url.searchParams.get('code') !== 'valid') throw new Error('private-secret');
      return { claims: () => ({ sub: 'subject', name: '<img src=x onerror=alert(1)>', exp: options.expired ? 1 : Math.floor(Date.now() / 1000) + 3600 }) };
    }
  };
  const auth = createAuth(app, io, options.env || env, { oidc, readSecret: async () => 'private-secret', fetcher: invalidGrant });
  app.get('/sala', auth.guard, (req, res) => res.send('sala'));
  app.get('/', auth.entry, (req, res) => res.send('chat'));
  io.on('connection', socket => {
    socket.use((packet, next) => auth.authorizePacket(socket, next));
    socket.on('echo', value => socket.emit('echo', value));
  });
  if (!options.skipInit) await auth.initialize();
  await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${http.address().port}`;
  let cookie = '';
  async function request(path, init = {}) {
    const response = await fetch(base + path, { ...init, redirect: 'manual', headers: { Cookie: cookie, ...init.headers } });
    const set = response.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    return response;
  }
  async function login() {
    const start = await request('/auth/login');
    assert.equal(start.status, 302);
    const callback = await request('/auth/callback?code=valid&state=state');
    assert.equal(callback.status, 302);
    return callback;
  }
  return { request, login, transactions, base, get cookie() { return cookie; }, close: async () => { auth.close(); await new Promise(resolve => io.close(resolve)); } };
}

test('rutas sin cookie: config pública, sala 401, login 302 con PKCE y cookies seguras', async () => {
  const h = await harness();
  try {
    const config = await (await h.request('/auth/config')).json();
    assert.deepEqual(config, { enabled: true, domain: env.AUTH0_DOMAIN, clientId: env.AUTH0_CLIENT_ID });
    assert.equal((await h.request('/sala')).status, 401);
    const login = await h.request('/auth/login');
    assert.equal(login.status, 302);
    assert.match(login.headers.get('set-cookie'), /HttpOnly/);
    assert.match(login.headers.get('set-cookie'), /SameSite=Lax/);
    assert.equal(h.transactions[0].code_challenge_method, 'S256');
    assert.equal(new URL(login.headers.get('location')).hostname, env.AUTH0_DOMAIN);
    const bad = await h.request('/auth/callback?code=valid&state=bad');
    assert.equal(bad.status, 400);
    assert.ok(!(await bad.text()).includes('private-secret'));
    assert.equal((await h.request('/sala')).status, 401);
  } finally { await h.close(); }
});

test('callback válido regenera sesión, muestra identidad y logout revoca cookie previa', async () => {
  const h = await harness();
  try {
    await h.request('/auth/login');
    const before = h.cookie;
    assert.equal((await h.request('/auth/callback?code=valid&state=state')).status, 302);
    assert.notEqual(h.cookie, before);
    const authenticatedCookie = h.cookie;
    assert.equal((await h.request('/sala')).status, 200);
    assert.equal((await (await h.request('/auth/me')).json()).name, '<img src=x onerror=alert(1)>');
    assert.equal((await h.request('/auth/logout', { method: 'POST', headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal((await h.request('/auth/logout', { method: 'POST', headers: { Origin: env.APP_BASE_URL } })).status, 303);
    assert.equal((await h.request('/sala', { headers: { Cookie: authenticatedCookie } })).status, 401);
  } finally { await h.close(); }
});

test('sesión vencida no permite sala ni conexión Socket.IO', async () => {
  const h = await harness({ expired: true });
  let socket;
  try {
    await h.login(); assert.equal((await h.request('/sala')).status, 401);
    socket = connect(h.base, { extraHeaders: { Cookie: h.cookie }, forceNew: true, reconnection: false });
    await new Promise((resolve, reject) => { socket.once('connect_error', resolve); socket.once('connect', () => reject(new Error('expired accepted'))); });
  } finally { socket?.disconnect(); await h.close(); }
});

test('HTTPS configura cookie Secure y conserva HttpOnly y SameSite', async () => {
  const h = await harness({ env: { ...env, APP_BASE_URL: 'https://chat.example', NODE_ENV: 'production' } });
  try {
    const response = await h.request('/auth/login', { headers: { 'X-Forwarded-Proto': 'https' } });
    assert.match(response.headers.get('set-cookie'), /; Secure/);
    assert.match(response.headers.get('set-cookie'), /HttpOnly/);
    assert.match(response.headers.get('set-cookie'), /SameSite=Lax/);
  } finally { await h.close(); }
});

test('login no se habilita antes de inicializar Vault/OIDC', async () => {
  const h = await harness({ skipInit: true });
  try { assert.equal((await h.request('/auth/login')).status, 503); }
  finally { await h.close(); }
});

test('Socket.IO rechaza anónimo y desconecta al cerrar sesión', async () => {
  const h = await harness();
  let socket;
  try {
    socket = connect(h.base, { forceNew: true, reconnection: false });
    await new Promise((resolve, reject) => { socket.once('connect_error', resolve); socket.once('connect', () => reject(new Error('anonymous accepted'))); });
    socket.disconnect();
    await h.login();
    socket = connect(h.base, { extraHeaders: { Cookie: h.cookie }, forceNew: true, reconnection: false });
    await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
    const echoed = new Promise(resolve => socket.once('echo', resolve));
    socket.emit('echo', 'valid');
    assert.equal(await echoed, 'valid');
    const disconnected = new Promise(resolve => socket.once('disconnect', resolve));
    await h.request('/auth/logout', { method: 'POST', headers: { Origin: env.APP_BASE_URL } });
    await disconnected;
    assert.equal(socket.connected, false);
  } finally { socket?.disconnect(); await h.close(); }
});

test('modo local abierto mantiene rutas sin Vault y no revela secretos', async () => {
  const h = await harness({ env: {} });
  try {
    assert.equal((await h.request('/sala')).status, 200);
    assert.deepEqual(await (await h.request('/auth/config')).json(), { enabled: false });
  } finally { await h.close(); }
});

test('Sentry elimina contexto sensible y desactiva instrumentación automática', () => {
  const sentry = require('@sentry/node');
  const original = sentry.init;
  let options;
  sentry.init = value => { options = value; };
  try { require('../../instrument'); } finally { sentry.init = original; }
  assert.equal(options.defaultIntegrations, false);
  const cleaned = options.beforeSend({ request: { url: '/auth/callback?code=private' }, breadcrumbs: [{ data: 'private' }], extra: { password: 'private' }, message: 'safe' });
  assert.deepEqual(cleaned, { message: 'safe' });
});

test('el arranque ejecutable falla antes de escuchar si Vault no puede leer', () => {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, ['server.js'], {
    cwd: require('node:path').join(__dirname, '../..'), encoding: 'utf8', timeout: 15000,
    env: {
      ...process.env, ...env, NODE_ENV: 'test', RENDER: '',
      DOTENV_CONFIG_PATH: 'tests/fixtures/empty.env', VAULT_DATABASE_URL: 'invalid-private-uri',
      SENTRY_DSN: '', OTEL_EXPORTER_OTLP_ENDPOINT: '', OTEL_EXPORTER_OTLP_HEADERS: ''
    }
  });
  assert.equal(result.status, 1);
  assert.ok(!result.stdout.includes('listening on'));
  assert.ok(!result.stderr.includes('invalid-private-uri'));
  assert.match(result.stderr, /No se pudo leer Vault/);
});
