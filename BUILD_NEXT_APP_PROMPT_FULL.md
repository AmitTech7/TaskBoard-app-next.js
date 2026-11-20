# Build a Beginner Next.js App (InCredibly-style) — From Scratch

> **How to use this file**
> 1. Create an empty folder, e.g. `mkdir my-first-next-app && cd my-first-next-app`
> 2. Copy this file into it.
> 3. Open Claude Code in that folder and switch to **Plan mode**. Say: **"Read BUILD_NEXT_APP_PROMPT.md and give me a plan. Do not write code yet."**
> 4. Read the plan, ask questions, then approve it and switch to **Manual mode** (Claude asks before every edit/command). Say: **"Start with Phase 0, then Phase 1. Stop after each phase and explain what you did."**
> 5. Stay in Manual mode while learning (Phases 0–4). Optionally move to **Edit automatically** later.
>
> Modes: *Plan* = read-only, no changes · *Manual* = asks permission for each action (best for learning) · *Edit automatically* = file edits without asking, commands still ask · *Auto* = runs everything on its own (avoid while learning).
>
> Everything below the line is the prompt for Claude.

---

## 0. Role & teaching style

You are a senior Next.js engineer mentoring a **beginner**. Build a **small** app, in **phases**. After each phase:

1. Run `pnpm lint`, `pnpm type-check`, and `pnpm test` and fix problems.
2. Give me a **3–5 line plain-English explanation** of what you built and *why*.
3. Tell me how to see it working (URL / command), then **wait for me to say "next"**.

Never dump everything at once. Keep code simple and commented only where the "why" is non-obvious.

---

## 1. The app we are building: "TaskBoard"

A tiny authenticated task manager. It mirrors the architecture of a big production app (InCredibly) but is small enough to learn from.

**Pages**
| Route | Group | Purpose |
|---|---|---|
| `/login` | `(auth)` | Login form |
| `/dashboard` | `(core)` | Welcome + task counts |
| `/tasks` | `(core)` | Task list with search, status filter, pagination (all in URL query params) |
| `/tasks/[id]` | `(core)` | Task detail + edit form + back link that keeps the list filters |

**Backend:** none to write. Use the free fake API **https://dummyjson.com**:
- `POST /auth/login` (username `emilys`, password `emilyspass`) → returns tokens
- `GET /auth/me` → current user
- `GET /todos`, `GET /todos/search?q=`, `GET /todos/{id}`, `POST /todos/add`, `PUT /todos/{id}`, `DELETE /todos/{id}`
  (writes are simulated — they return success but don't persist; that's fine, mention it to me.)

Put the base URL in `.env.local` as `NEXT_PUBLIC_API_URL` and `API_URL`, and add a `.env.example`.

---

## 2. Tech stack (use the LATEST stable of each — verify with `npm view <pkg> version`, don't guess)

| Area | Choice |
|---|---|
| Framework | **Next.js (latest, App Router)** via `pnpm create next-app@latest` |
| React | Latest (19.x) |
| Language | **TypeScript 7 (latest)**, strict mode. Run `npm view typescript version`. If `latest` is 7.x, use it. If not, use whatever 7.x tag/beta/native-preview exists and **tell me exactly what you picked and why**. Do not silently fall back to 5.x. |
| Styling | **Tailwind CSS v4** (CSS-first config in `globals.css`, `@tailwindcss/postcss`) |
| UI | **shadcn/ui** (`pnpm dlx shadcn@latest init`) |
| Icons | `@hugeicons/react` + `@hugeicons/core-free-icons` |
| Forms | **React Hook Form** + `@hookform/resolvers` + **Zod** (validation schemas — I wrote "JOT", I mean **Zod**) |
| Server state | **TanStack Query** (+ devtools) |
| UI state | **Zustand** (only for UI state, e.g. a modal open/closed) |
| Theme | `next-themes` (light/dark) |
| Toasts | `sonner` |
| Testing | **Jest** + **React Testing Library** + `@testing-library/user-event` + `@testing-library/jest-dom` + `jest-environment-jsdom` |
| Lint/format | ESLint 9 + Prettier |
| Package manager | **pnpm** |

