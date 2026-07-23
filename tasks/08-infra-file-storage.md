# 08 — Infraestructura: Almacenamiento de Archivos (S3 Pre-signed URLs)

## Dependencias

- [05-application-memory](./05-application-memory.md) (AddAttachment use case)
- [07-infra-api-auth](./07-infra-api-auth.md) (Lambda handlers)

## Descripción

Implementar el sistema de subida y descarga de archivos mediante pre-signed URLs de S3. El frontend solicita una URL, el backend la genera y la devuelve, el frontend sube/descarga directamente a/de S3, y luego notifica al backend para registrar el Attachment en el Memory.

## Criterios de Aceptación

- [ ] Endpoint para generar pre-signed URL de subida (PUT).
- [ ] Endpoint para generar pre-signed URL de descarga (GET).
- [ ] Validación de tipos MIME permitidos.
- [ ] Límite de tamaño de archivo configurable (ej. 50MB).
- [ ] Estructura de carpetas en S3: `memories/{memoryId}/{attachmentId}-{timestamp}.{ext}`.
- [ ] Integración con el flujo de attachments (AddAttachmentCommand).

## Subtareas

### 8.1 — Instalar dependencias

- `apps/api/package.json`: añadir `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
- `pnpm install --filter @acaixinha/api`.

### 8.2 — S3 Service

- `apps/api/src/shared/infrastructure/storage/S3Service.ts`.
- `generateUploadUrl(bucket: string, key: string, contentType: string, expiresIn?: number): Promise<string>` — genera pre-signed URL para PUT.
- `generateDownloadUrl(bucket: string, key: string, expiresIn?: number): Promise<string>` — genera pre-signed URL para GET.
- `deleteObject(bucket: string, key: string): Promise<void>`.
- Configurable vía `S3_BUCKET_NAME`, `S3_REGION`.

### 8.3 — S3 Key generator

- `apps/api/src/shared/infrastructure/storage/S3KeyGenerator.ts`.
- `generateMemoryAttachmentKey(memoryId: string, attachmentId: string, mimeType: string): string`.
- Patrón: `memories/{memoryId}/{attachmentId}.{extension}`
- Extraer extensión del MIME type.

### 8.4 — Validación de archivos

- `apps/api/src/shared/infrastructure/storage/FileValidator.ts`.
- `ALLOWED_MIME_TYPES`: image/jpeg, image/png, image/gif, image/webp, video/mp4, video/webm, audio/mpeg, audio/ogg, application/pdf.
- `MAX_FILE_SIZE`: 50 * 1024 * 1024 (50MB).
- Validar MIME type contra lista blanca.
- Nota: el tamaño real se valida en S3 vía política de bucket o pre-signed URL conditions.

### 8.5 — Lambda Handlers para archivos

- `apps/api/src/lambdas/files/generateUploadUrl.ts`:
  - POST `/memories/{memoryId}/upload-url`.
  - Body: `{ mimeType: string }`.
  - Verifica que el usuario tiene acceso al memory (owner o shared).
  - Genera attachmentId (UUID), construye S3 key, genera pre-signed URL.
  - Devuelve `{ uploadUrl, attachmentId, s3Key }`.
- `apps/api/src/lambdas/files/generateDownloadUrl.ts`:
  - GET `/memories/{memoryId}/attachments/{attachmentId}/download-url`.
  - Verifica acceso al memory.
  - Genera pre-signed URL para GET.
  - Devuelve `{ downloadUrl }`.

### 8.6 — Flujo completo de subida

- `apps/api/src/lambdas/files/confirmAttachment.ts`:
  - POST `/memories/{memoryId}/attachments/{attachmentId}/confirm`.
  - Body: `{ description?: string }`.
  - El frontend llama a este endpoint después de subir exitosamente a S3.
  - Crea el Attachment en el Memory usando el use case `AddAttachmentUseCase`.
  - Flujo completo: getUploadUrl → upload a S3 → confirmAttachment.

### 8.7 — Eliminación de archivos

- Al eliminar un Attachment del Memory, eliminar también el objeto de S3.
- Al eliminar un Memory completo, eliminar todos sus archivos de S3.
- Usar `S3Service.deleteObject()`.

### 8.8 — Configuración de bucket S3

- Configuración de CORS para permitir subidas desde el frontend.
- Política de bucket: solo acceso vía pre-signed URLs.
- Lifecycle rules: opcionalmente, eliminar archivos huérfanos tras X días.

## Notas

- Las pre-signed URLs tienen expiración corta (5-15 minutos para upload, 1 hora para download).
- La configuración real del bucket S3 va en Terraform (task 11).
- Para archivos grandes (+50MB) considerar multipart upload en el futuro.
- El frontend es responsable de llamar a `confirmAttachment` solo tras una subida exitosa.
