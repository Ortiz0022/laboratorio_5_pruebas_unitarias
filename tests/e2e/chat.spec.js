
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

test('Mostrar una imagen en el chat', async ({ page }) => {
    const url = 'https://www.w3schools.com/html/pic_trulli.jpg';

    await enviarMensaje(page, url);

    const imagen = page.locator('#messages img');
    await expect(imagen).toBeVisible();

    // Verificar que la imagen terminó de cargar
    await expect.poll(() =>
        imagen.evaluate(img => img.complete && img.naturalWidth > 0)
    ).toBe(true);
});

test('Mostrar y cargar un video en el chat', async ({ page }) => {
    const url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

    await enviarMensaje(page, url);

    const video = page.locator('#messages video');
    await expect(video).toBeVisible();

    // Verificar que el navegador cargó los datos del video
    await expect.poll(() =>
        video.evaluate(v => v.readyState >= 2)
    ).toBe(true);
});

test('Bloquear una inyeccion de script', async ({ page }) => {
    let aparecioAlerta = false;

    // Registrar el detector antes de enviar el mensaje
    page.on('dialog', async dialog => {
        aparecioAlerta = true;
        await dialog.dismiss();
    });

    await enviarMensaje(
        page,
        "<script>alert('Inyección de script');</script>"
    );

    // El mensaje malicioso no debe mostrarse ni ejecutarse
    await expect(page.locator('#messages li')).toHaveCount(1);
    await expect(page.locator('#messages li')).not.toContainText('<script>');

    expect(aparecioAlerta).toBe(false);
});
