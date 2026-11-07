// Las suites se ejecutan con DOTENV_CONFIG_PATH apuntando a un archivo vacío.
require('dotenv').config({ quiet: true, path: process.env.DOTENV_CONFIG_PATH || '.env' });
