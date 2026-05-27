# Use an official Node.js runtime as a parent image
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript project
RUN npm run build

# Production image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy the build artifacts and package.json from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Set the environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Define the port the container should expose
EXPOSE 4000

# Command to run the application
CMD ["npm", "start"]
