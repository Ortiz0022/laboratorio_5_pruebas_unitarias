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
    try {
      if (typeof url !== 'string') {
        return false;
      }

      var direccion = new URL(url);

      // Permitir solamente HTTP y HTTPS
      if (!['http:', 'https:'].includes(direccion.protocol)) {
        return false;
      }

      // Validar la extensión de la imagen
      return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(direccion.pathname);

    } catch (error) {
      return false;
    }
  },

  is_valid_yt_video: function (url) {
    try {
      if (typeof url !== 'string') {
        return false;
      }

      var direccion = new URL(url);

      if (!['http:', 'https:'].includes(direccion.protocol)) {
        return false;
      }

      var dominio = direccion.hostname.toLowerCase();
      var id = '';

      if (dominio === 'youtube.com' || dominio === 'www.youtube.com') {
        if (direccion.pathname === '/watch') {
          id = direccion.searchParams.get('v') || '';
        } else if (direccion.pathname.startsWith('/embed/')) {
          id = direccion.pathname.split('/')[2];
        }
      } else if (dominio === 'youtu.be') {
        id = direccion.pathname.slice(1);
      }

      // El identificador de YouTube debe tener 11 caracteres
      return /^[a-zA-Z0-9_-]{11}$/.test(id);

    } catch (error) {
      return false;
    }
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

      // Validar el nombre del usuario
      if (typeof obj.nombre !== 'string') {
        obj.nombre = 'Anonimo';
      } else {
        obj.nombre = obj.nombre.trim().slice(0, 30);

        if (!obj.nombre || /[<>]/.test(obj.nombre)) {
          obj.nombre = 'Anonimo';
        }
      }

      // Validar que el color sea hexadecimal
      if (typeof obj.color !== 'string' ||
        !/^#[0-9a-fA-F]{6}$/.test(obj.color)) {
        obj.color = '#000000';
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
