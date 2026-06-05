# One image that carries the built server plus the source, node_modules, and
# drizzle-kit. The same image runs three commands on the droplet: the app
# (default CMD), the migration (npm run db:migrate), and the seed
# (npm run db:seed). Keeping node_modules makes the image larger but means
# migrations run through drizzle-kit exactly as they do in development, with no
# separate migrate image or hand-rolled migrator to drift out of sync.
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
