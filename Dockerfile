FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json .npmrc ./
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
COPY attached_assets ./attached_assets

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm run build:deploy

EXPOSE 3000

CMD ["pnpm", "start"]
