FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies, reproducibly from the lockfile.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Application source. src/ carries schema.sql, which the server applies as an
# idempotent migration on boot (see src/index.js -> migrate()).
COPY src ./src

# Drop root: run as the image's built-in unprivileged 'node' user.
USER node

EXPOSE 4000
CMD ["node", "src/index.js"]
