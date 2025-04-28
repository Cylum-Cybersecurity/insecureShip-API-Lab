# Imagen base
FROM node:18

# Crear directorio de trabajo
WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Exponer el puerto (según .env)
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["node", "server.js"]
