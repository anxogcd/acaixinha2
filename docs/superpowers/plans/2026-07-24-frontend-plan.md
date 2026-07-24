# Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete React SPA for Acaixinha with Cognito Hosted UI auth, memory CRUD, file uploads, sharing, search, and bilingual i18n (ES/GL).

**Architecture:** React + Vite + TanStack Router (file-based) + Zustand stores + shadcn/ui components + i18next. The app consumes the serverless REST API via a typed fetch client that handles Cognito JWT token lifecycle. Auth flows through Cognito Hosted UI with PKCE.

**Tech Stack:** React 19, Vite 6, Tailwind CSS 4, shadcn/ui, TanStack Router, Zustand, i18next, Zod

## Global Constraints

- All user-facing text uses i18n keys (never hardcoded Spanish/Galego)
- Component/variable/function names in English
- Shared DTOs from `@acaixinha/shared` used for typed API contracts
- Cognito Hosted UI for auth (no custom login/register forms)
- Four states for every data component: loading (skeleton), empty, error (retry), data
- Mobile-first responsive: 1 col mobile, 2 tablet, 3 desktop
- API base URL from `VITE_API_URL` env var

---

### Task 1: Update shared DTOs + install frontend dependencies

**Files:**
- Modify: `packages/shared/src/dtos/UserDTO.ts`
- Modify: `packages/shared/src/dtos/MemoryDTO.ts`
- Modify: `packages/shared/src/dtos/AttachmentDTO.ts`
- Modify: `packages/shared/src/dtos/PaginatedResponse.ts`
- Modify: `apps/web/package.json`

**Interfaces:**
- Produces: Updated shared DTOs matching API response shapes
- Produces: `apps/web/package.json` with all frontend dependencies

- [ ] **Step 1: Update UserDTO to match API UserResponseDTO**

```typescript
// packages/shared/src/dtos/UserDTO.ts
export interface UserDTO {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Update MemoryDTO with full fields**

```typescript
// packages/shared/src/dtos/MemoryDTO.ts
export interface AttachmentResponseDTO {
  id: string;
  s3Key: string;
  mimeType: string;
  description: string | null;
  uploadedByUserId: string;
  uploadedAt: string;
}

export interface MemoryDTO {
  id: string;
  title: string;
  description: string;
  memoryDate: string;
  locationName: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  ownerId: string;
  tags: string[];
  sharedWithUserIds: string[];
  attachments: AttachmentResponseDTO[];
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: Update AttachmentDTO to match actual response**

```typescript
// packages/shared/src/dtos/AttachmentDTO.ts
export interface UploadUrlResponse {
  uploadUrl: string;
  attachmentId: string;
  s3Key: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
}
```

- [ ] **Step 4: Update PaginatedResponse**

```typescript
// packages/shared/src/dtos/PaginatedResponse.ts
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```
No changes needed — already correct.

- [ ] **Step 5: Install all frontend dependencies**

```bash
pnpm add --filter @acaixinha/web react-router-dom @tanstack/react-router zustand i18next react-i18next i18next-browser-languagedetector
```
Wait — TanStack Router uses `@tanstack/react-router`, not `react-router-dom`. Let me use the correct packages.

```bash
pnpm add --filter @acaixinha/web zustand i18next react-i18next i18next-browser-languagedetector lucide-react @tanstack/react-router

pnpm add --filter @acaixinha/web -D @tailwindcss/vite tailwindcss @tanstack/router-plugin @tanstack/router-generator
```

- [ ] **Step 6: Verify shared DTOs are importable**

```bash
pnpm run build --filter @acaixinha/shared
```
Expected: builds successfully.

- [ ] **Step 7: Commit**

```bash
git add packages/shared/src/dtos/ apps/web/package.json pnpm-lock.yaml
git commit -m "feat: update shared DTOs for frontend + install web dependencies"
```

---

### Task 2: Tailwind CSS + shadcn/ui + Vite configuration

**Files:**
- Create: `apps/web/src/globals.css`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/index.html`

**Interfaces:**
- Produces: Tailwind CSS v4 configured with Vite plugin
- Produces: Vite proxy for `/api` → `http://localhost:3000`
- Produces: Vite path aliases for `@` → `src/`

- [ ] **Step 1: Create globals.css with Tailwind v4**

```css
/* apps/web/src/globals.css */
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 2: Update index.html with lang attribute**

```html
<!-- apps/web/index.html -->
<!doctype html>
<html lang="gl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>A Caixiña dos Recordos</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Update vite.config.ts**

```typescript
// apps/web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```

Note: For development the local Express server runs on port 3000 and the frontend proxies requests. In production, the API Gateway URL is used directly and configured via `VITE_API_URL`.

- [ ] **Step 4: Verify Vite dev server starts**

```bash
pnpm --filter @acaixinha/web dev &
sleep 3
curl -s http://localhost:5173 | head -5
kill %1
```
Expected: HTML response with the app shell.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/globals.css apps/web/vite.config.ts apps/web/index.html
git commit -m "feat(web): configure Tailwind CSS v4, Vite proxy, and path aliases"
```

---

### Task 3: i18n setup

**Files:**
- Create: `apps/web/src/i18n/config.ts`
- Create: `apps/web/src/i18n/locales/es.json`
- Create: `apps/web/src/i18n/locales/gl.json`

**Interfaces:**
- Produces: `i18n` instance configured with ES/GL, localStorage detection, namespaces

- [ ] **Step 1: Create i18n config**

```typescript
// apps/web/src/i18n/config.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import es from "./locales/es.json";
import gl from "./locales/gl.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      gl: { translation: gl },
    },
    fallbackLng: "gl",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
