FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install

# Copy rest of source
COPY . .

EXPOSE 4000

# Run Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "--port", "4000"]