# 10 — Frontend (React + Vite + shadcn/ui)

## Dependencias

- [01-setup-monorepo](./01-setup-monorepo.md) (workspace web creado)
- [04-application-user](./04-application-user.md) (DTOs y API contracts)
- [05-application-memory](./05-application-memory.md) (DTOs y API contracts)

## Descripción

Construir la SPA con React, Vite, shadcn/ui, TanStack Router, Zustand e i18n bilingüe (Español/Galego). El frontend consume la API serverless vía API Gateway + Cognito.

## Criterios de Aceptación

- [ ] App React funcional con Vite como bundler.
- [ ] shadcn/ui configurado con tema personalizado (Tailwind CSS).
- [ ] Sistema de i18n con Español y Galego funcionando.
- [ ] Autenticación completa: login, registro, confirmación, sesión.
- [ ] CRUD completo de Memories con UI pulida.
- [ ] Subida de archivos vía pre-signed URLs con feedback visual (progreso).
- [ ] Búsqueda y filtrado de memories.
- [ ] Compartición de memories.
- [ ] Diseño responsive (mobile-first).
- [ ] Código y nombres de variables en inglés.

## Subtareas

### 10.1 — Inicializar proyecto Vite + React

- Ejecutar `pnpm create vite apps/web --template react-ts`.
- Configurar `apps/web/tsconfig.json` con paths a `@acaixinha/shared`.
- Configurar Tailwind CSS siguiendo guía oficial para Vite.

### 10.2 — Configurar shadcn/ui

- Inicializar shadcn/ui (`npx shadcn@latest init`).
- Configurar tema: colores, border-radius, modo oscuro opcional.
- Instalar componentes base: Button, Input, Card, Dialog, DropdownMenu, Avatar, Badge, Separator, Skeleton, Toast, Textarea, Label, Form.

### 10.3 — Configurar i18n (ES/GL)

