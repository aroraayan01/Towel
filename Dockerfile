# The store runs in a container because the cPanel box is AlmaLinux 8 (glibc
# 2.28), and Next.js's compiler and the SQLite driver need a newer glibc.
# Debian bookworm has 2.36. See deploy/install.sh for how it is run.

FROM node:24-bookworm-slim AS base
# Prisma's migration engine links against OpenSSL, which the slim image leaves out
RUN apt-get update  && apt-get install -y --no-install-recommends openssl ca-certificates  && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /app

# Native modules here all ship prebuilt binaries for this glibc; no compiler needed.
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --no-audit --no-fund

COPY . .

# Inlined into the browser code at build time, so it has to be known now.
ARG NEXT_PUBLIC_SITE_URL=https://xomexo.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1
# A throwaway database, so anything that touches Prisma during the build finds
# tables. The real one is mounted at /data when the container runs.
ENV DATABASE_URL=file:/tmp/build.db
RUN npx prisma migrate deploy && npm run build && rm -f /tmp/build.db


FROM base
WORKDIR /app

# Run as the cPanel user that owns the data folder, so the database file on the
# host stays readable by that user (and by backups).
ARG APP_UID=1000
ARG APP_GID=1000

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=file:/data/xomexo.db \
    UPLOADS_DIR=/data/uploads \
    HOME=/tmp \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The full app, dev dependencies included: the Prisma CLI and tsx are needed
# for migrations and the first catalogue seed.
COPY --from=build --chown=${APP_UID}:${APP_GID} /app /app

USER ${APP_UID}:${APP_GID}
EXPOSE 3000
VOLUME ["/data"]

# Apply any new migrations, then serve.
CMD ["sh", "-c", "npx prisma migrate deploy && exec node node_modules/next/dist/bin/next start -p ${PORT} -H ${HOSTNAME}"]
