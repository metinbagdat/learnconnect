FROM node:18-alpine

WORKDIR /app

# Fix npm config
RUN npm config set strict-ssl false && \
    npm config set fetch-timeout 300000

# Copy files
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY index.html ./
COPY client ./client
COPY public ./public

# Install dependencies only
RUN npm install --legacy-peer-deps --no-audit --no-fund 2>&1 || npm install --force 2>&1

# Run dev server
EXPOSE 5173
CMD ["npm", "run", "dev"]