---

## 3. Phases (do them in order)

### Phase 0 — CLAUDE.md first (before any code)
- Create `CLAUDE.md` in the project root **before anything else**. Build it from §1 (app summary), §2 (stack), §4 (rules), §5 (theme tokens) and §6 (conventions) of this file, plus the folder structure from Phase 2 and the auth flow from Phase 4.
- Add a short "Workflow" section to it: *build in phases, explain each step to a beginner, run lint/type-check/test after every phase, never commit unless asked.*
- Show me the file and explain in 3–4 lines what `CLAUDE.md` is: Claude Code reads it automatically at the start of every session, so these rules are followed without me repeating them.
- Phase 8 then only **updates** this file with anything we learned; it does not create it.

### Phase 1 — Project setup
- Create the app in the **current folder** (`.`), TypeScript, ESLint, Tailwind, App Router, `@/*` import alias, no `src/` dir.
- Upgrade/pin TypeScript per the table above. Enable `"strict": true` and `noUncheckedIndexedAccess`.
- Add scripts: `dev`, `build`, `start`, `lint`, `type-check` (`tsc --noEmit`), `test`.
- Add Prettier + `.prettierrc`.
- Init shadcn/ui. Add components: `button input label form card badge table dialog sonner dropdown-menu`. **Also build a `Combobox`** at `components/ui/combobox.tsx` (shadcn Popover + Command) — we use it instead of `Select` for dropdowns.
- Set up theme tokens (see §5) and `next-themes` (default dark).

### Phase 2 — Folder structure
Create exactly this skeleton (empty files/folders are fine, we fill them later):

```
app/
├── (auth)/login/page.tsx
├── (core)/
│   ├── layout.tsx              # AUTH GATE (server): getCurrentUser() → redirect('/login')
│   ├── dashboard/page.tsx
│   └── tasks/
│       ├── layout.tsx          # permission/section wrapper
│       ├── page.tsx
│       └── [id]/page.tsx
├── api/auth/{login,logout,get-current-user}/route.ts   # ONLY exception to "no route handlers"
├── globals.css
└── layout.tsx                  # root layout + providers
features/
├── auth/{api,hooks,components,validations,types}
└── tasks/
    ├── api/{server.ts,client.ts,actions.ts}
    ├── hooks/
    ├── components/
    ├── validations/schemas.ts
    ├── constants/index.ts
    └── types/index.ts
components/
├── ui/          # shadcn
├── layout/      # app-sidebar, top-nav (used only in (core)/layout.tsx)
├── shared/      # reusable across features (icons.tsx, etc.)
└── providers/   # QueryProvider, ThemeProvider
lib/
├── api/{client.ts,server.ts,endpoints.ts,action-helpers.ts,types.ts}
├── constants/{navigation.ts,validation.ts,cookie-helper.ts}
├── queries/{query-client-config.ts,query-keys.ts,query-constants.ts}
├── utils/{normalize-message.ts,date.ts}
└── logger.ts
hooks/          # shared hooks
```

Explain in 1 line what each top-level folder is for.

### Phase 3 — API layer (the foundation)
- `lib/api/types.ts`: `ApiResponse<T> { status: boolean; statusCode: number; message: string | string[]; data: T }`.
- `lib/api/endpoints.ts`: **every** URL lives in `API_ENDPOINTS`. No URL strings anywhere else.
- `lib/api/client.ts` → `apiClient` (browser; used by TanStack Query hooks).
- `lib/api/server.ts` → `fetchServer` (starts with `import "server-only"`; used by server components, prefetch, server actions). **Never mix the two clients.**
- `lib/api/action-helpers.ts` → `handleApiResponse(response)` and `handleActionError(error, fallback)`.
- `lib/utils/normalize-message.ts` → turns `string | string[]` into one string. Never re-define inline.
- `lib/logger.ts` → `logger()` (wraps `console` in one place). **No `console.log` anywhere else.**
- Since DummyJSON doesn't return our `ApiResponse` shape, add a small mapper in the API layer that wraps its responses into `ApiResponse<T>` so the rest of the app is realistic.

### Phase 4 — Authentication
Flow to implement (explain each arrow to me):

