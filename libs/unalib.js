// modulo de ejemplo.

module.exports = {


  // logica que valida si un telefono esta correcto...
  is_valid_phone: function (phone) {
    // inicializacion lazy
    var isValid = false;
    // expresion regular copiada de StackOverflow
    var re = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/i;

    // validacion Regex
    try {
      isValid = re.test(phone);
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
    // fin del try-catch block
  },

  is_valid_url_image: function (url) {

    // inicializacion lazy
    var isValid = false;
    // expresion regular copiada de StackOverflow
    var re = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|bmp)/i;

    // validacion Regex
    try {
      isValid = re.test(url);
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
    // fin del try-catch block
  },

  is_valid_yt_video: function (url) {

    // inicializacion lazy
    var isValid = false;
    // expresion regular copiada de StackOverflow
    var re = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})?$/i;

    // validacion Regex
    try {
      isValid = re.test(url);
    } catch (e) {
      console.log(e);
    } finally {
      return isValid;
    }
    // fin del try-catch block
  },

  getYTVideoId: function (url) {

    return url.match(/(?:https?:\/{2})?(?:w{3}\.)?youtu(?:be)?\.(?:com|be)(?:\/watch\?v=|\/)([^\s&]+)/)[1];
  },

  getEmbeddedCode: function (url) {
    var id = this.getYTVideoId(url);
    var code = '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + id + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    return code;
  },

  getImageTag: function (url) {
    var tag = '<img src="' + url + '" style="max-height: 400px;max-width: 400px;">';
    return tag;
  },

  validateMessage: function (msg) {
    try {
      if (typeof msg !== 'string') {
        return JSON.stringify({ mensaje: '' });
      }

      var obj = JSON.parse(msg);

      if (!obj || typeof obj !== 'object' ||
        Array.isArray(obj) || typeof obj.mensaje !== 'string') {
        return JSON.stringify({ mensaje: '' });
      }

      var mensaje = obj.mensaje.trim();

      // Evitar etiquetas HTML y posibles scripts
      if (/[<>]/.test(mensaje)) {
        obj.mensaje = '';
        return JSON.stringify(obj);
      }

      // Validar únicamente URLs de imágenes y videos
      if (/^https?:\/\//i.test(mensaje)) {
        var url = new URL(mensaje);
        var ruta = url.pathname.toLowerCase();

        var esImagen = /\.(jpg|jpeg|png|gif|webp|bmp)$/.test(ruta);
        var esVideo = /\.(mp4|webm|ogg)$/.test(ruta);

        if (!esImagen && !esVideo) {
          obj.mensaje = '';
          return JSON.stringify(obj);
        }

        obj.mensaje = url.href;
      } else if (/^[a-z][a-z0-9+.-]*:/i.test(mensaje)) {
        // Rechazar otros esquemas como javascript: o data:
        obj.mensaje = '';
        return JSON.stringify(obj);
      } else {
        obj.mensaje = mensaje;
      }

      return JSON.stringify(obj);

    } catch (error) {
      console.log('Error al validar mensaje:', error.message);
      return JSON.stringify({ mensaje: '' });
    }
  }
  // fin del modulo
};
