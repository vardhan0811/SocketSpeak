FROM node:18-alpine

# Set npm configuration to handle SSL issues
RUN npm config set strict-ssl false

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json frontend/
COPY backend/package*.json backend/

# Install dependencies with TLS issues bypass
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm install
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Set production environment
ENV NODE_ENV=production

# Set port
ENV PORT=5001

# Start the server
CMD ["npm", "start"] 