```
Login form → Server Action / POST /api/auth/login → API login
          → set HttpOnly cookie (token) → redirect /dashboard

Any (core) page → (core)/layout.tsx [server] → getCurrentUser()
          → reads cookie → calls /auth/me → no user? redirect('/login')

Logout → POST /api/auth/logout → clear cookie → redirect /login
```
- Cookie names in `lib/constants/cookie-helper.ts` (`COOKIE_NAMES.AUTH_TOKEN`).
- `getCurrentUser()` in `features/auth/api/server.ts`, wrapped in React `cache()`.
- `(core)/layout.tsx` has `export const dynamic = "force-dynamic"` (it reads cookies) and a short comment saying why.
- Hydrate the current user into the TanStack cache (`CurrentUserHydration`) and expose `useCurrentUser()`.
- Login form: React Hook Form + Zod (`username` required, `password` min 6) + toast on failure.
- Add a simple `middleware`/`proxy` check is **not** required — the layout is the gate. Mention why this is simpler.

### Phase 5 — App shell
- `components/layout/app-sidebar.tsx` driven by `lib/constants/navigation.ts` (`appRoutes` + nav array). Items: Dashboard, Tasks.
- Collapse with **Ctrl/Cmd+B**, state saved in a cookie.
- Top nav: page title, theme toggle, user menu with Logout.
- Mobile: sidebar becomes an overlay.

