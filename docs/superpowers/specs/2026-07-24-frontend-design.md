# Frontend Design — La Cajita de los Recuerdos

**Date:** 2026-07-24
**Status:** Approved

## Overview

React SPA consuming the serverless API. Cognito Hosted UI for authentication. Bilingual (ES/GL). Mobile-first responsive.

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | React 19 |
| Bundler | Vite |
| Routing | TanStack Router (file-based) |
| State | Zustand (3 stores: auth, memory, ui) |
| UI Kit | shadcn/ui + Tailwind CSS 4 |
| i18n | i18next + react-i18next + i18next-browser-languagedetector |
| Validation | Zod (reuse schemas from `@acaixinha/shared`) |
| Types | `@acaixinha/shared` DTOs |

## Routes & Auth Flow

```
/                      → Landing page (public)
/login                 → Redirect to Cognito Hosted UI
/callback              → Cognito callback: exchange code → store JWT → redirect /app/memories
/app/*                 → AuthGuard: redirect to /login if !isAuthenticated
/app/memories          → Feed (own + shared), search bar, infinite scroll
/app/memories/new      → Create memory form
/app/memories/$id      → Memory detail (view + attachments)
/app/memories/$id/edit → Edit memory (owner only)
/app/profile           → User profile view
/app/profile/edit      → Edit profile form
```

Cognito Hosted UI is configured with PKCE flow. Tokens stored in `authStore` (persisted to localStorage). `callback` route parses the authorization code, exchanges for tokens, and stores them.

## API Client (`lib/api/client.ts`)

- Fetch wrapper reading `accessToken` from `authStore` per-request
- Auto-attach `Authorization: Bearer <token>` header
- 401 handler: attempt Cognito `refresh_token` grant → retry; if refresh fails → logout → redirect `/login`
- All responses typed as `ApiResponse<T>` from shared package
- Base URL from `VITE_API_URL` env var; proxy in Vite dev config for local dev

## Stores

### `authStore.ts`
```ts
{
  accessToken: string | null,
  idToken: string | null,
  refreshToken: string | null,
  user: UserDTO | null,
  isAuthenticated: boolean,
  setSession(tokens): void,
  setUser(user): void,
  logout(): void,
}
```
Tokens + user persisted to localStorage. Hydrated on app init.

### `memoryStore.ts`
```ts
{
  memories: MemoryDTO[],
  currentMemory: MemoryDTO | null,
  isLoading: boolean,
  error: string | null,
  filters: { text?: string, tags?: string[], dateFrom?: string, dateTo?: string },
  fetchMemories(): void,
  fetchMemory(id): void,
  createMemory(data): void,
  updateMemory(id, data): void,
  deleteMemory(id): void,
  searchMemories(filters): void,
  shareMemory(id, userId): void,
  unshareMemory(id, userId): void,
  addAttachment(memoryId, data): void,
  removeAttachment(memoryId, attachmentId): void,
  setFilters(filters): void,
}
```

### `uiStore.ts`
```ts
{
  language: 'es' | 'gl',
  sidebarOpen: boolean,
  toasts: Toast[],
  toggleLanguage(): void,
  toggleSidebar(): void,
  addToast(toast): void,
  removeToast(id): void,
}
```

## Component Architecture

```
App
├── Providers (QueryClient, Router, i18next)
├── Router
│   ├── /__root
│   │   └── <Outlet />
│   ├── /index → Landing
│   ├── /login → Redirect to Cognito
│   ├── /callback → Handle OAuth callback
│   └── /app/__layout → AuthGuard + AppLayout
│       ├── /memories/index → MemoryList
│       ├── /memories/new → MemoryForm (create)
│       ├── /memories/$id/index → MemoryDetail
│       ├── /memories/$id/edit → MemoryForm (edit)
│       ├── /profile/index → ProfileView
│       └── /profile/edit → ProfileEditForm
└── components/
    ├── layout/
    │   ├── AppLayout (sidebar + header + content area)
    │   ├── Header (logo, language toggle, user menu)
    │   ├── Sidebar (nav links)
    │   └── MobileNavigation (bottom bar, mobile only)
    ├── auth/
    │   └── AuthGuard (redirect wrapper)
    ├── memories/
    │   ├── MemoryCard
    │   ├── MemoryList (grid + load more)
    │   ├── MemoryForm (create/edit, Zod validation)
    │   ├── MemoryDetail
    │   ├── MemorySearchBar (text + tag filters + date range)
    │   └── TagInput (type + enter, chip removal, suggestions)
    ├── sharing/
    │   ├── ShareMemoryDialog (search user by username)
    │   └── SharedUsersList
    └── attachments/
        ├── AttachmentList (grid of cards)
        ├── AttachmentCard (preview by MIME type)
        └── AttachmentUploader (file input → S3 upload with progress)
```

## Component States

Every data-displaying component renders 4 states:

1. **Loading** — skeleton placeholders (shadcn Skeleton)
2. **Empty** — illustration/message + CTA button
3. **Error** — error message + retry button
4. **Data** — actual content

No component ever renders `null` for data states.

## File Upload Flow

```
User clicks upload → file input → getUploadUrl(memoryId, mimeType)
→ XMLHttpRequest PUT to S3 URL with progress events
→ on complete: confirmAttachment(memoryId, attachmentId, description)
→ memoryStore refreshes memory
```

Progress shown via shadcn Progress bar. Supported MIME types enforced by `FileValidator` in shared.

## i18n Structure

```
locales/
├── es.json   # Spanish
└── gl.json   # Galego
```

Namespaced by feature: `common`, `auth`, `memories`, `profile`, `sharing`, `attachments`. Language persisted to localStorage + Zustand. Detector: localStorage first, then browser language.

## Responsive Design

- **Mobile (< md):** Sidebar as drawer triggered by hamburger. Bottom nav bar. Single column grid. Stacked forms.
- **Tablet (md-lg):** Sidebar visible. 2-column grid. Side-by-side form fields.
- **Desktop (> lg):** Full sidebar. 3-column grid. Wider content.

## Vite Configuration

- Dev: proxy `/api` → `http://localhost:3000` (local Express server)
- Build: output to `dist/` for S3 static hosting
- Path aliases: `@` → `src/`, `@acaixinha/shared` → shared package
- Env vars: `VITE_API_URL`, `VITE_COGNITO_DOMAIN`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_REGION`, `VITE_COGNITO_REDIRECT_URI`