# Use the official Deno image
FROM denoland/deno:latest

# Create and change to the app directory
WORKDIR /app

# Copy application code
COPY . .

RUN deno cache app.ts

