# 12 — CI/CD (GitHub Actions) + Testing

## Dependencias

- [09-infra-di-wiring](./09-infra-di-wiring.md) (contenedor DI configurado para tests)
- [10-frontend](./10-frontend.md) (app React para tests E2E)
- [11-iac-terraform](./11-iac-terraform.md) (infraestructura definida)

## Descripción

Configurar CI/CD con GitHub Actions: lint, typecheck, tests (unit, integration, E2E), build, y despliegue a AWS. Configurar Vitest para unit/integration tests y Playwright para tests E2E.

## Criterios de Aceptación

- [ ] Workflow CI ejecuta en cada PR: lint, typecheck, unit tests, integration tests.
- [ ] Workflow CD ejecuta en merge a main: build + deploy a dev.
- [ ] Workflow de deploy a prod: manual (workflow_dispatch) con aprobación.
- [ ] Vitest configurado para `apps/api` y `apps/web`.
- [ ] Playwright configurado para tests E2E del frontend.
- [ ] Cobertura mínima de tests unitarios para dominio (models, VOs, domain services).
- [ ] Tests de integración para repositorios DynamoDB (usando DynamoDB Local).
- [ ] Tests E2E para flujos críticos (login, crear memory, compartir, subir archivo).

## Subtareas

### 12.1 — Configurar Vitest para backend

- `apps/api/package.json`: añadir `vitest`, `@vitest/coverage-v8`.
- `apps/api/vitest.config.ts`:
  - Alias de paths consistentes con tsconfig.
  - `environment: 'node'`.
  - Coverage thresholds: 80% statements en domain.
- Scripts: `test`, `test:watch`, `test:coverage`.
- Configurar `reflect-metadata` en setup file.

### 12.2 — Unit tests de dominio (User)

- `apps/api/src/user/domain/__tests__/`.
- Tests para `UserId`, `UserName`, `UserUsername` (validación, branding, immutabilidad).
- Tests para `User` aggregate:
  - `create()` genera `UserCreatedEvent`.
  - `updateProfile()` genera `UserProfileUpdatedEvent`.
  - `addOwnMemory()`, `removeOwnMemory()`.
  - `addSharedMemory()` genera `UserMemorySharedEvent`.
- Tests para domain exceptions.

### 12.3 — Unit tests de dominio (Memory)

- `apps/api/src/memory/domain/__tests__/`.
- Tests para VOs: `MemoryId`, `MemoryTitle`, `MemoryDescription`, `Coordinates`, `Tag`, `AttachmentId`, `S3Key`, `MimeType`.
- Tests para `Memory` aggregate:
  - `create()` genera `MemoryCreatedEvent`.
  - `updateDetails()` genera `MemoryUpdatedEvent`.
  - `shareWithUser()` genera `MemorySharedEvent`.
  - `addAttachment()` genera `AttachmentAddedEvent`.
  - `isOwner()`, `isSharedWith()`, `canUserAddAttachment()`.
  - `removeAttachment()` — solo owner y uploader pueden borrar.
  - Propiedades de solo lectura (un usuario compartido no puede modificar título, etc.).
- Tests para `MemorySharingService`.

### 12.4 — Unit tests de aplicación

- `apps/api/src/user/application/__tests__/` y `apps/api/src/memory/application/__tests__/`.
- Tests para cada Command/Query Handler usando mocks de repositorios.
- Verificar que se lanzan excepciones de dominio correctas.
- Verificar que se publican eventos tras persistir.
- Tests para mappers `toDomain()` y `toResponse()`.

### 12.5 — Integration tests (DynamoDB)

- `apps/api/src/__integration__/`.
- Configurar DynamoDB Local (Docker) para entorno de test.
- Script `test:integration` que levanta DynamoDB Local, crea tablas, ejecuta tests, derriba.
- Tests para `UserRepositoryImpl`: CRUD completo contra DynamoDB Local.
- Tests para `MemoryRepositoryImpl`: CRUD, queries por owner, búsqueda.
- Tests para `MemorySharesRepositoryImpl`.