### Phase 6 — Tasks feature (the full CRUD loop)
Follow the **Adding a Feature checklist** — in this order, one file group at a time:
1. `types/index.ts` → `Task`, `TaskStatus` (`"pending" | "completed"`), request params.
2. `validations/schemas.ts` → Zod schema (`title` required, max length from `lib/constants/validation.ts`).
3. `endpoints.ts` + `query-keys.ts` (`tasksKeys.list(params)`, `tasksKeys.detail(id)`).
4. `api/server.ts` + `api/client.ts` (reads), `api/actions.ts` (`'use server'` writes using the helpers).
5. `hooks/use-tasks.ts` → `useTasks`, `useTask`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`.
6. Components: `tasks-boundary.tsx` (server prefetch) → `tasks-content.tsx` → `tasks-section.tsx` (table, filters) → `task-form-modal.tsx`.
7. `app/(core)/tasks/page.tsx` = `page → Boundary → Content`.
8. Filters/search/page live in **URL query params**, not Zustand.
9. Row click → detail with `?from=<encoded pathname+search>`; the detail page's back button decodes it safely (try/catch decode + regex `/^\/(?![/\\])/` to block open redirects) and falls back to `/tasks`.
10. Status filter is a `Combobox`; show a **label** from `TASK_STATUS_LABELS`, never the raw enum.

### Phase 7 — Tests
Write colocated-by-folder tests in `__tests__/` next to the code for: `api/**/client.ts`, `server.ts`, `actions.ts`, `hooks/`, `utils/`, `validations/`. Shared fake data in `features/tasks/__tests__/_mocks_/mock-data.ts`. Do **not** test `components/`, `types/`, `constants/`. Aim ≥ 80% coverage. Configure Jest with `next/jest`, the `@/` alias, and jsdom.

### Phase 8 — Wrap-up
- Write a `README.md` (stack, scripts, folder map, how auth flows).
- Update the `CLAUDE.md` from Phase 0 with anything new we decided along the way.
- Run the final checks and give me a **"what I learned" summary** + a list of 5 small exercises I can try next (e.g. add a "priority" field).

---

## 4. Rules to follow in EVERY file (the "things to take care of")

**TypeScript**
- No `any` (use `unknown`/generics). No non-null `!`. Use `??` not `||` for defaults. `import type` for type-only imports.
- `interface` for object shapes/props, `type` for unions. Derive form types with `z.infer<typeof schema>`.
- Every component's props: `Readonly<Props>`.

**React / Next**
- Server Components by default; add `"use client"` only where you need state/effects/handlers.
- Never use array index as a list `key`. Use stable ids.
- No component defined inside another component. Handlers passed as props use `useCallback`. No arrow functions / `.bind()` in JSX props.
- Server actions **never throw** — always return `ApiResponse`/result via the helpers.
- Mutation hooks: show a toast in `onSuccess`/`onError`; in event handlers wrap `await mutateAsync()` in `try/catch`.
- Use `getQueryClient()` (React-`cache`d), never `new QueryClient()` in a server component. Prefetch with `Promise.allSettled`.
- Never hardcode `staleTime` numbers: export `STALE_TIME_REALTIME / SHORT / MEDIUM` from `lib/queries/query-constants.ts` and use those.
- All query keys in the single file `lib/queries/query-keys.ts`.
- Zustand is for **UI state only** (modal open, selected row). Never for server data, filters, or pagination.

**Forms & validation**
- React Hook Form + shadcn `Form*` components + `zodResolver`. Schemas in `validations/schemas.ts`.
- **No HTML validation attributes** (`required`, `min`, `max`, `pattern`, `maxLength`) on inputs — all rules live in Zod, errors shown via `<FormMessage />`.
- Dropdowns = `Combobox`, never `Select`. Cleared value is `""`, not `null`.
- Max lengths come from `lib/constants/validation.ts` (`MAX_INPUT_LENGTH = 255`, etc.).

**UI / styling**
- **No hardcoded colors** — only semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, `text-destructive`).
- `cursor-pointer` on every clickable thing.
- Any element rendering user/API text gets `wrap-break-word`.
- Icons: HugeIcons only, sized with the `size` prop. No inline `<svg>` in feature files (use `components/shared/icons.tsx` if no icon exists).
- Dates always shown as **MM/DD/YYYY** via `formatDateDisplay()` in `lib/utils/date.ts`.
- **Never show a raw enum value** (`in_progress`) — map through a `*_LABELS` constant.
- Every interactive element has a stable HTML `id`: `btn-tasks-create`, `input-tasks-title`, `modal-tasks-form`, `tab-tasks-all`, per-row `btn-tasks-open-{taskId}`.
- Accessibility: semantic HTML, `alt` on images, `htmlFor` on labels, `<button>` for actions, `aria-current="page"` on active nav.

**Code quality (SonarQube-style)**
- `const` by default, never `var`; `===` only; no magic numbers; no string literal repeated 3+ times; no commented-out code.
- Cognitive complexity ≤ 15, nesting ≤ 3.
- No `console.log` — use `logger()`.

**Security**
- Auth token only in an **HttpOnly** cookie (never localStorage).
- `.env.local` is git-ignored; secrets never use `NEXT_PUBLIC_`.
- Validate redirect targets (`from` param) as shown in Phase 6.
- Don't add new `app/api/*` handlers beyond the auth proxy unless I ask.

---

## 5. Theme tokens (put in `app/globals.css`)

Define semantic CSS variables for `:root` (light) and `.dark`, then map them in `@theme inline`. Primary = **emerald**, accents = teal, dark backgrounds = slate-950/900. Dark mode is class-based:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Font: Inter via `next/font/google`.

---

## 6. Conventions

| What | Convention |
|---|---|
| Files & folders | `kebab-case` |
| Components | `PascalCase` |
| Functions / vars / hooks | `camelCase` (hooks start with `use`) |
| Constants | `UPPER_SNAKE_CASE` |
| Booleans | `is / has / should / can` prefix |
| Event handlers | `handle` prefix |

Commit style: small commits per phase (`feat: add auth flow`). **Only commit if I ask.**

---

## 7. Definition of done

- [ ] `pnpm dev` runs; I can log in with `emilys / emilyspass`, see the dashboard, and list/search/filter/paginate/create/edit/delete tasks.
- [ ] Refreshing a filtered list, opening a task, and pressing Back returns me to the same filtered list.
- [ ] Visiting `/tasks` while logged out redirects to `/login`.
- [ ] Light/dark theme works and persists.
- [ ] `pnpm lint`, `pnpm type-check`, `pnpm build` all pass with **zero warnings**.
- [ ] `pnpm test -- --coverage` ≥ 80% on tested folders.
- [ ] README + CLAUDE.md written.

**Start with Phase 1 now. Show me the exact commands you run and wait for "next" before Phase 2.**
