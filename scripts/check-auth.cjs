// Verifica servicios reales sin imprimir credenciales ni la conexión.
require('../server/environment');
const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const { createAuth } = require('../server/auth');

(async () => {
  const app = express(), http = createServer(app), io = new Server(http);
  let auth;
  try {
    auth = createAuth(app, io);
    if (!auth.config.enabled) throw new Error('Auth0 no está configurado.');
    app.get('/sala', auth.guard, (req, res) => res.send('sala'));
    await auth.initialize();
    await new Promise(resolve => http.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${http.address().port}`;
    for (const [route, expected] of [['/auth/config', 200], ['/sala', 401], ['/auth/login', 302]]) {
      const response = await fetch(base + route, { redirect: 'manual' });
      console.log(`${route}: HTTP ${response.status}`);
      if (response.status !== expected) throw new Error('Estado HTTP inesperado.');
      if (route === '/auth/config' && !(await response.json()).enabled) throw new Error('Auth0 no está habilitado.');
      if (route === '/auth/login' && new URL(response.headers.get('location')).hostname !== auth.config.domain) throw new Error('Destino de login inesperado.');
      if (!response.bodyUsed) await response.body?.cancel();
    }
    console.log('Verificación real completada. Falta el login interactivo en el navegador.');
  } catch (error) {
    // Errores externos OIDC pueden contener información adicional: no volcarlos.
    const safe = /^(No se pudo leer Vault|Auth0: invalid_client|No se pudo comprobar|Auth0 devolvió)/.test(error.message);
    console.error(safe ? error.message : 'Falló la verificación. Revisá la configuración Auth0 y la conexión TLS de Vault.');
    process.exitCode = 1;
  } finally {
    auth?.close();
    await new Promise(resolve => io.close(resolve));
  }
})();