- Instalar `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
- `apps/web/src/i18n/config.ts`: configuración de i18next.
- `apps/web/src/i18n/locales/es.json`: traducciones al español.
- `apps/web/src/i18n/locales/gl.json`: traducciones al gallego.
- Language switcher en el header (toggle ES/GL).
- Persistir preferencia en localStorage.

### 10.4 — Configurar TanStack Router

- Instalar `@tanstack/react-router`.
- Crear `apps/web/src/routes/` con file-based routing.
- Rutas:
  - `/` — Home/Landing (pública).
  - `/login` — Login (pública).
  - `/register` — Registro (pública).
  - `/confirm` — Confirmación de email (pública).
  - `/app` — Layout autenticado.
  - `/app/memories` — Feed de memories (propias + compartidas).
  - `/app/memories/new` — Crear memory.
  - `/app/memories/$memoryId` — Ver memory.
  - `/app/memories/$memoryId/edit` — Editar memory (solo owner).
  - `/app/profile` — Perfil de usuario.
  - `/app/profile/edit` — Editar perfil.
- Route guards: redirigir a `/login` si no autenticado.

### 10.5 — Configurar Zustand stores

- `apps/web/src/stores/authStore.ts`:
  - `accessToken`, `idToken`, `refreshToken`, `user`, `isAuthenticated`.
  - `login(tokens)`, `logout()`, `refreshSession()`, `setUser(user)`.
- `apps/web/src/stores/memoryStore.ts`:
  - `memories`, `currentMemory`, `isLoading`, `filters`.
  - `fetchMemories()`, `fetchMemory(id)`, `createMemory()`, `updateMemory()`, `deleteMemory()`, `searchMemories(filters)`.
- `apps/web/src/stores/uiStore.ts`:
  - `language`, `theme`, `sidebarOpen`, `toasts`.
  - `toggleLanguage()`, `toggleTheme()`, `toggleSidebar()`.

### 10.6 — API Client

- `apps/web/src/lib/api/client.ts`:
  - Fetch wrapper con base URL configurable (`VITE_API_URL`).
  - Interceptor para añadir `Authorization: Bearer <token>`.
  - Interceptor para refrescar token si 401.
  - Tipado genérico con `ApiResponse<T>` de `@acaixinha/shared`.
- `apps/web/src/lib/api/auth.ts`:
  - `login(username, password)`, `register(username, password, email, name)`, `confirm(email, code)`, `refreshToken(refreshToken)`, `logout()`.
  - Integración con AWS Cognito via API (el backend expone o redirige a Cognito).
- `apps/web/src/lib/api/memories.ts`:
  - `getMemories()`, `getMemory(id)`, `createMemory(data)`, `updateMemory(id, data)`, `deleteMemory(id)`.
  - `searchMemories(filters)`, `shareMemory(id, userId)`, `unshareMemory(id, userId)`.
- `apps/web/src/lib/api/files.ts`:
  - `getUploadUrl(memoryId, mimeType)`, `confirmAttachment(memoryId, attachmentId, description)`.
  - `getDownloadUrl(memoryId, attachmentId)`.
  - Helper `uploadFile(url, file, onProgress)` para subir con XMLHttpRequest + progress.

### 10.7 — Componentes de Autenticación

- `LoginForm`: email + password + submit.
- `RegisterForm`: name + username + email + password + confirmar password.
- `ConfirmEmailForm`: email + código de verificación.
- `AuthGuard`: wrapper que redirige si no autenticado.

### 10.8 — Componentes de Layout

- `AppLayout`: sidebar + header + contenido.
- `Header`: logo, language switcher, user avatar/menu, notificaciones.
- `Sidebar`: navegación principal (Feed, Crear, Perfil).
- `MobileNavigation`: bottom bar para móvil.

### 10.9 — Componentes de Memory

- `MemoryCard`: tarjeta con título, descripción truncada, fecha, tags, ubicación, owner, nº attachments.
- `MemoryList`: grid/fila de MemoryCards con infinite scroll o paginación.
- `MemoryForm`: formulario crear/editar (título, descripción, fecha, ubicación con mapa opcional, tags con autocomplete).
- `MemoryDetail`: vista completa con attachments, botones de compartir/editar/eliminar.
- `MemorySearchBar`: input de búsqueda con filtros de tags y rango de fechas.
- `TagInput`: componente para añadir/eliminar tags con sugerencias.
- `LocationPicker`: input de ubicación con sugerencias (opcional: integración simple con API de geocoding).

### 10.10 — Componentes de Sharing

- `ShareMemoryDialog`: buscar usuario por username, seleccionar, confirmar.
- `SharedUsersList`: lista de usuarios con acceso al memory, botón para quitar acceso.

### 10.11 — Componentes de Attachments

- `AttachmentList`: grid de attachments (thumbnail según tipo MIME).
- `AttachmentUploader`: botón de subida, diálogo de selección de archivo, barra de progreso.
- `AttachmentCard`: preview según tipo (imagen, video, audio, PDF), descripción, quién subió.
- `AttachmentPreview`: modal/dialog para previsualizar (imagen, video, audio).
- Flujo completo: seleccionar archivo → getUploadUrl → upload a S3 con progreso → confirmAttachment.

### 10.12 — Páginas

- Implementar todas las páginas según las rutas definidas en 10.4.
- Cada página compone los componentes anteriores.
- Estados: loading (skeleton), empty, error, success.

### 10.13 — Configurar Vite para producción

- `vite.config.ts`: proxy para API en desarrollo, alias de paths, output config.
- Variables de entorno: `VITE_API_URL`, `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_REGION`.
- Build output configurado para S3 static hosting.

### 10.14 — Responsive design

- Mobile-first con Tailwind breakpoints.
- Sidebar colapsa en drawer en móvil.
- Memory grid: 1 columna móvil, 2 tablet, 3 desktop.
- Formularios adaptables.

## Notas

- Todo el texto visible en UI usa claves de i18n (nunca texto hardcodeado).
- Nombres de componentes, variables, funciones: en inglés.
- Los DTOs compartidos de `@acaixinha/shared` aseguran contratos tipados entre front y back.
- Para MVP se puede usar Cognito Hosted UI o implementar login customizado. Se recomienda Hosted UI para MVP por simplicidad.
- Si se usa Hosted UI de Cognito, los componentes de Login/Register redirigen a Cognito en lugar de manejar forms propios.