```

- [ ] **Step 2: Create es.json**

```json
// apps/web/src/i18n/locales/es.json
{
  "common": {
    "appName": "La Cajita de los Recuerdos",
    "loading": "Cargando...",
    "error": "Algo salió mal",
    "retry": "Reintentar",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "create": "Crear",
    "search": "Buscar",
    "noResults": "No se encontraron resultados",
    "back": "Volver",
    "confirm": "Confirmar",
    "close": "Cerrar"
  },
  "auth": {
    "login": "Iniciar sesión",
    "logout": "Cerrar sesión",
    "register": "Registrarse",
    "profile": "Perfil",
    "editProfile": "Editar perfil",
    "welcome": "Bienvenido",
    "loginPrompt": "Inicia sesión para acceder a tus recuerdos",
    "registerPrompt": "Crea una cuenta para empezar"
  },
  "memories": {
    "title": "Recuerdos",
    "myMemories": "Mis Recuerdos",
    "sharedWithMe": "Compartidos conmigo",
    "createMemory": "Crear Recuerdo",
    "editMemory": "Editar Recuerdo",
    "deleteMemory": "Eliminar Recuerdo",
    "deleteConfirm": "¿Estás seguro de que quieres eliminar este recuerdo?",
    "noMemories": "Aún no hay recuerdos. ¡Crea el primero!",
    "memoryDate": "Fecha del recuerdo",
    "location": "Ubicación",
    "tags": "Etiquetas",
    "addTag": "Añadir etiqueta...",
    "coordinates": "Coordenadas",
    "latitude": "Latitud",
    "longitude": "Longitud",
    "description": "Descripción",
    "titlePlaceholder": "Título del recuerdo",
    "descriptionPlaceholder": "Describe este recuerdo...",
    "locationPlaceholder": "Nombre del lugar",
    "searchPlaceholder": "Buscar recuerdos...",
    "filterByTags": "Filtrar por etiquetas",
    "filterByDate": "Filtrar por fecha",
    "dateFrom": "Desde",
    "dateTo": "Hasta",
    "clearFilters": "Limpiar filtros",
    "memoryCreated": "Recuerdo creado",
    "memoryUpdated": "Recuerdo actualizado",
    "memoryDeleted": "Recuerdo eliminado"
  },
  "sharing": {
    "share": "Compartir",
    "unshare": "Dejar de compartir",
    "shareWith": "Compartir con...",
    "searchByUsername": "Buscar por nombre de usuario",
    "sharedWith": "Compartido con",
    "notShared": "No compartido con nadie",
    "memoryShared": "Recuerdo compartido",
    "memoryUnshared": "Recuerdo compartido eliminado"
  },
  "attachments": {
    "title": "Archivos adjuntos",
    "upload": "Subir archivo",
    "uploading": "Subiendo...",
    "noAttachments": "No hay archivos adjuntos",
    "addAttachment": "Añadir archivo",
    "uploadSuccess": "Archivo subido correctamente",
    "uploadError": "Error al subir el archivo",
    "confirmUpload": "Confirmar subida",
    "description": "Descripción del archivo"
  },
  "profile": {
    "title": "Perfil",
    "name": "Nombre",
    "username": "Nombre de usuario",
    "description": "Descripción",
    "avatarUrl": "URL del avatar",
    "noDescription": "Sin descripción",
    "profileUpdated": "Perfil actualizado",
    "memoriesCount": "Recuerdos creados"
  }
}
```

- [ ] **Step 3: Create gl.json**

```json
// apps/web/src/i18n/locales/gl.json
{
  "common": {
    "appName": "A Caixiña dos Recordos",
    "loading": "Cargando...",
    "error": "Algo foi mal",
    "retry": "Reintentar",
    "save": "Gardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "create": "Crear",
    "search": "Buscar",
    "noResults": "Non se atoparon resultados",
    "back": "Volver",
    "confirm": "Confirmar",
    "close": "Pechar"
  },
  "auth": {
    "login": "Iniciar sesión",
    "logout": "Pechar sesión",
    "register": "Rexistrarse",
    "profile": "Perfil",
    "editProfile": "Editar perfil",
    "welcome": "Benvido",
    "loginPrompt": "Inicia sesión para acceder aos teus recordos",
    "registerPrompt": "Crea unha conta para comezar"
  },
  "memories": {
    "title": "Recordos",
    "myMemories": "Os Meus Recordos",
    "sharedWithMe": "Compartidos comigo",
    "createMemory": "Crear Recordo",
    "editMemory": "Editar Recordo",
    "deleteMemory": "Eliminar Recordo",
    "deleteConfirm": "Estás seguro de que queres eliminar este recordo?",
    "noMemories": "Aínda non hai recordos. Crea o primeiro!",
    "memoryDate": "Data do recordo",
    "location": "Localización",
    "tags": "Etiquetas",
    "addTag": "Engadir etiqueta...",
    "coordinates": "Coordenadas",
    "latitude": "Latitude",
    "longitude": "Lonxitude",
    "description": "Descrición",
    "titlePlaceholder": "Título do recordo",
    "descriptionPlaceholder": "Describe este recordo...",
    "locationPlaceholder": "Nome do lugar",
    "searchPlaceholder": "Buscar recordos...",
    "filterByTags": "Filtrar por etiquetas",
    "filterByDate": "Filtrar por data",
    "dateFrom": "Dende",
    "dateTo": "Ata",
    "clearFilters": "Limpar filtros",
    "memoryCreated": "Recordo creado",
    "memoryUpdated": "Recordo actualizado",
    "memoryDeleted": "Recordo eliminado"
  },
  "sharing": {
    "share": "Compartir",
    "unshare": "Deixar de compartir",
    "shareWith": "Compartir con...",
    "searchByUsername": "Buscar por nome de usuario",
    "sharedWith": "Compartido con",
    "notShared": "Non compartido con ninguén",
    "memoryShared": "Recordo compartido",
    "memoryUnshared": "Compartición eliminada"
  },
  "attachments": {
    "title": "Arquivos adxuntos",
    "upload": "Subir arquivo",
    "uploading": "Subindo...",
    "noAttachments": "Non hai arquivos adxuntos",
    "addAttachment": "Engadir arquivo",
    "uploadSuccess": "Arquivo subido correctamente",
    "uploadError": "Erro ao subir o arquivo",
    "confirmUpload": "Confirmar subida",
    "description": "Descrición do arquivo"
  },
  "profile": {
    "title": "Perfil",
    "name": "Nome",
    "username": "Nome de usuario",
    "description": "Descrición",
    "avatarUrl": "URL do avatar",
    "noDescription": "Sen descrición",
    "profileUpdated": "Perfil actualizado",
    "memoriesCount": "Recordos creados"
  }
}
```

- [ ] **Step 4: Verify i18n imports without errors**

```bash
pnpm --filter @acaixinha/web typecheck 2>&1 | tail -5
```
Expected: no errors (may show web-only errors unrelated to i18n).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/i18n/
git commit -m "feat(web): add i18n with ES/GL translations"
```

---

### Task 4: API client + Cognito auth helpers

**Files:**
- Create: `apps/web/src/lib/api/client.ts`
- Create: `apps/web/src/lib/cognito.ts`

**Interfaces:**
- Produces: `apiClient` — typed fetch wrapper with JWT injection, 401 refresh, base URL
- Produces: `CognitoAuth` — class with `getAuthUrl()`, `handleCallback(code)`, `getLogoutUrl()`, `getUserFromToken(idToken)`

- [ ] **Step 1: Create Cognito auth helper**

```typescript
// apps/web/src/lib/cognito.ts

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI;
const REGION = import.meta.env.VITE_COGNITO_REGION;

export interface TokenSet {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function getAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: REDIRECT_URI,
  });
  return `https://${COGNITO_DOMAIN}.auth.${REGION}.amazoncognito.com/oauth2/authorize?${params}`;
}

