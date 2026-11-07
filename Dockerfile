# Usar la imagen oficial ligera de Node.js basada en Alpine Linux
FROM node:20-alpine

# Establecer directorio de trabajo en el contenedor
WORKDIR /app

# Copiar definiciones de dependencias
COPY package*.json ./

# Instalar dependencias del proyecto
RUN npm ci --only=production

# Copiar el código fuente de la aplicación
COPY . .

# Puerto expuesto por el contenedor
EXPOSE 3000

# Variable de entorno para ejecución en Docker local
ENV NODE_ENV=development

# Comando de inicio definido en el proyecto
CMD ["node", "server.js"]

