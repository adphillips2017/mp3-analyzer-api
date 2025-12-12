# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy root package files and lock file
COPY package.json package-lock.json ./

# Copy API package files
COPY api/package.json ./api/

# Install all dependencies (including workspace dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment variable
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
