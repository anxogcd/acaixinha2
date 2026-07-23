# 01 — Setup del Monorepo

## Dependencias

Ninguna (tarea inicial).

## Descripción

Crear la estructura base del monorepo con pnpm workspaces, configuraciones compartidas de TypeScript, ESLint, Prettier y el package `shared` para tipos y DTOs comunes entre frontend y backend.

## Criterios de Aceptación

- [ ] `pnpm install` funciona en raíz y en cada workspace.
- [ ] `tsconfig.base.json` extiende correctamente en `apps/api`, `apps/web` y `packages/shared`.
- [ ] ESLint y Prettier configurados con reglas consistentes para todo el monorepo.
- [ ] `.nvmrc` fija Node 22.
- [ ] `packages/shared` exporta correctamente y es importable desde `apps/api` y `apps/web`.

## Subtareas

### 1.1 — Inicializar raíz del monorepo

- Crear `package.json` raíz con `private: true`.
- Crear `pnpm-workspace.yaml` definiendo `apps/*`, `packages/*`.
- Crear `.nvmrc` con `22`.
- Crear `.npmrc` con configuraciones recomendadas para pnpm.

### 1.2 — Configurar TypeScript base

- Crear `tsconfig.base.json` con strict mode, paths, target ESNext, module NodeNext.
- Compiler options: `declaration`, `declarationMap`, `sourceMap`, `esModuleInterop`, `skipLibCheck`.

### 1.3 — Configurar ESLint + Prettier

- Instalar `eslint`, `prettier`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` en raíz.
- Crear `eslint.config.mjs` (flat config) con reglas TypeScript.
- Crear `.prettierrc` y `.prettierignore`.
- Añadir scripts `lint` y `format` en `package.json` raíz.

### 1.4 — Crear package `shared`

- `packages/shared/package.json` con nombre `@acaixinha/shared`.
- `packages/shared/tsconfig.json` extendiendo `tsconfig.base.json`.
- `packages/shared/src/index.ts` como barrel export.
- Definir DTOs base compartidos: `UserDTO`, `MemoryDTO`, `AttachmentDTO`, `PaginatedResponse<T>`.
- Definir tipos de API: `ApiError`, `ApiResponse<T>`.

### 1.5 — Crear scaffold de apps

- `apps/api/package.json` con nombre `@acaixinha/api`.
- `apps/api/tsconfig.json` extendiendo `tsconfig.base.json`.
- `apps/web/package.json` con nombre `@acaixinha/web`.
- `apps/web/tsconfig.json` extendiendo `tsconfig.base.json`.
- Verificar que `pnpm install` resuelve todos los workspaces.

### 1.6 — Scripts de conveniencia

- Añadir script `dev` en raíz que ejecute api (servidor Express local) y web (Vite dev) en paralelo.
- Añadir script `build` en raíz que construya todos los packages en orden.
- Añadir script `typecheck` en raíz.

### 1.7 — Servidor Express local para API (desarrollo)

- `apps/api/package.json`: añadir `express`, `@types/express`.
- `pnpm install --filter @acaixinha/api`.
- Crear `apps/api/src/server/localServer.ts`:
  - Servidor Express que registra manualmente las rutas de la API (las mismas que API Gateway en prod).
  - Cada ruta es un wrapper que convierte `req → APIGatewayProxyEvent` y `result → res.json()`.
  - Usa `createContainer()` de tsyringe para resolver handlers.
- Script `apps/api/package.json`: `"dev": "tsx watch src/server/localServer.ts"`.
- Esto permite desarrollar contra un HTTP server real sin desplegar a AWS.

### 1.8 — Makefile con comandos de conveniencia

- Crear `Makefile` en raíz del monorepo con los siguientes targets:
  - `install` → `pnpm install`.
  - `dev` → `pnpm dev` (api + web en paralelo).
  - `dev:api` → `pnpm --filter @acaixinha/api dev`.
  - `dev:web` → `pnpm --filter @acaixinha/web dev`.
  - `build` → `pnpm build`.
  - `lint` → `pnpm lint`.
  - `lint:fix` → `pnpm lint --fix`.
  - `format` → `pnpm format`.
  - `format:check` → `prettier --check .`.
  - `typecheck` → `pnpm typecheck`.
  - `test` → `pnpm --filter @acaixinha/api test && pnpm --filter @acaixinha/web test`.
  - `test:api` → `pnpm --filter @acaixinha/api test`.
  - `test:web` → `pnpm --filter @acaixinha/web test`.
  - `test:coverage` → `pnpm --filter @acaixinha/api test:coverage`.
  - `test:integration` → `pnpm --filter @acaixinha/api test:integration` (requiere DynamoDB Local corriendo).
  - `test:e2e` → `pnpm --filter @acaixinha/web test:e2e`.
  - `dynamodb:up` → `docker compose -f docker/dynamodb-local.yml up -d`.
  - `dynamodb:down` → `docker compose -f docker/dynamodb-local.yml down`.
  - `clean` → eliminar `node_modules`, `dist/`, `.terraform/`.
  - `setup` → `make install && make build`.
- Usar `.PHONY` para todos los targets.

## Notas

- Los paquetes internos se referencian con `"@acaixinha/shared": "workspace:*"`.
- El backend usará `module: "NodeNext"`, el frontend usará `module: "ESNext"`.
- Para desarrollo local, la API se ejecuta como un servidor Express que envuelve a los handlers de Lambda. En producción, cada handler es una Lambda independiente empaquetada con esbuild.
