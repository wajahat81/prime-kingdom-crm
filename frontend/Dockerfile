# Use the official Node image for building the Vite app
FROM node:18-alpine

WORKDIR /app

# Copy package management files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy the React application code
COPY . .

# Expose Vite's default dev server port
EXPOSE 5173

# Run the Vite development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]