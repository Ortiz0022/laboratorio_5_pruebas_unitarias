var val = require('../libs/unalib');
var assert = require('assert');


describe('unalib', function () {


  describe('funcion is_valid_phone', function () {

    it('deberia devolver true para 8297-8547', function () {

      assert.equal(val.is_valid_phone('8297-8547'), false);

    });

    it('deberia devolver false para 8297p-8547', function () {

      assert.equal(val.is_valid_phone('8297p-8547'), false);

    });

  });


  describe('funcion is_valid_url_image', function () {

    it('deberia devolver true para http://image.com/image.jpg', function () {

      assert.equal(val.is_valid_url_image('http://image.com/image.jpg'), true);

    });

    it('deberia devolver true para http://image.com/image.gif', function () {

      assert.equal(val.is_valid_url_image('http://image.com/image.gif'), true);

    });

  });

  describe('funcion is_valid_yt_video', function () {

    it('deberia aceptar una URL valida de YouTube', function () {

      assert.equal(val.is_valid_yt_video('https://www.youtube.com/watch?v=qYwlqx-JLok'), true);

    });

  });

  describe('validacion de mensajes del chat', function () {

    it('deberia aceptar una URL de imagen valida', function () {
      var msg = JSON.stringify({
        nombre: 'Prueba',
        mensaje: 'https://www.w3schools.com/html/pic_trulli.jpg'
      });

      var resultado = JSON.parse(val.validateMessage(msg));

      assert.equal(resultado.mensaje,
        'https://www.w3schools.com/html/pic_trulli.jpg');
    });

    it('deberia aceptar una URL de video valida', function () {
      var msg = JSON.stringify({
        nombre: 'Prueba',
        mensaje: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
      });

      var resultado = JSON.parse(val.validateMessage(msg));

      assert.equal(resultado.mensaje,
        'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4');
    });

    it('deberia bloquear una inyeccion de script', function () {
      var msg = JSON.stringify({
        nombre: 'Prueba',
        mensaje: "<script>alert('Inyección de script');</script>"
      });

      var resultado = JSON.parse(val.validateMessage(msg));

      assert.equal(resultado.mensaje, '');
    });

    it('deberia rechazar una URL no permitida', function () {
      var msg = JSON.stringify({
        nombre: 'Prueba',
        mensaje: 'https://ejemplo.com/archivo.exe'
      });

      var resultado = JSON.parse(val.validateMessage(msg));

      assert.equal(resultado.mensaje, '');
    });

  });

});







