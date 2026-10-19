
const { io: crearCliente } = require('socket.io-client');
const { http, io } = require('../../server');

let cliente;
let puerto;

// Iniciar el servidor antes de las pruebas
beforeAll(async () => {
    await new Promise(resolve => http.listen(0, resolve));

    puerto = http.address().port;
});

// Cerrar conexiones al finalizar
afterAll(async () => {
    if (cliente) {
        cliente.disconnect();
    }

    await new Promise(resolve => io.close(resolve));
});

// Enviar un mensaje al servidor y recibir la respuesta
function enviarMensaje(mensaje) {
    return new Promise((resolve, reject) => {
        cliente = crearCliente(`http://localhost:${puerto}`, {
            reconnection: false,
            forceNew: true
        });

        cliente.on('connect_error', reject);

        cliente.on('connect', () => {
            cliente.emit('Evento-Mensaje-Server', JSON.stringify({
                nombre: 'Prueba',
                mensaje: mensaje,
                color: '#000000'
            }));
        });

        cliente.once('Evento-Mensaje-Server', respuesta => {
            const resultado = JSON.parse(respuesta);
            cliente.disconnect();
            resolve(resultado);
        });
    });
}

describe('Pruebas de integracion UNA Chat', () => {

    test('Acepta una URL de imagen valida', async () => {
        const resultado = await enviarMensaje(
            'https://www.w3schools.com/html/pic_trulli.jpg'
        );

        expect(resultado.mensaje).toBe(
            'https://www.w3schools.com/html/pic_trulli.jpg'
        );
    });

    test('Acepta una URL de video valida', async () => {
        const resultado = await enviarMensaje(
            'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
        );

        expect(resultado.mensaje).toBe(
            'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
        );
    });

    test('Rechaza una inyeccion de script', async () => {
        const resultado = await enviarMensaje(
            "<script>alert('Inyección de script');</script>"
        );

        expect(resultado.mensaje).toBe('');
    });

    test('Rechaza una URL no permitida', async () => {
        const resultado = await enviarMensaje(
            'https://ejemplo.com/archivo.exe'
        );

        expect(resultado.mensaje).toBe('');
    });

});
