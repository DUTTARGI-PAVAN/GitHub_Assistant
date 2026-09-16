FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=./src/prisma/schema.prisma

EXPOSE 5000

CMD ["npm", "run", "dev"]