### 12.6 — Configurar Vitest para frontend

- `apps/web/package.json`: añadir `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
- `apps/web/vitest.config.ts`:
  - `environment: 'jsdom'`.
  - Setup file con `@testing-library/jest-dom`.
- Tests unitarios para stores de Zustand.
- Tests unitarios para API client (mockeando fetch).

### 12.7 — Tests de componentes React

- `apps/web/src/components/__tests__/`.
- Tests para componentes clave: `MemoryCard`, `MemoryForm`, `LoginForm`, `ShareMemoryDialog`.
- Tests de renderizado con estados: loading, error, empty, success.
- Tests de interacción: click, type, submit.

### 12.8 — Configurar Playwright E2E

- `apps/web/package.json`: añadir `@playwright/test`.
- `apps/web/playwright.config.ts`:
  - `webServer`: comando para levantar app en modo dev contra API mockeada o staging.
  - `testDir: './e2e'`.
  - Browsers: chromium, firefox, webkit.
  - Screenshots y videos en failure.
- `apps/web/e2e/`:
  - `auth.spec.ts`: registro, login, logout.
  - `memories.spec.ts`: crear, editar, eliminar memory.
  - `search.spec.ts`: búsqueda y filtros.
  - `sharing.spec.ts`: compartir memory, permisos.
  - `attachments.spec.ts`: subir archivo.

### 12.9 — GitHub Actions: CI Workflow

- `.github/workflows/ci.yml`:
  - Trigger: `pull_request` a `main`.
  - Jobs:
    1. **Lint & Typecheck**: `pnpm lint`, `pnpm typecheck`.
    2. **Unit Tests (API)**: `pnpm --filter @acaixinha/api test:coverage`.
    3. **Unit Tests (Web)**: `pnpm --filter @acaixinha/web test`.
    4. **Integration Tests**: Levantar DynamoDB Local, ejecutar tests.
    5. **Build**: `pnpm build` (verificar que api y web compilan).

### 12.10 — GitHub Actions: CD Workflow (Dev)

- `.github/workflows/deploy-dev.yml`:
  - Trigger: `push` a `main`.
  - Jobs:
    1. **Build**: construir api (empaquetar Lambdas) y web (build de Vite).
    2. **Deploy API**: subir zip de Lambdas a S3, `terraform apply` en entorno dev.
    3. **Deploy Frontend**: `aws s3 sync` al bucket de frontend, invalidar CloudFront.
  - Variables de entorno desde GitHub Secrets.

### 12.11 — GitHub Actions: CD Workflow (Prod)

- `.github/workflows/deploy-prod.yml`:
  - Trigger: `workflow_dispatch` (manual).
  - Requiere aprobación (environment protection rules).
  - Mismos pasos que dev pero apuntando a entorno prod.

### 12.12 — Scripts de build y deploy

- `apps/api/package.json`:
  - `build`: usar `esbuild` para empaquetar cada Lambda individualmente.
  - Script que genera un `.zip` por Lambda listo para subir a S3.
- `apps/web/package.json`:
  - `build`: `vite build` con output a `dist/`.
  - Script para deploy: `aws s3 sync dist/ s3://<bucket> --delete && aws cloudfront create-invalidation ...`.

### 12.13 — Badges y cobertura

- Añadir badges en README: CI status, coverage percentage.
- Upload de coverage a Codecov o Coveralls (opcional).

## Notas

- DynamoDB Local se ejecuta vía Docker en CI (usar `services` en GitHub Actions).
- Para E2E contra staging, configurar un entorno de dev desplegado.
- Las variables de entorno de CI/CD se almacenan en GitHub Secrets:
  - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (o usar OIDC).
  - `AWS_REGION`.
  - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`.
  - `TERRAFORM_API_TOKEN` (si se usa Terraform Cloud).
