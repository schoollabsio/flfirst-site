FROM node:latest

# Create and change to the app directory
WORKDIR /app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

# Copy application code
COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma
