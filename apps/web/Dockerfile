FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build packages
RUN pnpm run build:packages

# Build web app
RUN pnpm --filter web build

# Serve the built app
EXPOSE 3000

CMD ["pnpm", "--filter", "web", "preview", "--host", "0.0.0.0"]