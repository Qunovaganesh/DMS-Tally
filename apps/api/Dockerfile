FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install build tools for native modules
RUN apk add --no-cache build-base python3

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build packages
RUN pnpm run build:packages

# Build API
RUN pnpm --filter api build

EXPOSE 3001

CMD ["pnpm", "--filter", "api", "start"]