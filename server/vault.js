const { readFileSync } = require('node:fs');
const { Client } = require('pg');

function connectionOptions(env) {
  if (!env.VAULT_DATABASE_URL) throw new Error('Falta VAULT_DATABASE_URL.');
  let uri;
  try {
    uri = new URL(env.VAULT_DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(uri.protocol)) throw new Error();
    if (!/^una_chat_backend(?:\.[a-z0-9]+)?$/.test(decodeURIComponent(uri.username))) throw new Error();
  } catch {
    throw new Error('VAULT_DATABASE_URL debe usar el rol una_chat_backend.');
  }
  // pg-connection-string puede reemplazar ssl si estos parámetros permanecen.
  for (const key of [...uri.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('ssl')) uri.searchParams.delete(key);
  }
  const ssl = { rejectUnauthorized: true, servername: uri.hostname };
  if (env.VAULT_CA_CERT_PATH) ssl.ca = readFileSync(env.VAULT_CA_CERT_PATH, 'utf8');
  return {
    connectionString: uri.href, ssl,
    connectionTimeoutMillis: 10000, query_timeout: 10000,
    application_name: 'una-chat-vault'
  };
}

async function readClientSecret(env = process.env, ClientType = Client) {
  let client;
  try {
    client = new ClientType(connectionOptions(env));
    // Evitar errores de socket no manejados; no registrar datos de conexión.
    client.on('error', () => {});
    await client.connect();
    const result = await client.query('select una_chat_private.get_auth0_client_secret() as secret');
    const secret = result.rows[0]?.secret;
    if (typeof secret !== 'string' || !secret.trim()) throw new Error();
    return secret;
  } catch (error) {
    const reasons = {
      ENOTFOUND: 'host no encontrado', EAI_AGAIN: 'DNS no disponible',
      ECONNREFUSED: 'conexión rechazada', ETIMEDOUT: 'tiempo agotado',
      '28P01': 'contraseña del rol rechazada', '28000': 'usuario rechazado',
      '42501': 'permiso denegado', P0002: 'secreto ausente',
      SELF_SIGNED_CERT_IN_CHAIN: 'falta la CA del proyecto',
      UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'cadena del certificado no verificada',
      CERT_HAS_EXPIRED: 'certificado vencido', ERR_TLS_CERT_ALTNAME_INVALID: 'hostname del certificado incorrecto'
    };
    const reason = /tenant.*not found/i.test(error.message || '')
      ? 'proyecto o usuario no encontrado en el pooler: revisá host, región y referencia'
      : reasons[error.code] || 'conexión, TLS o configuración';
    throw new Error(`No se pudo leer Vault (${reason}). Revisá conexión, rol, certificado y nombre del secreto.`);
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

module.exports = { readClientSecret, connectionOptions };