export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: REDIRECT_URI,
  });
  return `https://${COGNITO_DOMAIN}.auth.${REGION}.amazoncognito.com/logout?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenSet> {
  const tokenEndpoint = `https://${COGNITO_DOMAIN}.auth.${REGION}.amazoncognito.com/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for tokens");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function refreshTokens(refreshToken: string): Promise<TokenSet> {
  const tokenEndpoint = `https://${COGNITO_DOMAIN}.auth.${REGION}.amazoncognito.com/oauth2/token`;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh tokens");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export function parseIdToken(idToken: string): { sub: string; username: string; email: string } {
  const payload = JSON.parse(atob(idToken.split(".")[1]));
  return {
    sub: payload.sub,
    username: payload["cognito:username"] ?? payload.sub,
    email: payload.email ?? "",
  };
}
```

- [ ] **Step 2: Create API client**

```typescript
// apps/web/src/lib/api/client.ts
import type { ApiError } from "@acaixinha/shared";
import { useAuthStore } from "../../stores/authStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

async function getAccessToken(): Promise<string | null> {
  const auth = useAuthStore.getState();
  if (!auth.accessToken) return null;

  if (auth.expiresAt && Date.now() > auth.expiresAt) {
    try {
      await auth.refreshAuth();
    } catch {
      auth.logout();
      return null;
    }
  }

  return auth.accessToken;
}

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ApiError | null = null;
    try {
      errorData = await response.json();
    } catch {
      // noop
    }

    if (response.status === 401) {
      useAuthStore.getState().logout();
    }

    throw new ApiClientError(
      response.status,
      errorData?.code ?? "UNKNOWN",
      errorData?.message ?? response.statusText,
    );
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: "DELETE" });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/
git commit -m "feat(web): add Cognito auth helpers and typed API client"
```

---

### Task 5: Zustand stores

**Files:**
- Create: `apps/web/src/stores/authStore.ts`
- Create: `apps/web/src/stores/memoryStore.ts`
- Create: `apps/web/src/stores/uiStore.ts`

**Interfaces:**
- Produces: `useAuthStore` — auth state + login/logout/refresh/setUser
- Produces: `useMemoryStore` — memories CRUD + search + sharing + attachments
- Produces: `useUiStore` — language, sidebar, toasts

- [ ] **Step 1: Create authStore**

```typescript
// apps/web/src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserDTO } from "@acaixinha/shared";
import {
  type TokenSet,
  refreshTokens,
  parseIdToken,
  getLogoutUrl,
} from "../lib/cognito";
import { apiGet, apiPatch } from "../lib/api/client";

interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: UserDTO | null;
  isAuthenticated: boolean;

  setSession: (tokens: TokenSet) => void;
  setUser: (user: UserDTO) => void;
  refreshAuth: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    avatarUrl?: string;
    description?: string;
  }) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      idToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,

      setSession: (tokens: TokenSet) => {
        const claims = parseIdToken(tokens.idToken);
        set({
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          isAuthenticated: true,
        });

        get().fetchUser();
      },

      setUser: (user: UserDTO) => set({ user }),

      refreshAuth: async () => {
        const state = get();
        if (!state.refreshToken) throw new Error("No refresh token");
        const tokens = await refreshTokens(state.refreshToken);
        set({
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        });
      },

      fetchUser: async () => {
        const state = get();
        if (!state.idToken) return;
        const claims = parseIdToken(state.idToken);
        try {
          const user = await apiGet<UserDTO>(`/users/${claims.sub}`);
          set({ user });
        } catch {
          // User may not exist yet (just registered)
        }
      },

      updateProfile: async (data) => {
        const state = get();
        if (!state.user) return;
        const updated = await apiPatch<UserDTO>(`/users/${state.user.id}`, data);
        set({ user: updated });
      },

      logout: () => {
        set({
          accessToken: null,
          idToken: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
          isAuthenticated: false,
        });
        window.location.href = getLogoutUrl();
      },
    }),
    {
      name: "acaixinha-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        idToken: state.idToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

- [ ] **Step 2: Create memoryStore**

```typescript
// apps/web/src/stores/memoryStore.ts
import { create } from "zustand";
import type { MemoryDTO } from "@acaixinha/shared";
import type { PaginatedResponse } from "@acaixinha/shared";
import { apiGet, apiPost, apiPatch, apiDelete } from "../lib/api/client";

interface MemoryFilters {
  text?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

interface MemoryState {
  memories: MemoryDTO[];
  currentMemory: MemoryDTO | null;
  isLoading: boolean;
  error: string | null;
  filters: MemoryFilters;

  fetchMemories: () => Promise<void>;
  fetchMemory: (id: string) => Promise<void>;
  createMemory: (data: {
    title: string;
    description: string;
    memoryDate: string;
    locationName?: string;
    coordinates?: { lat: number; lng: number };
    tags?: string[];
  }) => Promise<MemoryDTO>;
  updateMemory: (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      memoryDate: string;
      locationName: string | null;
      coordinates: { lat: number; lng: number } | null;
      tags: string[];
    }>,
  ) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  searchMemories: (filters: MemoryFilters) => Promise<void>;
  shareMemory: (memoryId: string, targetUserId: string) => Promise<void>;
  unshareMemory: (memoryId: string, targetUserId: string) => Promise<void>;
  setFilters: (filters: MemoryFilters) => void;
  clearError: () => void;
}

export const useMemoryStore = create<MemoryState>()((set, get) => ({
  memories: [],
  currentMemory: null,
  isLoading: false,
  error: null,
  filters: {},

  fetchMemories: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<MemoryDTO[]>("/memories");
      set({ memories: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  fetchMemory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiGet<MemoryDTO>(`/memories/${id}`);
      set({ currentMemory: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createMemory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const memory = await apiPost<MemoryDTO>("/memories", data);
      set((s) => ({ memories: [memory, ...s.memories], isLoading: false }));
      return memory;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  updateMemory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await apiPatch<MemoryDTO>(`/memories/${id}`, data);
      set((s) => ({
        memories: s.memories.map((m) => (m.id === id ? updated : m)),
        currentMemory: s.currentMemory?.id === id ? updated : s.currentMemory,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  deleteMemory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiDelete(`/memories/${id}`);
      set((s) => ({
        memories: s.memories.filter((m) => m.id !== id),
        currentMemory: s.currentMemory?.id === id ? null : s.currentMemory,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      throw err;
    }
  },

  searchMemories: async (filters: MemoryFilters) => {
    set({ isLoading: true, error: null, filters });
    try {
      const params = new URLSearchParams();
      if (filters.text) params.set("text", filters.text);
      if (filters.tags?.length) params.set("tags", filters.tags.join(","));
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      const data = await apiGet<MemoryDTO[]>(`/memories/search?${params}`);
      set({ memories: data, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  shareMemory: async (memoryId: string, targetUserId: string) => {
    await apiPost(`/memories/${memoryId}/share`, { targetUserId });
    get().fetchMemory(memoryId);
  },

  unshareMemory: async (memoryId: string, targetUserId: string) => {
    await apiDelete(`/memories/${memoryId}/share/${targetUserId}`);
    get().fetchMemory(memoryId);
  },

  setFilters: (filters: MemoryFilters) => set({ filters }),

  clearError: () => set({ error: null }),
}));
```

- [ ] **Step 3: Create uiStore**

```typescript
// apps/web/src/stores/uiStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "es" | "gl";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface UiState {
  language: Language;
  sidebarOpen: boolean;
  toasts: Toast[];

  setLanguage: (lang: Language) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      language: "gl",
      sidebarOpen: true,
      toasts: [],

      setLanguage: (language: Language) => set({ language }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      setSidebarOpen: (sidebarOpen: boolean) => set({ sidebarOpen }),

      addToast: (toast) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { ...toast, id: Math.random().toString(36).slice(2) },
          ],
        })),

      removeToast: (id: string) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: "acaixinha-ui",
      partialize: (state) => ({ language: state.language }),
    },
  ),
);
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/
git commit -m "feat(web): add Zustand stores (auth, memory, ui)"
```

---

### Task 6: AuthGuard + Callback route + Login route

**Files:**
- Create: `apps/web/src/components/auth/AuthGuard.tsx`
- Create: `apps/web/src/routes/login.tsx`
- Create: `apps/web/src/routes/callback.tsx`

**Interfaces:**
- Produces: `AuthGuard` component — redirects to `/login` if !isAuthenticated
- Produces: `/login` route — redirects to Cognito Hosted UI
- Produces: `/callback` route — handles OAuth code exchange

- [ ] **Step 1: Create AuthGuard component**

```tsx
// apps/web/src/components/auth/AuthGuard.tsx
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/authStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Create Login route**

```tsx
// apps/web/src/routes/login.tsx
import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getAuthUrl } from "../lib/cognito";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  useEffect(() => {
    window.location.href = getAuthUrl();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  );
}
```

- [ ] **Step 3: Create Callback route**

```tsx
// apps/web/src/routes/callback.tsx
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { exchangeCodeForTokens } from "../lib/cognito";
import { useAuthStore } from "../stores/authStore";

