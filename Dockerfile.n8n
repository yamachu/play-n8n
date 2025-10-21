FROM node:22 AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@latest-10
RUN \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends rsync

WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=bind,source=.,rw=true \
    --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile && \
    rsync -a --include='*/' --include='node_modules/**' --exclude='*' /app/ /tmp/app/

FROM base AS build
RUN --mount=type=bind,source=.,rw=true \
    --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile && \
    pnpm run -r build && \
    rsync -a --include='*/' --include='package.json' --include='dist/**' --exclude='*' /app/ /tmp/app/

FROM docker.n8n.io/n8nio/n8n
COPY --from=prod-deps --chown=node:node /tmp/app /data/custom
COPY --from=build --chown=node:node /tmp/app /data/custom
