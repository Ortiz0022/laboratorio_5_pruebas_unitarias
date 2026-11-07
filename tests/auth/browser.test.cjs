const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');

test('la identidad se muestra como texto y Cerrar sesión envía POST', async () => {
  const html = readFileSync(require('node:path').join(__dirname, '../../index.html'));
  const server = createServer((req, res) => { res.setHeader('Content-Type', 'text/html'); res.end(html); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.route('**/auth/me', route => route.fulfill({ json: { enabled: true, name: '<img src=x onerror="window.injected=true">' } }));
    await page.route('https://cdn.socket.io/**', route => route.fulfill({ contentType: 'application/javascript', body: 'window.io=()=>({on(){},emit(){}});' }));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.locator('#auth-status:not([hidden])').waitFor();
    assert.match(await page.locator('#auth-name').textContent(), /^<img/);
    assert.equal(await page.locator('#auth-name img').count(), 0);
    assert.equal(await page.evaluate(() => window.injected), undefined);
    assert.equal(await page.locator('#nombre').getAttribute('readonly'), '');
    const posted = page.waitForRequest(request => request.url().endsWith('/auth/logout') && request.method() === 'POST');
    await page.locator('#logout').click();
    await posted;
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