export const Route = createFileRoute("/callback")({
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!code) {
      setError("No authorization code received");
      return;
    }

    exchangeCodeForTokens(code)
      .then((tokens) => {
        setSession(tokens);
        navigate({ to: "/app/memories" });
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [navigate, setSession]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">Authentication failed: {error}</p>
        <a href="/login" className="text-primary underline">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing in...</p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/auth/ apps/web/src/routes/login.tsx apps/web/src/routes/callback.tsx
git commit -m "feat(web): add AuthGuard, login redirect, and Cognito callback route"
```

---

### Task 7: Layout components

**Files:**
- Create: `apps/web/src/components/layout/Header.tsx`
- Create: `apps/web/src/components/layout/Sidebar.tsx`
- Create: `apps/web/src/components/layout/MobileNavigation.tsx`
- Create: `apps/web/src/components/layout/AppLayout.tsx`

**Interfaces:**
- Produces: `AppLayout` — full app shell with sidebar, header, and content area
- Consumes: `useAuthStore`, `useUiStore`

- [ ] **Step 1: Create Header component**

```tsx
// apps/web/src/components/layout/Header.tsx
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useAuthStore } from "../../stores/authStore";
import { useUiStore } from "../../stores/uiStore";
import { Menu, LogOut, User } from "lucide-react";

export function Header() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const language = useUiStore((s) => s.language);
  const setLanguage = useUiStore((s) => s.setLanguage);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-1.5 hover:bg-accent md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/app/memories" className="font-semibold">
          {t("common.appName")}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setLanguage(language === "es" ? "gl" : "es")}
          className="rounded-md px-2 py-1 text-sm font-medium hover:bg-accent"
        >
          {language === "es" ? "GL" : "ES"}
        </button>

        <Link
          to="/app/profile"
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{user?.name}</span>
        </Link>

        <button
          onClick={logout}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={t("auth.logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Create Sidebar component**

```tsx
// apps/web/src/components/layout/Sidebar.tsx
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "@tanstack/react-router";
import { useUiStore } from "../../stores/uiStore";
import { LayoutGrid, PlusCircle, User, X } from "lucide-react";

const links = [
  { to: "/app/memories", icon: LayoutGrid, label: "memories.myMemories" },
  { to: "/app/memories/new", icon: PlusCircle, label: "memories.createMemory" },
  { to: "/app/profile", icon: User, label: "auth.profile" },
];

export function Sidebar() {
  const { t } = useTranslation();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const location = useLocation();

  const isActive = (to: string) => location.pathname === to;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r bg-background transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <span className="font-semibold">{t("common.appName")}</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {links.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive(to)
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(label)}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
```

- [ ] **Step 3: Create MobileNavigation component**

```tsx
// apps/web/src/components/layout/MobileNavigation.tsx
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "@tanstack/react-router";
import { LayoutGrid, PlusCircle, User } from "lucide-react";

const links = [
  { to: "/app/memories", icon: LayoutGrid, label: "memories.myMemories" },
  { to: "/app/memories/new", icon: PlusCircle, label: "memories.createMemory" },
  { to: "/app/profile", icon: User, label: "auth.profile" },
];

export function MobileNavigation() {
  const { t } = useTranslation();
  const location = useLocation();

  const isActive = (to: string) => location.pathname === to;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
      <div className="flex h-14 items-center justify-around">
        {links.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
              isActive(to)
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{t(label)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Create AppLayout component**

```tsx
// apps/web/src/components/layout/AppLayout.tsx
import { Outlet } from "@tanstack/react-router";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNavigation } from "./MobileNavigation";

export function AppLayout() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
          <Outlet />
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout/
git commit -m "feat(web): add layout components (Header, Sidebar, MobileNavigation, AppLayout)"
```

---

### Task 8: Landing page + app layout route

**Files:**
- Create: `apps/web/src/routes/__root.tsx`
- Create: `apps/web/src/routes/index.tsx`
- Create: `apps/web/src/routes/app/__layout.tsx`

**Interfaces:**
- Produces: Root route with i18n provider + outlet
- Produces: `/` landing page (public, CTA to login)
- Produces: `/app/*` auth-guarded layout

- [ ] **Step 1: Create __root.tsx**

```tsx
// apps/web/src/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n/config";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <I18nextProvider i18n={i18n}>
      <Outlet />
    </I18nextProvider>
  );
}
```

- [ ] **Step 2: Create Landing page**

```tsx
// apps/web/src/routes/index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../stores/authStore";
import { LogIn, Heart, Share2, Image } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const features = [
    {
      icon: Heart,
      title: "Guarda os teus recordos",
      description: "Crea e organiza os momentos que importan",
    },
    {
      icon: Share2,
      title: "Comparte cos teus",
      description: "Convida a familia e amigos aos teus recordos",
    },
    {
      icon: Image,
      title: "Engade fotos e vídeos",
      description: "Documenta cada recordo con arquivos multimedia",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-4">
        <span className="font-semibold">{t("common.appName")}</span>
        {isAuthenticated ? (
          <Link
            to="/app/memories"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            Ir aos recordos
          </Link>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            <LogIn className="h-4 w-4" />
            {t("auth.login")}
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("common.appName")}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            O lugar onde gardas e compartes os teus recordos máis queridos
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3 max-w-3xl">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        {!isAuthenticated && (
          <div className="flex gap-4">
            <Link
              to="/login"
              className="rounded-md bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("auth.login")}
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        A Caixiña dos Recordos &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Create app layout route**

```tsx
// apps/web/src/routes/app/__layout.tsx
import { createFileRoute } from "@tanstack/react-router";
import { AuthGuard } from "../../components/auth/AuthGuard";
import { AppLayout } from "../../components/layout/AppLayout";

export const Route = createFileRoute("/app/__layout")({
  component: AppLayoutWrapper,
});

function AppLayoutWrapper() {
  return (
    <AuthGuard>
      <AppLayout />
    </AuthGuard>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/__root.tsx apps/web/src/routes/index.tsx apps/web/src/routes/app/__layout.tsx
git commit -m "feat(web): add root route, landing page, and app layout route"
```

---

### Task 9: MemoryCard + MemoryList + MemorySearchBar + TagInput

**Files:**
- Create: `apps/web/src/components/memories/TagInput.tsx`
- Create: `apps/web/src/components/memories/MemoryCard.tsx`
- Create: `apps/web/src/components/memories/MemorySearchBar.tsx`
- Create: `apps/web/src/components/memories/MemoryList.tsx`

**Interfaces:**
- Produces: `TagInput` — input for adding/removing tags with chip display
- Produces: `MemoryCard` — summary card with title, description, date, tags, location
- Produces: `MemorySearchBar` — text search + tag filter + date range
- Produces: `MemoryList` — responsive grid with loading/empty/error states

- [ ] **Step 1: Create TagInput component**

```tsx
// apps/web/src/components/memories/TagInput.tsx
import { useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim().toLowerCase().replace(/\s+/g, "_");
    if (tag && !tags.includes(tag) && /^[a-z0-9_-]+$/.test(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border px-3 py-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="rounded-full p-0.5 hover:bg-background"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? t("memories.addTag") : ""}
        className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create MemoryCard component**

```tsx
// apps/web/src/components/memories/MemoryCard.tsx
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { MemoryDTO } from "@acaixinha/shared";
import { Calendar, MapPin, Paperclip, Users } from "lucide-react";

interface MemoryCardProps {
  memory: MemoryDTO;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const { t } = useTranslation();
  const date = new Date(memory.memoryDate);

  return (
    <Link
      to="/app/memories/$memoryId"
      params={{ memoryId: memory.id }}
      className="group flex flex-col gap-3 rounded-lg border p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium leading-tight group-hover:text-primary">
          {memory.title}
        </h3>
      </div>

      <p className="line-clamp-2 text-sm text-muted-foreground">
        {memory.description}
      </p>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {date.toLocaleDateString()}
        </span>
        {memory.locationName && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {memory.locationName}
          </span>
        )}
        {memory.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Paperclip className="h-3 w-3" />
            {memory.attachments.length}
          </span>
        )}
        {memory.sharedWithUserIds.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {memory.sharedWithUserIds.length}
          </span>
        )}
      </div>

      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

export function MemoryCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 animate-pulse">
      <div className="h-5 w-2/3 rounded bg-muted" />
      <div className="h-4 w-full rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-5 w-12 rounded-full bg-muted" />
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create MemorySearchBar component**

```tsx
// apps/web/src/components/memories/MemorySearchBar.tsx
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Search, Calendar, X } from "lucide-react";

interface MemorySearchBarProps {
  onSearch: (filters: {
    text?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
  }) => void;
}

export function MemorySearchBar({ onSearch }: MemorySearchBarProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch({
      text: text || undefined,
      tags: tagsInput ? tagsInput.split(",").map((t) => t.trim()) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const clearFilters = () => {
    setText("");
    setTagsInput("");
    setDateFrom("");
    setDateTo("");
    onSearch({});
  };

  const hasFilters = text || tagsInput || dateFrom || dateTo;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("memories.searchPlaceholder")}
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowDateFilter(!showDateFilter)}
          className={`rounded-md border p-2 ${showDateFilter ? "bg-accent" : ""}`}
          title={t("memories.filterByDate")}
        >
          <Calendar className="h-4 w-4" />
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("common.search")}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder={t("memories.filterByTags")}
          className="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>

      {showDateFilter && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">
            {t("memories.dateFrom")}:
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          />
          <label className="text-sm text-muted-foreground">
            {t("memories.dateTo")}:
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          />
        </div>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
          {t("memories.clearFilters")}
        </button>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Create MemoryList component**

```tsx
// apps/web/src/components/memories/MemoryList.tsx
import { useTranslation } from "react-i18next";
import { MemoryCard, MemoryCardSkeleton } from "./MemoryCard";
import type { MemoryDTO } from "@acaixinha/shared";
import { Inbox } from "lucide-react";

interface MemoryListProps {
  memories: MemoryDTO[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function MemoryList({ memories, isLoading, error, onRetry }: MemoryListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MemoryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-destructive">{t("common.error")}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <Inbox className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{t("memories.noMemories")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/memories/TagInput.tsx apps/web/src/components/memories/MemoryCard.tsx apps/web/src/components/memories/MemorySearchBar.tsx apps/web/src/components/memories/MemoryList.tsx
git commit -m "feat(web): add MemoryCard, MemoryList, MemorySearchBar, and TagInput components"
```

---

### Task 10: MemoryForm (create + edit)

**Files:**
- Create: `apps/web/src/components/memories/MemoryForm.tsx`

**Interfaces:**
- Produces: `MemoryForm` — shared form for creating and editing memories with Zod validation
- Consumes: `useMemoryStore`
- Props: `mode: "create" | "edit"`, `memory?: MemoryDTO` (for edit), `onSuccess?: () => void`

- [ ] **Step 1: Create MemoryForm component**

```tsx
// apps/web/src/components/memories/MemoryForm.tsx
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { MemoryDTO } from "@acaixinha/shared";
import { useMemoryStore } from "../../stores/memoryStore";
import { useUiStore } from "../../stores/uiStore";
import { TagInput } from "./TagInput";
import { Loader2 } from "lucide-react";

interface MemoryFormProps {
  mode: "create" | "edit";
  memory?: MemoryDTO;
  onSuccess?: () => void;
}

export function MemoryForm({ mode, memory, onSuccess }: MemoryFormProps) {
  const { t } = useTranslation();
  const createMemory = useMemoryStore((s) => s.createMemory);
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const addToast = useUiStore((s) => s.addToast);

  const [title, setTitle] = useState(memory?.title ?? "");
  const [description, setDescription] = useState(memory?.description ?? "");
  const [memoryDate, setMemoryDate] = useState(
    memory?.memoryDate ? memory.memoryDate.split("T")[0] : "",
  );
  const [locationName, setLocationName] = useState(memory?.locationName ?? "");
  const [lat, setLat] = useState(
    memory?.coordinates?.latitude?.toString() ?? "",
  );
  const [lng, setLng] = useState(
    memory?.coordinates?.longitude?.toString() ?? "",
  );
  const [tags, setTags] = useState<string[]>(memory?.tags ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !memoryDate) {
      setError("Title, description, and date are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const coordinates =
        lat && lng
          ? { lat: parseFloat(lat), lng: parseFloat(lng) }
          : undefined;

      if (mode === "create") {
        await createMemory({
          title: title.trim(),
          description: description.trim(),
          memoryDate: new Date(memoryDate).toISOString(),
          locationName: locationName.trim() || undefined,
          coordinates,
          tags,
        });
        addToast({ title: t("memories.memoryCreated") });
      } else if (memory) {
        await updateMemory(memory.id, {
          title: title.trim(),
          description: description.trim(),
          memoryDate: new Date(memoryDate).toISOString(),
          locationName: locationName.trim() || null,
          coordinates: coordinates ?? null,
          tags,
        });
        addToast({ title: t("memories.memoryUpdated") });
      }
      onSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.titlePlaceholder")}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder={t("memories.titlePlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.memoryDate")}
        </label>
        <input
          type="date"
          value={memoryDate}
          onChange={(e) => setMemoryDate(e.target.value)}
          required
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={10000}
          rows={4}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary resize-y"
          placeholder={t("memories.descriptionPlaceholder")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.location")}
        </label>
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          maxLength={200}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder={t("memories.locationPlaceholder")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("memories.latitude")}
          </label>
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            min={-90}
            max={90}
            step="any"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("memories.longitude")}
          </label>
          <input
            type="number"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            min={-180}
            max={180}
            step="any"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("memories.tags")}
        </label>
        <TagInput tags={tags} onChange={setTags} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "create" ? t("memories.createMemory") : t("common.save")}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/memories/MemoryForm.tsx
git commit -m "feat(web): add MemoryForm component for create and edit"
```

---

### Task 11: MemoryDetail page

**Files:**
- Create: `apps/web/src/components/memories/MemoryDetail.tsx`

**Interfaces:**
- Produces: `MemoryDetail` — full memory view with metadata, tags, attachments section, share button, and owner-only edit/delete actions
- Consumes: `useMemoryStore`
- Props: `memory: MemoryDTO`, `onDelete: () => void`

- [ ] **Step 1: Create MemoryDetail component**

```tsx
// apps/web/src/components/memories/MemoryDetail.tsx
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { MemoryDTO } from "@acaixinha/shared";
import { useAuthStore } from "../../stores/authStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { useUiStore } from "../../stores/uiStore";
import { Calendar, MapPin, Pencil, Trash2, Share2, Loader2 } from "lucide-react";

interface MemoryDetailProps {
  memory: MemoryDTO;
}

export function MemoryDetail({ memory }: MemoryDetailProps) {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.user?.id);
  const deleteMemory = useMemoryStore((s) => s.deleteMemory);
  const addToast = useUiStore((s) => s.addToast);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = userId === memory.ownerId;
  const date = new Date(memory.memoryDate);

  const handleDelete = async () => {
    if (!confirm(t("memories.deleteConfirm"))) return;
    setIsDeleting(true);
    try {
      await deleteMemory(memory.id);
      addToast({ title: t("memories.memoryDeleted") });
    } catch (err) {
      addToast({
        title: t("common.error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{memory.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {date.toLocaleDateString()}
          </span>
          {memory.locationName && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {memory.locationName}
            </span>
          )}
        </div>
      </div>

      <p className="whitespace-pre-wrap text-muted-foreground">
        {memory.description}
      </p>

      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-3 py-1 text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="flex gap-2">
          <Link
            to="/app/memories/$memoryId/edit"
            params={{ memoryId: memory.id }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            <Pencil className="h-4 w-4" />
            {t("common.edit")}
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {t("common.delete")}
          </button>
          <button
            onClick={() => {
              // Sharing dialog will be wired in the route page
              document.dispatchEvent(
                new CustomEvent("open-share-dialog", { detail: memory.id }),
              );
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
          >
            <Share2 className="h-4 w-4" />
            {t("sharing.share")}
          </button>
        </div>
      )}

      {!isOwner && memory.sharedWithUserIds.includes(userId ?? "") && (
        <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          Este recordo foi compartido contigo
        </div>
      )}

      {memory.coordinates && (
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <span className="font-medium">{t("memories.coordinates")}:</span>{" "}
          {memory.coordinates.latitude}, {memory.coordinates.longitude}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/memories/MemoryDetail.tsx
git commit -m "feat(web): add MemoryDetail component with owner actions"
```

---

### Task 12: Sharing components

**Files:**
- Create: `apps/web/src/components/sharing/ShareMemoryDialog.tsx`
- Create: `apps/web/src/components/sharing/SharedUsersList.tsx`

**Interfaces:**
- Produces: `ShareMemoryDialog` — modal for searching user by username and sharing
- Produces: `SharedUsersList` — list of users with access, with unshare buttons

- [ ] **Step 1: Create SharedUsersList component**

```tsx
// apps/web/src/components/sharing/SharedUsersList.tsx
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

interface SharedUsersListProps {
  sharedWithUserIds: string[];
  isOwner: boolean;
  onUnshare: (userId: string) => void;
}

export function SharedUsersList({
  sharedWithUserIds,
  isOwner,
  onUnshare,
}: SharedUsersListProps) {
  const { t } = useTranslation();

  if (sharedWithUserIds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("sharing.notShared")}</p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{t("sharing.sharedWith")}</h3>
      <div className="flex flex-wrap gap-2">
        {sharedWithUserIds.map((userId) => (
          <span
            key={userId}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm"
          >
            {userId.slice(0, 8)}...
            {isOwner && (
              <button
                onClick={() => onUnshare(userId)}
                className="rounded-full p-0.5 hover:bg-background"
                title={t("sharing.unshare")}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ShareMemoryDialog component**

```tsx
// apps/web/src/components/sharing/ShareMemoryDialog.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMemoryStore } from "../../stores/memoryStore";
import { useUiStore } from "../../stores/uiStore";
import { apiGet } from "../../lib/api/client";
import type { UserDTO } from "@acaixinha/shared";
import { Search, X, Loader2 } from "lucide-react";

interface ShareMemoryDialogProps {
  memoryId: string;
  open: boolean;
  onClose: () => void;
}

export function ShareMemoryDialog({
  memoryId,
  open,
  onClose,
}: ShareMemoryDialogProps) {
  const { t } = useTranslation();
  const shareMemory = useMemoryStore((s) => s.shareMemory);
  const addToast = useUiStore((s) => s.addToast);

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<UserDTO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setResults([]);
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const user = await apiGet<UserDTO>(
        `/users?username=${encodeURIComponent(searchTerm.trim())}`,
      );
      setResults(user ? [user] : []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleShare = async (userId: string) => {
    setIsSharing(true);
    try {
      await shareMemory(memoryId, userId);
      addToast({ title: t("sharing.memoryShared") });
      onClose();
    } catch (err) {
      addToast({
        title: t("common.error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("sharing.shareWith")}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("sharing.searchByUsername")}
            className="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  @{user.username}
                </p>
              </div>
              <button
                onClick={() => handleShare(user.id)}
                disabled={isSharing}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {t("sharing.share")}
              </button>
            </div>
          ))}
          {!isSearching && searchTerm && results.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("common.noResults")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sharing/
git commit -m "feat(web): add ShareMemoryDialog and SharedUsersList components"
```

---

### Task 13: Attachment components

**Files:**
- Create: `apps/web/src/components/attachments/AttachmentCard.tsx`
- Create: `apps/web/src/components/attachments/AttachmentList.tsx`
- Create: `apps/web/src/components/attachments/AttachmentUploader.tsx`

**Interfaces:**
- Produces: `AttachmentCard` — preview card based on MIME type (image, video, audio, default)
- Produces: `AttachmentList` — grid of `AttachmentCard` components
- Produces: `AttachmentUploader` — file input → pre-signed URL upload with progress → confirm

- [ ] **Step 1: Create AttachmentCard component**

```tsx
// apps/web/src/components/attachments/AttachmentCard.tsx
import type { AttachmentResponseDTO } from "@acaixinha/shared";
import { File, Image, Video, Music, FileText } from "lucide-react";

interface AttachmentCardProps {
  attachment: AttachmentResponseDTO;
}

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Video;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType === "application/pdf") return FileText;
  return File;
}

function getMimeLabel(mimeType: string): string {
  const parts = mimeType.split("/");
  return parts[1]?.toUpperCase() ?? mimeType;
}

export function AttachmentCard({ attachment }: AttachmentCardProps) {
  const Icon = getMimeIcon(attachment.mimeType);

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center hover:bg-accent/50 transition-colors">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <span className="text-xs font-medium">{getMimeLabel(attachment.mimeType)}</span>
      {attachment.description && (
        <span className="text-xs text-muted-foreground line-clamp-1">
          {attachment.description}
        </span>
      )}
      <span className="text-[10px] text-muted-foreground">
        {new Date(attachment.uploadedAt).toLocaleDateString()}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create AttachmentList component**

```tsx
// apps/web/src/components/attachments/AttachmentList.tsx
import type { AttachmentResponseDTO } from "@acaixinha/shared";
import { AttachmentCard } from "./AttachmentCard";

interface AttachmentListProps {
  attachments: AttachmentResponseDTO[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {attachments.map((att) => (
        <AttachmentCard key={att.id} attachment={att} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create AttachmentUploader component**

```tsx
// apps/web/src/components/attachments/AttachmentUploader.tsx
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useUiStore } from "../../stores/uiStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { apiPost } from "../../lib/api/client";
import type { UploadUrlResponse } from "@acaixinha/shared";
import { Upload, Loader2 } from "lucide-react";

interface AttachmentUploaderProps {
  memoryId: string;
}

export function AttachmentUploader({ memoryId }: AttachmentUploaderProps) {
  const { t } = useTranslation();
  const addToast = useUiStore((s) => s.addToast);
  const fetchMemory = useMemoryStore((s) => s.fetchMemory);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_MIMES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/ogg",
      "application/pdf",
    ];

    if (!ALLOWED_MIMES.includes(file.type)) {
      addToast({
        title: t("attachments.uploadError"),
        description: `MIME type ${file.type} not allowed`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const { uploadUrl, attachmentId, s3Key } = await apiPost<UploadUrlResponse>(
        `/memories/${memoryId}/upload-url`,
        { mimeType: file.type },
      );

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with status ${xhr.status}`));
        });
        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      await apiPost(
        `/memories/${memoryId}/attachments/${attachmentId}/confirm`,
        {
          mimeType: file.type,
          description: "",
        },
      );

      addToast({ title: t("attachments.uploadSuccess") });
      await fetchMemory(memoryId);
    } catch (err) {
      addToast({
        title: t("attachments.uploadError"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,video/*,audio/*,application/pdf"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("attachments.uploading")} {progress}%
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {t("attachments.addAttachment")}
          </>
        )}
      </button>
      {isUploading && progress > 0 && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/attachments/
git commit -m "feat(web): add attachment components (Card, List, Uploader with pre-signed URL flow)"
```

---

### Task 14: Profile pages

**Files:**
- Create: `apps/web/src/routes/app/profile/index.tsx`
- Create: `apps/web/src/routes/app/profile/edit.tsx`

**Interfaces:**
- Produces: `/app/profile` — user info display
- Produces: `/app/profile/edit` — edit profile form
- Consumes: `useAuthStore`

- [ ] **Step 1: Create Profile view page**

```tsx
// apps/web/src/routes/app/profile/index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../stores/authStore";
import { User, MapPin, Pencil } from "lucide-react";

export const Route = createFileRoute("/app/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
          </div>
        </div>
        <Link
          to="/app/profile/edit"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          <Pencil className="h-4 w-4" />
          {t("auth.editProfile")}
        </Link>
      </div>

      {user.description ? (
        <p className="text-muted-foreground">{user.description}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {t("profile.noDescription")}
        </p>
      )}

      <div className="text-sm text-muted-foreground">
        <p>
          {t("profile.memoriesCount")}: --
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create Profile edit page**

```tsx
// apps/web/src/routes/app/profile/edit.tsx
import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../stores/authStore";
import { useUiStore } from "../../../stores/uiStore";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/profile/edit")({
  component: ProfileEditPage,
});

function ProfileEditPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const addToast = useUiStore((s) => s.addToast);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [description, setDescription] = useState(user?.description ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({ name: name.trim(), description, avatarUrl });
      addToast({ title: t("profile.profileUpdated") });
      navigate({ to: "/app/profile" });
    } catch (err) {
      addToast({
        title: t("common.error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <h1 className="text-xl font-semibold">{t("auth.editProfile")}</h1>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("profile.name")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("profile.description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary resize-y"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("profile.avatarUrl")}
        </label>
        <input
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("common.save")}
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/app/profile" })}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/app/profile/
git commit -m "feat(web): add profile view and edit pages"
```

---

### Task 15: Memory routes (list, view, edit, create)

**Files:**
- Create: `apps/web/src/routes/app/memories/index.tsx`
- Create: `apps/web/src/routes/app/memories/new.tsx`
- Create: `apps/web/src/routes/app/memories/$memoryId/index.tsx`
- Create: `apps/web/src/routes/app/memories/$memoryId/edit.tsx`

**Interfaces:**
- Produces: All memory pages: feed, create, detail, edit
- Each page wires stores with components

- [ ] **Step 1: Create memories index (feed) page**

```tsx
// apps/web/src/routes/app/memories/index.tsx
import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemoryStore } from "../../../stores/memoryStore";
import { MemoryList } from "../../../components/memories/MemoryList";
import { MemorySearchBar } from "../../../components/memories/MemorySearchBar";

export const Route = createFileRoute("/app/memories/")({
  component: MemoriesFeedPage,
});

function MemoriesFeedPage() {
  const { t } = useTranslation();
  const memories = useMemoryStore((s) => s.memories);
  const isLoading = useMemoryStore((s) => s.isLoading);
  const error = useMemoryStore((s) => s.error);
  const fetchMemories = useMemoryStore((s) => s.fetchMemories);
  const searchMemories = useMemoryStore((s) => s.searchMemories);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("memories.title")}</h1>
      <MemorySearchBar onSearch={searchMemories} />
      <MemoryList
        memories={memories}
        isLoading={isLoading}
        error={error}
        onRetry={fetchMemories}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create new memory page**

```tsx
// apps/web/src/routes/app/memories/new.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MemoryForm } from "../../../components/memories/MemoryForm";

export const Route = createFileRoute("/app/memories/new")({
  component: NewMemoryPage,
});

function NewMemoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("memories.createMemory")}</h1>
      <MemoryForm
        mode="create"
        onSuccess={() => navigate({ to: "/app/memories" })}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create memory detail page**

```tsx
// apps/web/src/routes/app/memories/$memoryId/index.tsx
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemoryStore } from "../../../../stores/memoryStore";
import { useAuthStore } from "../../../../stores/authStore";
import { MemoryDetail } from "../../../../components/memories/MemoryDetail";
import { AttachmentList } from "../../../../components/attachments/AttachmentList";
import { AttachmentUploader } from "../../../../components/attachments/AttachmentUploader";
import { SharedUsersList } from "../../../../components/sharing/SharedUsersList";
import { ShareMemoryDialog } from "../../../../components/sharing/ShareMemoryDialog";
import { Skeleton } from "../../../../components/ui/skeleton";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/memories/$memoryId/")({
  component: MemoryDetailPage,
});

function MemoryDetailPage() {
  const { t } = useTranslation();
  const { memoryId } = Route.useParams();
  const memory = useMemoryStore((s) => s.currentMemory);
  const isLoading = useMemoryStore((s) => s.isLoading);
  const error = useMemoryStore((s) => s.error);
  const fetchMemory = useMemoryStore((s) => s.fetchMemory);
  const unshareMemory = useMemoryStore((s) => s.unshareMemory);
  const userId = useAuthStore((s) => s.user?.id);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    fetchMemory(memoryId);
  }, [memoryId, fetchMemory]);

  useEffect(() => {
    const handler = () => setShareDialogOpen(true);
    document.addEventListener("open-share-dialog", handler);
    return () => document.removeEventListener("open-share-dialog", handler);
  }, []);

  if (isLoading || !memory) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <p className="text-destructive">{t("common.error")}</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchMemory(memoryId)}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  const isOwner = userId === memory.ownerId;

  return (
    <div className="space-y-8">
      <MemoryDetail memory={memory} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("attachments.title")}</h2>
          <AttachmentUploader memoryId={memoryId} />
        </div>
        <AttachmentList attachments={memory.attachments} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sharing.share")}</h2>
        <SharedUsersList
          sharedWithUserIds={memory.sharedWithUserIds}
          isOwner={isOwner}
          onUnshare={(userId) => unshareMemory(memory.id, userId)}
        />
      </div>

      <ShareMemoryDialog
        memoryId={memoryId}
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
    </div>
  );
}
```

Note: The skeleton import uses `../../../../components/ui/skeleton` — we'll create a simple Skeleton component inline since shadcn CLI installs components. We'll create `apps/web/src/components/ui/skeleton.tsx` in the next step.

- [ ] **Step 4: Create Skeleton component**

```tsx
// apps/web/src/components/ui/skeleton.tsx
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}
```

- [ ] **Step 5: Create edit memory page**

```tsx
// apps/web/src/routes/app/memories/$memoryId/edit.tsx
import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemoryStore } from "../../../../stores/memoryStore";
import { MemoryForm } from "../../../../components/memories/MemoryForm";
import { Skeleton } from "../../../../components/ui/skeleton";

export const Route = createFileRoute("/app/memories/$memoryId/edit")({
  component: EditMemoryPage,
});

function EditMemoryPage() {
  const { t } = useTranslation();
  const { memoryId } = Route.useParams();
  const navigate = useNavigate();
  const memory = useMemoryStore((s) => s.currentMemory);
  const fetchMemory = useMemoryStore((s) => s.fetchMemory);
  const isLoading = useMemoryStore((s) => s.isLoading);

  useEffect(() => {
    fetchMemory(memoryId);
  }, [memoryId, fetchMemory]);

  if (isLoading || !memory) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("memories.editMemory")}</h1>
      <MemoryForm
        mode="edit"
        memory={memory}
        onSuccess={() =>
          navigate({ to: "/app/memories/$memoryId", params: { memoryId } })
        }
      />
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/app/memories/ apps/web/src/components/ui/skeleton.tsx
git commit -m "feat(web): add memory pages (feed, create, detail, edit) with all states"
```

---

### Task 16: main.tsx + router + app entry point

**Files:**
- Modify: `apps/web/src/main.tsx`
- Create: `apps/web/src/routeTree.gen.ts` (generated by TanStack Router CLI)
- Modify: `apps/web/package.json` (add router CLI script)

**Interfaces:**
- Produces: Full application entry point with React, i18n provider, router

- [ ] **Step 1: Update vite.config.ts with TanStack Router plugin**

```typescript
// apps/web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```

- [ ] **Step 2: Update main.tsx with router**

```tsx
// apps/web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./globals.css";
import "./i18n/config";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Run typecheck to verify all files compile**

```bash
pnpm --filter @acaixinha/web typecheck 2>&1 | head -50
```

Expected: no errors. If there are import errors, fix them.

- [ ] **Step 4: Verify dev server starts and loads**

```bash
pnpm --filter @acaixinha/web dev &
sleep 4
curl -s http://localhost:5173 | head -10
kill %1
```

Expected: HTML with the app shell.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/main.tsx apps/web/vite.config.ts apps/web/package.json apps/web/src/routeTree.gen.ts pnpm-lock.yaml
git commit -m "feat(web): wire main.tsx with TanStack Router and i18n provider"
```

---

### Task 17: Final verification — full typecheck + build

**Files:**
- None new. Verification only.

- [ ] **Step 1: Run full project typecheck**

```bash
pnpm build --filter @acaixinha/shared && npx tsc -b packages/shared apps/api --noEmit 2>&1
```
Expected: no errors for api/shared.

```bash
pnpm --filter @acaixinha/web typecheck 2>&1
```
Expected: no errors (or fix any remaining).

- [ ] **Step 2: Verify the web dev build works**

```bash
pnpm --filter @acaixinha/web build 2>&1
```
Expected: builds successfully.

- [ ] **Step 3: Verify the dev env starts end-to-end**

```bash
pnpm dev &
sleep 5
curl -s http://localhost:3000/health
curl -s http://localhost:5173 | head -5
kill %1
```

Expected: API health check returns `{"status":"ok"}`, and the web app returns HTML.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(web): resolve typecheck and build issues"
```