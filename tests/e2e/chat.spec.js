
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#nombre').fill('Prueba');
});

// Enviar un mensaje utilizando el formulario del chat
async function enviarMensaje(page, mensaje) {
    await page.locator('#m').fill(mensaje);
    await page.getByRole('button', { name: 'Send' }).click();
}

// Identificador unico para que cada prueba reconozca solo sus propios mensajes
// (el servidor reenvia los mensajes a todos los clientes conectados)
function idUnico() {
    return Date.now() + '-' + Math.random().toString(36).slice(2);
}

test('Mostrar una imagen en el chat', async ({ page }) => {
    const url = 'https://www.w3schools.com/html/pic_trulli.jpg?t=' + idUnico();

    await enviarMensaje(page, url);

    const imagen = page.locator('#messages img[src="' + url + '"]');
    await expect(imagen).toBeVisible();

    // Verificar que la imagen terminó de cargar
    await expect.poll(() =>
        imagen.evaluate(img => img.complete && img.naturalWidth > 0)
    ).toBe(true);
});

test('Mostrar y cargar un video en el chat', async ({ page }) => {
    const url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4?t=' + idUnico();

    await enviarMensaje(page, url);

    const video = page.locator('#messages video[src="' + url + '"]');
    await expect(video).toBeVisible();

    // Verificar que el navegador cargó los datos del video
    await expect.poll(() =>
        video.evaluate(v => v.readyState >= 2)
    ).toBe(true);
});

test('Bloquear una inyeccion de script', async ({ page }) => {
    let aparecioAlerta = false;

    // Detectar cualquier alerta del navegador
    page.on('dialog', async dialog => {
        aparecioAlerta = true;
        await dialog.dismiss();
    });

    await enviarMensaje(
        page,
        "<script>alert('Inyección de script');</script>"
    );

    // Mensaje centinela: el servidor procesa los mensajes de un socket en orden,
    // asi que cuando este aparece, el script ya fue procesado por el servidor.
    const centinela = 'centinela-' + idUnico();
    await enviarMensaje(page, centinela);
    await expect(page.locator('#messages li', { hasText: centinela })).toHaveCount(1);

    // Verificar que el mensaje con el script fue rechazado
    await expect(page.locator('#messages li', { hasText: 'alert' })).toHaveCount(0);
    await expect(page.locator('#messages li', { hasText: '<script>' })).toHaveCount(0);
    await expect(page.locator('#messages script')).toHaveCount(0);

    // Comprobar que no se ejecutó ningún script
    expect(aparecioAlerta).toBe(false);
});
