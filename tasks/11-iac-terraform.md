# 11 — Infraestructura como Código (Terraform)

## Dependencias

- [06-infra-persistence](./06-infra-persistence.md) (diseño de tablas DynamoDB)
- [07-infra-api-auth](./07-infra-api-auth.md) (definición de Lambdas y API endpoints)
- [08-infra-file-storage](./08-infra-file-storage.md) (bucket S3 y políticas)
- [09-infra-di-wiring](./09-infra-di-wiring.md) (variables de entorno para Lambdas)

## Descripción

Definir toda la infraestructura AWS como código usando Terraform: S3 (frontend + archivos), CloudFront, DynamoDB, Cognito, Lambda, API Gateway, IAM roles/políticas.

## Criterios de Aceptación

- [ ] `terraform plan` y `terraform apply` crean todos los recursos.
- [ ] Entornos separados: dev y prod (workspaces o directorios).
- [ ] Estado de Terraform remoto en S3 + DynamoDB lock table.
- [ ] IAM con principio de mínimo privilegio.
- [ ] Variables sensibles nunca en código (usar `terraform.tfvars` en .gitignore o AWS Secrets Manager).
- [ ] Outputs con valores necesarios para CI/CD y frontend (API URL, CloudFront URL, Cognito IDs).

## Subtareas

### 11.1 — Estructura de directorios Terraform

```
iac/terraform/
├── main.tf              # Provider, backend, data sources
├── variables.tf          # Variables de entrada
├── outputs.tf            # Outputs
├── terraform.tfvars.example
├── modules/
│   ├── s3/               # Buckets (frontend, media)
│   ├── cloudfront/       # CDN distribución
│   ├── dynamodb/         # Tablas
│   ├── cognito/          # User Pool, App Client
│   ├── lambda/           # Funciones, layers, permisos
│   ├── api-gateway/      # REST API, recursos, integraciones
│   └── iam/              # Roles y políticas
├── environments/
│   ├── dev/
│   └── prod/
```

### 11.2 — Provider y Backend

- Provider: `aws` con región variable.
- Backend: S3 para estado remoto + DynamoDB para lock.
- Data sources: `aws_caller_identity`, `aws_region`.

### 11.3 — Módulo S3

- **Bucket frontend**: hosting estático habilitado, política pública de lectura (o acceso vía CloudFront OAI).
- **Bucket media**: privado, sin acceso público. CORS configurado para el dominio del frontend.
- **Bucket terraform state**: para el backend.
- Lifecycle rules: abortar multipart uploads incompletos, transición a Glacier opcional.
- Encryption: SSE-S3 o KMS.

### 11.4 — Módulo CloudFront

- Distribución para el bucket de frontend.
- Origin Access Identity (OAI) para restringir acceso directo a S3.
- Configuración de caché: SPA (index.html no cache, assets con hash cache larga duración).
- Custom domain y SSL certificate (opcional para MVP, usar dominio de CloudFront).

### 11.5 — Módulo DynamoDB

- **Tabla Users**: PK = `id` (String), billing mode PAY_PER_REQUEST.
- **Tabla Memories**: PK = `id` (String), billing mode PAY_PER_REQUEST.
  - GSI `ownerId-index`: PK = `ownerId` (String), SK = `memoryDate` (String).
- **Tabla MemoryShares**: PK = `userId` (String), SK = `memoryId` (String).
- **Tabla TerraformLock**: PK = `LockID` (String) para state locking.
- Point-in-time recovery habilitado en prod.

### 11.6 — Módulo Cognito

- **User Pool**:
  - Sign-up: email + password. Email verification required.
  - Attributes: `email`, `name`, `preferred_username` (username).
  - Alias: email y preferred_username.
  - Password policy: mínimo 8 chars, al menos 1 mayúscula, 1 número, 1 símbolo.
- **App Client**: sin secreto (para SPA), OAuth 2.0 con flujo authorization code + PKCE.
  - Callback/logout URLs del frontend.
  - Scopes: openid, profile, email.
- **Domain**: prefijo único para Hosted UI.
- **Lambda Triggers**: Post Confirmation → Lambda `postConfirmation`.

### 11.7 — Módulo Lambda

