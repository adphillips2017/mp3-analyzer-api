# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY api/package*.json ./api/

# Install dependencies
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
