# 09 — Infraestructura: Cableado de Dependencias (tsyringe)

## Dependencias

- [06-infra-persistence](./06-infra-persistence.md) (repositorios implementados)
- [07-infra-api-auth](./07-infra-api-auth.md) (handlers y servicios)
- [08-infra-file-storage](./08-infra-file-storage.md) (servicio S3)

## Descripción

Configurar el contenedor de inyección de dependencias con tsyringe para cablear todas las implementaciones concretas con sus interfaces (puertos). Cada Lambda debe poder resolver sus dependencias desde el contenedor.

## Criterios de Aceptación

- [ ] Todas las interfaces de dominio están registradas con sus implementaciones.
- [ ] Cada Lambda entry point obtiene sus dependencias del contenedor.
- [ ] Las dependencias se resuelven correctamente en cadena.
- [ ] Configuración por entorno (dev/prod) vía variables de entorno.

## Subtareas

### 9.1 — Instalar dependencias

- `apps/api/package.json`: añadir `tsyringe`, `reflect-metadata`.
- `pnpm install --filter @acaixinha/api`.
- Configurar `experimentalDecorators` y `emitDecoratorMetadata` en `tsconfig.json` de api.
- Importar `reflect-metadata` en el entry point de cada Lambda.

### 9.2 — Providers de infraestructura

- `apps/api/src/shared/infrastructure/providers/DynamoDBProvider.ts`:
  - Registra `DynamoDBDocumentClient` como singleton.
  - Lee configuración de variables de entorno.
- `apps/api/src/shared/infrastructure/providers/S3Provider.ts`:
  - Registra `S3Client` como singleton.
- `apps/api/src/shared/infrastructure/providers/CognitoProvider.ts`:
  - Registra configuración de Cognito (userPoolId, clientId).

### 9.3 — Providers de User module

- `apps/api/src/user/infrastructure/providers/UserProvider.ts`:
  - `DITOKEN_IUSER_REPOSITORY` → `UserRepositoryImpl`.
  - `CreateUserUseCase`, `UpdateUserProfileUseCase`, etc. (transient o singleton según necesidad).
  - `CreateUserCommandHandler`, etc.

### 9.4 — Providers de Memory module

- `apps/api/src/memory/infrastructure/providers/MemoryProvider.ts`:
  - `DITOKEN_IMEMORY_REPOSITORY` → `MemoryRepositoryImpl`.
  - `MemorySharingService`.
  - Todos los use cases y command/query handlers.

### 9.5 — Providers de servicios compartidos

- `apps/api/src/shared/infrastructure/providers/SharedProvider.ts`:
  - `DITOKEN_IEVENT_BUS` → `InMemoryEventBus` (implementación simple para MVP).
  - `S3Service`, `S3KeyGenerator`, `FileValidator`.
  - `CognitoJwtVerifier`.

### 9.6 — Container factory por Lambda

- `apps/api/src/shared/infrastructure/di/container.ts`:
  - Función `createContainer(): InjectionToken`.
  - Registra todos los providers.
  - Exporta el contenedor configurado.
- Alternativa: usar `@autoInjectable()` en los handlers para resolución automática.

### 9.7 — InMemoryEventBus

- `apps/api/src/shared/infrastructure/events/InMemoryEventBus.ts`.
- Implementa `IEventBus`.
- `publish(event)`: invoca todos los handlers registrados para ese tipo de evento.
- `register(eventType, handler)`: registra un handler.
- Para MVP es suficiente. En producción se puede reemplazar por EventBridge/SQS sin cambiar la interfaz.

### 9.8 — Handler factory helper

- `apps/api/src/shared/infrastructure/delivery/createHandler.ts`.
- Helper que: crea el contenedor, resuelve el handler, y lo envuelve con `BaseLambdaHandler`.
- Simplifica el boilerplate en cada archivo de Lambda.

### 9.9 — Verificación de cableado

- Test de integración: levantar el contenedor, resolver un use case, verificar que todas las dependencias se inyectan correctamente.
- Sin errores de "No registration for token" en runtime.

## Notas

- `reflect-metadata` debe importarse una sola vez, antes que cualquier otra cosa, en cada entry point de Lambda.
- tsyringe usa `@injectable()` para marcar clases y `@inject()` para inyección de constructor.
- Los tokens se definen como `Symbol('Description')` en los archivos de puerto de dominio.
- Para testing, se puede crear un contenedor separado con mocks en lugar de implementaciones reales.