- Para cada Lambda definida en task 07 y 08:
  - `aws_lambda_function` con runtime nodejs22.x.
  - Handler: `<archivo>.handler`.
  - Código desde S3 (subido por CI/CD) o desde archivo local (en desarrollo).
  - Variables de entorno: `DYNAMODB_TABLE_USERS`, `DYNAMODB_TABLE_MEMORIES`, `DYNAMODB_TABLE_MEMORY_SHARES`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `S3_BUCKET_NAME`.
  - Timeout: 10s (3s para Lambdas simples), memory: 256MB (512MB para las de búsqueda).
- **Lambda Layer** (opcional): dependencias compartidas (aws-sdk, zod, tsyringe, reflect-metadata).
- **Role**: política IAM para DynamoDB (CRUD en sus tablas), S3 (pre-signed URLs), Cognito (admin actions), CloudWatch Logs.

### 11.8 — Módulo API Gateway

- **REST API** (no HTTP API, más control sobre autorización).
- **Authorizer**: Cognito User Pool authorizer.
- **Endpoints**:
  - `POST /users` — sin autorizador (trigger interno de Cognito).
  - `GET /users/{userId}` — autorizador Cognito.
  - `PATCH /users/{userId}` — autorizador Cognito.
  - `DELETE /users/{userId}` — autorizador Cognito.
  - `POST /memories` — autorizador Cognito.
  - `GET /memories` — autorizador Cognito.
  - `GET /memories/search` — autorizador Cognito.
  - `GET /memories/{memoryId}` — autorizador Cognito.
  - `PATCH /memories/{memoryId}` — autorizador Cognito.
  - `DELETE /memories/{memoryId}` — autorizador Cognito.
  - `POST /memories/{memoryId}/share` — autorizador Cognito.
  - `DELETE /memories/{memoryId}/share/{userId}` — autorizador Cognito.
  - `POST /memories/{memoryId}/upload-url` — autorizador Cognito.
  - `GET /memories/{memoryId}/attachments/{attachmentId}/download-url` — autorizador Cognito.
  - `POST /memories/{memoryId}/attachments/{attachmentId}/confirm` — autorizador Cognito.
  - `DELETE /memories/{memoryId}/attachments/{attachmentId}` — autorizador Cognito.
- **CORS**: habilitado para el dominio del frontend.
- **Stage**: `v1` (versionado de API).

### 11.9 — Módulo IAM

- **Lambda Execution Role**: permisos para DynamoDB, S3, Cognito, CloudWatch Logs.
- **Cognito Service Role**: permisos para enviar emails de verificación (SES opcional).
- **API Gateway CloudWatch Role**: permisos para logging.
- Políticas específicas por recurso (ARN de tablas, buckets).

### 11.10 — Variables y Outputs

- Variables de entrada:
  - `environment` (dev/prod).
  - `aws_region`.
  - `cognito_domain_prefix`.
  - `frontend_domain` (opcional para custom domain).
- Outputs:
  - `cloudfront_url`: URL del frontend.
  - `api_gateway_url`: URL base de la API.
  - `cognito_user_pool_id`: para configurar Lambdas.
  - `cognito_client_id`: para configurar frontend.
  - `s3_media_bucket_name`: para Lambdas.

### 11.11 — Entornos (dev / prod)

- `environments/dev/`: configuración con menores recursos (256MB Lambdas, DynamoDB on-demand).
- `environments/prod/`: configuración productiva (512MB Lambdas, point-in-time recovery, alarms CloudWatch).
- Módulos reutilizados vía `source = "../../modules/<name>"`.

### 11.12 — .gitignore y secretos

- `.gitignore`: `*.tfvars`, `.terraform/`, `terraform.tfstate*`.
- `terraform.tfvars.example` con valores de ejemplo.
- Documentar cómo configurar AWS credentials para Terraform.

## Notas

- AWS Free Tier cubre gran parte del MVP (1M requests API Gateway, 1M invocaciones Lambda, DynamoDB 25GB).
- Para desarrollo local se puede usar LocalStack como alternativa a DynamoDB Local + S3 mock.
- Custom domain y SSL certificate se dejan como mejora post-MVP.
- Se recomienda usar Terraform Cloud o GitHub Actions con OIDC para CI/CD en lugar de access keys manuales.
