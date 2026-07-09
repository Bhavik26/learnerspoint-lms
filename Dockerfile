# Stage 1: Build dependency cache
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the package-lock.json
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Build the source code
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client types, build standalone next server, and bundle typescript seed script
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build:web

# Bundle seed script into a standalone javascript file for execution in runner without devDependencies
RUN npx esbuild prisma/seed.ts --bundle --platform=node --external:@prisma/client --outfile=prisma/seed.js

# Stage 3: Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set up runtime directories
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy next standalone built output and compiled assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["sh", "-c", "npx prisma@6 db push && node prisma/seed.js && node server.js"]
