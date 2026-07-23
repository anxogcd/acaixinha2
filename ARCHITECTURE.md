# Arquitectura Hexagonal - Guía de Referencia y Estándares

Este documento define los principios de la **Arquitectura Hexagonal (Ports & Adapters)**, **CQRS (Command Query Responsibility Segregation)** y **DDD (Domain-Driven Design)** que deben seguirse en este ecosistema de desarrollo.

## Regla de Oro: Dependencias

Las dependencias deben ir siempre hacia adentro, hacia el **Dominio**.

1. **Dominio**: No depende de nada.
2. **Aplicación**: Solo depende del Dominio.
3. **Infraestructura**: Depende de Aplicación y Dominio.

---

## Capas y Responsabilidades

### 1. Capa de Dominio (`domain/`)

Es el núcleo lógico del negocio. No conoce bases de datos, APIs ni frameworks.

- **Aggregates/Entities**: Objetos con identidad propia que gestionan invariantes de negocio. Deben extender la clase base de agregados del sistema (ej. `AggregateRoot`).
- **Value Objects (VOs)**: Objetos inmutables definidos por sus atributos (ej. `Email`, `Price`). Deben auto-validarse en su creación. Los VOs del mismo tipo primitivo deben usar **tipado nominal mediante branding** para que TypeScript impida intercambiarlos accidentalmente: una clase base genérica `StringVO<TBrand>` (o equivalente para otros primitivos) con un campo `declare private readonly _brand: TBrand` garantiza que dos VOs estructuralmente idénticos sean tipos distintos. El `declare` no emite código en runtime — coste cero.
- **Domain Services**: Lógica de negocio que involucra múltiples entidades o que no tiene un lugar claro en un agregado.
- **Repositories (Ports)**: Interfaces que definen el contrato de persistencia. El cableado con la implementación concreta se hace en las factories de infraestructura.
- **Domain Events**: Hechos que han ocurrido en el dominio (ej. `UserCreated`). Se publican tras persistir cambios.
- **Domain Exceptions**: Errores semánticos de negocio (ej. `InsufficientFundsException`).

### 2. Capa de Aplicación (`application/`)

Orquesta los casos de uso. Transforma datos de entrada en conceptos de dominio.

- **Use Cases**: Implementan la interfaz `IUseCase`. Son los orquestadores principales.
- **CQRS**:
  - **Commands**: Intenciones de cambio de estado.
  - **Queries**: Consultas de información (no deben mutar datos).
  - **Handlers**: Capturan comandos/queries, inyectan dependencias y ejecutan casos de uso.
- **DTOs (Data Transfer Objects)**: Objetos simples para mover datos entre capas sin exponer el dominio.

### 3. Capa de Infraestructura (`infrastructure/`)

Implementaciones técnicas y adaptadores.

- **Persistence Adaptors**: Implementaciones de los repositorios (ej. Mikro-ORM, TypeORM, Prisma).
- **Entry Points**: Controladores REST, Resolvers de GraphQL, Jobs de Cron o comandos de CLI.
- **Mappers**: Transforman objetos entre capas:
  - `Persistence -> Domain` (en repositorios).
  - `Domain -> Persistence` (en repositorios).
  - `Domain -> DTO/Response` (en la salida de la aplicación).
- **Providers/Modules**: Configuración del framework para el registro de dependencias.

---

## Scaffolding Estándar de un Módulo

```text
src/<module-name>/
├── application/
│   ├── commands/                # Handlers y definiciones de comandos
│   ├── queries/                 # Handlers y definiciones de queries
│   └── use-cases/               # Casos de uso (separados en read/write)
├── domain/
│   ├── constants/               # Enums y constantes
│   ├── exceptions/              # Excepciones de negocio
│   ├── events/                  # Eventos de dominio
│   ├── models/                  # Agregados y entidades de dominio
│   ├── repositories/            # Interfaces de repositorios + DI Tokens
│   ├── services/                # Servicios de dominio
│   └── value-objects/           # Objetos de valor
└── infrastructure/
    ├── entities/                # Modelos de persistencia/DB
    ├── delivery/                # REST Controllers, GraphQL Resolvers, etc.
    ├── repositories/            # Implementación de repositorios
    └── providers/               # Registro de DI y módulos del framework
```

---

## Convenciones de Desarrollo

### 1. Inyección de Dependencias (DI)

Para mantener el dominio puro, nunca inyectes una clase de infraestructura directamente. Usa interfaces y tokens:

- **Puerto**: `interface IUserRepository` en `domain/`.
- **Token**: `DITokenIUserRepository` en `domain/`.
- **Adaptador**: `UserRepositoryImpl` en `infrastructure/`.

### 2. Manejo de Errores

- El **Dominio** lanza excepciones de dominio.
- La **Infraestructura** (ej. Global Filters) captura estas excepciones y las traduce a códigos de error HTTP/GraphQL adecuados.

### 3. Eventos de Dominio

1. El Agregado registra el evento internamente (`record(event)`).
2. El Repositorio guarda el estado.
3. El Caso de Uso recupera los eventos del agregado y los publica en el `EventBus`.

### 4. Estrategia de Testing

- **Unit Tests**: Para lógica de Dominio (Modelos y VOs) y Casos de Uso (usando mocks de repositorios).
- **Integration Tests**: Para probar los Repositorios contra una base de datos real (o en memoria).
- **E2E Tests**: Para probar el flujo completo desde el punto de entrada (API) hasta la base de datos.

---

## Guía para añadir nueva funcionalidad

1. **Definir el Dominio**: Crear modelos, VOs y la interfaz del repositorio.
2. **Implementar el Caso de Uso**: Definir la lógica de aplicación.
3. **Crear el Entry Point**: Definir el Comando/Query y su Handler/Controlador.
4. **Implementar Persistencia**: Crear la entidad de base de datos y la implementación del repositorio.
5. **Configurar DI**: Registrar el nuevo componente en los proveedores/módulos.
6. **Verificar**: Añadir tests que cubran la nueva funcionalidad.
