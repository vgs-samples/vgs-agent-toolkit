FROM node:20-alpine

# Install Chromium, Xvfb, and necessary dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    xvfb \
    dbus

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV DISPLAY=:99

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Start Xvfb and run the application
CMD Xvfb :99 -screen 0 1024x768x16 & node src/index.js 