
// npm install para descargar los paquetes...

// libreriuas
var validation = require('./libs/unalib');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

// root: presentar html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// escuchar una conexion por socket
io.on('connection', function (socket) {
  // si se escucha "chat message"
  socket.on('Evento-Mensaje-Server', function (msg) {

    msg = validation.validateMessage(msg);
    // volvemos a emitir el mismo mensaje
    io.emit('Evento-Mensaje-Server', msg);
  });
});

// Iniciar el servidor al ejecutar la aplicación
if (require.main === module) {
  http.listen(port, function () {
    console.log('listening on *:' + port);
  });
}

// Permitir utilizar el servidor en las pruebas de integración
module.exports = { http, io };
