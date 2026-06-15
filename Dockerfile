FROM node:20-alpine

WORKDIR /app

# Dependencias primero (mejor cache de capas)
COPY package.json ./
RUN npm install --omit=dev

# Código de la aplicación
COPY src ./src

# Puerto por defecto del contenedor (sobrescribible con -e PORT=...)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "src/app.js"]
