# TaskBoard

A tiny authenticated task manager (beginner learning project) that mirrors the architecture of a large production app (InCredibly).

## Workflow
- Build in phases (0-8, see BUILD_NEXT_APP_PROMPT.md). Stop after each phase and wait for "next".
- Explain each step to a beginner in 3-5 plain-English lines: what and why.
- After every phase run `pnpm lint`, `pnpm type-check`, `pnpm test` and fix problems.
- Never commit unless asked. Commit style: `feat: add auth flow`.
- Keep code simple; comment only where the "why" is non-obvious.
- This Next.js version differs from older ones (see `AGENTS.md`): read the matching guide in `node_modules/next/dist/docs/` before using a Next API.
- Verify, don't assume: curl the real API before designing around it, and run the real flow (build + HTTP checks) instead of only reading code.

## App
| Route | Group | Purpose |
|---|---|---|
| `/login` | `(auth)` | Login form |
| `/dashboard` | `(core)` | Welcome + task counts |
| `/tasks` | `(core)` | List with search, status filter, pagination (URL query params) |
| `/tasks/[id]` | `(core)` | Detail + edit form + back link preserving list filters |

Backend: none. Use https://dummyjson.com (login `emilys` / `emilyspass`; `/auth/login`, `/auth/me`, `/todos*`).
DummyJSON todos have `todo`/`completed`; a mapper converts them to our `Task` and wraps responses in `ApiResponse<T>`. Its quirks are listed under "Decisions & gotchas".
Env: `NEXT_PUBLIC_API_URL`, `API_URL` in `.env.local` (git-ignored); `.env.example` is committed (un-ignored in `.gitignore`).

## Stack (latest stable; verify with `npm view`)
Next.js 16 App Router, React 19, TypeScript 7.0.2 strict (+ `noUncheckedIndexedAccess`), Tailwind v4 (`@tailwindcss/postcss`, CSS-first), shadcn/ui (style `radix-nova`, Radix base), `@hugeicons/react` + `@hugeicons/core-free-icons`, React Hook Form + `@hookform/resolvers` + Zod 4, TanStack Query 5 (+ devtools), Zustand (UI state only), next-themes, sonner, Jest 30 + RTL + user-event + jest-dom + jsdom, ESLint 9 + Prettier, pnpm.

TypeScript 7 side-by-side setup (do not "fix" it): `typescript-eslint` cannot run on TS 7.0, so `package.json` has `"typescript": "npm:@typescript/typescript6@6.0.2"` (what ESLint and Next import) and `"@typescript/native": "npm:typescript@7.0.2"` (provides `tsc` = 7.0.2). `tsc6` is the TS 6 binary. An install-time peer warning about `typescript-estree` is expected until typescript-eslint supports TS 7.1.

## Folder structure
```
app/
  (auth)/login/page.tsx
  (core)/layout.tsx            # AUTH GATE (server): getCurrentUser() -> redirect('/login')
  (core)/dashboard/page.tsx
  (core)/tasks/{layout.tsx,page.tsx,[id]/page.tsx}
  api/auth/{login,logout,get-current-user}/route.ts   # ONLY allowed route handlers
  globals.css, layout.tsx
features/
  auth/{api/{client,server,mappers}.ts, hooks (use-login, use-logout, use-current-user), components (login-form, user-menu, current-user-hydration), validations/schemas.ts, types}
  tasks/{api/{server,client,actions,mappers}.ts, hooks (use-tasks, use-task-modal-store), components (tasks-boundary, tasks-content, tasks-section, tasks-search-input, task-form-modal, task-delete-dialog, task-detail, dashboard-stats), utils/{task-list,task-url}.ts, validations/schemas.ts, constants/index.ts, types/index.ts}
components/{ui (shadcn + hand-written form.tsx, combobox.tsx), layout (app-sidebar, top-nav), shared (theme-toggle, icons.tsx placeholder), providers (QueryProvider, ThemeProvider)}
lib/{api/{client,server,endpoints,action-helpers,api-error,map-response,map-result,route-response,types}.ts, constants/{navigation,validation,cookie-helper}.ts, queries/{query-client-config,get-query-client,query-keys,query-constants}.ts, utils/{normalize-message,date,safe-redirect}.ts, test-utils/, logger.ts}
hooks/                         # shared hooks (use-debounced-value, use-mobile)
__tests__/ folders sit next to the code they test; jest.config.mjs, jest.setup.ts, __mocks__/server-only.ts at the root
```

## Auth flow
```
Login form -> POST /api/auth/login -> API login -> set HttpOnly cookie (COOKIE_NAMES.AUTH_TOKEN) -> redirect /dashboard
Any (core) page -> (core)/layout.tsx [server] -> getCurrentUser() (React cache) -> cookie -> /auth/me -> none? redirect('/login')
Logout -> POST /api/auth/logout -> clear cookie -> redirect /login
```
- Login/logout use the `/api/auth/*` route handlers (not server actions): the browser can't set an HttpOnly cookie itself. The login handler re-validates with the same Zod schema and returns only the safe user; the token stays in the cookie.
- `(core)/layout.tsx` is also the app shell (SidebarProvider, AppSidebar, TopNav). It has `export const dynamic = "force-dynamic"` (it reads cookies) and reads the sidebar cookie on the server to avoid a width flicker.
- No middleware/proxy: the layout is the single server-side gate.
- Current user is hydrated into TanStack cache (`CurrentUserHydration`), exposed via `useCurrentUser()`.
- Every server action checks `getCurrentUser()` and re-validates its input with Zod (server actions are public endpoints).

## Rules (every file)
**TypeScript**: no `any` (use `unknown`/generics); no non-null `!`; `??` not `||` for defaults; `import type` for type-only imports; `interface` for object shapes/props, `type` for unions; form types via `z.infer`; props typed `Readonly<Props>`.

**React/Next**: Server Components by default, `"use client"` only when needed; no array index as `key`; no component defined inside a component; handlers passed as props use `useCallback`; no arrow functions/`.bind()` in JSX props; server actions never throw (return `ApiResponse` via helpers); mutation hooks toast in `onSuccess`/`onError`, event handlers wrap `await mutateAsync()` in try/catch; use cached `getQueryClient()` (never `new QueryClient()` in server components); prefetch with `Promise.allSettled`; no hardcoded `staleTime` (use `STALE_TIME_REALTIME/SHORT/MEDIUM` from `lib/queries/query-constants.ts`); all query keys in `lib/queries/query-keys.ts`; Zustand for UI state only (never server data, filters, pagination).

**API**: all URLs in `API_ENDPOINTS`; `apiClient` (browser, TanStack hooks) and `fetchServer` (`import "server-only"`; server components/prefetch/actions) are never mixed; messages normalized via `normalizeMessage`; no `console.log` (use `logger()`).

**Forms**: RHF + shadcn `Form*` + `zodResolver`; schemas in `validations/schemas.ts`; no HTML validation attributes (`required`, `min`, `max`, `pattern`, `maxLength`); errors via `<FormMessage />`; dropdowns use `Combobox`, never `Select`; cleared value is `""`, not `null`; max lengths from `lib/constants/validation.ts` (`MAX_INPUT_LENGTH = 255`).

**UI**: semantic color tokens only (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `border-border`, `text-destructive`); `cursor-pointer` on clickables; `wrap-break-word` on user/API text; HugeIcons only with `size` prop, no inline `<svg>` in features (use `components/shared/icons.tsx`); dates as MM/DD/YYYY via `formatDateDisplay()`; never show raw enums (use `*_LABELS`); stable ids on interactive elements (`btn-tasks-create`, `input-tasks-title`, `modal-tasks-form`, `tab-tasks-all`, `btn-tasks-open-{taskId}`); semantic HTML, `alt`, `htmlFor`, `<button>` for actions, `aria-current="page"` on active nav.

**Code quality**: `const` by default, no `var`; `===` only; no magic numbers; no string literal repeated 3+ times; no commented-out code; cognitive complexity <= 15; nesting <= 3.

**Security**: token only in HttpOnly cookie (never localStorage); secrets never `NEXT_PUBLIC_`; validate the `from` redirect param with `getSafeRedirectPath()` in `lib/utils/safe-redirect.ts` (regex `/^\/(?![/\\])/`, rejects control characters, decodes again only if it still starts with an encoded slash, in try/catch), fallback `/tasks`; never expose passwords or tokens to the browser (map API users field by field); no new `app/api/*` handlers beyond the auth proxy unless asked.

## Theme (`app/globals.css`)
Semantic CSS variables for `:root` and `.dark`, mapped in `@theme inline`. Primary emerald, accents teal, dark backgrounds slate-950/900. Class-based dark mode: `@custom-variant dark (&:where(.dark, .dark *));`. Default theme dark. Font: Inter via `next/font/google`.

## Conventions
Files/folders `kebab-case`; components `PascalCase`; functions/vars/hooks `camelCase` (hooks start `use`); constants `UPPER_SNAKE_CASE`; booleans `is/has/should/can`; handlers `handle*`.

## Decisions & gotchas (learned while building)
**DummyJSON**
- `/todos/search` does NOT exist (it is read as a todo id and 404s). `GET /todos?limit=0` returns all 254 todos, so we fetch once and search/filter/paginate locally. Hence `tasksKeys.list()` takes no params.
- Writes are simulated and persist nothing. `POST /todos/add` always returns id 255, and PUT/DELETE on an id it never stored return 404.
- So: mutations update the TanStack cache by hand (`setQueryData`) and never refetch (a refetch would undo the change). Tasks created in-session get local ids from `LOCAL_TASK_ID_START` (10,000); update/delete of those skip the API (`isLocalTaskId`). A page refresh restores the original data; this is expected.
- `/auth/me` returns the plaintext password. `mapRemoteUser` copies fields one by one so it can never reach the browser.
- Errors are `{ message }` with a real HTTP status. `mapResponse` wraps everything into `ApiResponse<T>`.

**API layer**
- `ApiResult<T>` = `ApiResponse<T | null>`: `data` is `null` when `status` is false. Hooks convert failures into thrown errors with `unwrapApiResult` (so TanStack Query runs `onError`). Server actions never throw; they return results.
- `respond()` (route handlers) never sends a failure as 2xx and never uses a status `Response` rejects (below 200, or 204/205/304 with a body).
- `apiClient` re-throws `AbortError` so TanStack Query can tell a cancelled request from a failure.
- Never wrap an `ApiResponse` twice. Our own `/api/auth/*` handlers already answer in the `ApiResponse` shape, so `apiClient` passes `isLocal` calls to `mapResponse(response, { isAlreadyWrapped: true })`, which returns the body as-is (after checking it agrees with the HTTP status). Only DummyJSON's raw bodies get wrapped. The bug this fixed: login put `{status, data: user}` in the cache instead of the user, so `user.firstName` was undefined and `UserMenu` crashed in the browser.
- Lesson: that bug was invisible to curl tests against the handlers and to unit tests that faked the body as `{}`. When two layers combine (client + mapper), test them together with a realistic body (`lib/api/__tests__/local-routes.test.ts`), and check the browser path, not just the server.

**Next / React**
- `cacheComponents` is OFF in `next.config.ts`: it removes `export const dynamic`, which `(core)/layout.tsx` needs.
- Without `cacheComponents`, `cookies()` already opts a route into dynamic rendering. `SidebarInset` renders its own `<main>`, and `TopNav` owns the page `<h1>`, so pages inside `(core)` use neither.
- `getQueryClient()` lives in `lib/queries/get-query-client.ts` (server-only, React `cache`); `makeQueryClient()` in `query-client-config.ts` is safe for client code.
- Theme toggle renders both icons and lets CSS (`dark:`) choose, to avoid a hydration mismatch.
- A server prefetch hydrating over local cache edits can restore old data; acceptable because the API is simulated.

**shadcn / UI**
- shadcn's `form` registry item is an empty stub for this style, so `components/ui/form.tsx` is hand-written. `FormItem` takes an optional `controlId` so inputs get stable ids (`input-auth-username`) while the label's `htmlFor` still matches.
- shadcn components import `cn` from the shadcn-maintained npm package `cn` (not `clsx` + `tailwind-merge`). That is intended.
- `components/ui/sidebar.tsx` reads its cookie name from `COOKIE_NAMES.SIDEBAR_STATE`. `hooks/use-mobile.ts` was rewritten with `useSyncExternalStore` because the generated version broke the `react-hooks/set-state-in-effect` lint rule.
- `components/shared/icons.tsx` is an empty placeholder for icons HugeIcons lacks.
- `FormField` render props are module-level functions (not inline arrows) to follow the "no arrow functions in JSX props" rule.

**Lint**
- ESLint enforces: `no-console` (only `lib/logger.ts` is exempt), `eqeqeq`, `no-var`, `no-non-null-assertion`, `consistent-type-imports`, plus `no-explicit-any` from the Next config. Do not weaken them to make code pass.

## Tests
Jest 30 via `next/jest`, jsdom, `@/` alias, `jest.config.mjs` (no `ts-node`). Tests live in `__tests__/` next to the code for `api/**/client.ts`, `server.ts`, `actions.ts`, `mappers.ts`, `hooks/`, `utils/`, `validations/`, plus `lib/api`, `lib/queries`, `lib/utils`, `lib/logger.ts` and shared `hooks/`. Shared mocks: `features/tasks/__tests__/_mocks_/mock-data.ts`. Do not test `components/`, `types/`, `constants/`.
- `testMatch` is `*.test.ts(x)` only (default Jest would run helpers inside `__tests__/` and fail).
- `server-only` is mapped to `__mocks__/server-only.ts`.
- jsdom has no `Response`: use `createFakeResponse` from `lib/test-utils/fake-response.ts`. Files that need real `Request`/`Response` (e.g. `NextResponse`) start with `@jest-environment node`.
- Hook tests use `createQueryTestSetup()` (fresh `QueryClient` per test); mock `sonner`, the API client modules and server actions.
- Reading env at import time (e.g. `NEXT_PUBLIC_API_URL`): `jest.resetModules()`, set the variable, then `await import(...)`. Pass `null`, not `undefined`, to mean "unset" (undefined triggers default params).
- Coverage must stay >= 80% (currently 100% on the measured folders). Coverage is not proof: break a behavior on purpose and check a test fails.
- Not covered by Jest: React components and browser behavior (dialogs, Combobox, debounce, row click, Back). Check those manually or add Playwright.

## Scripts
`dev`, `build`, `start`, `lint`, `type-check` (`next typegen && tsc --noEmit`), `test`, `test:coverage`, `format`.
`pnpm test -- --coverage` does not work (pnpm forwards the literal `--` to Jest); use `pnpm test:coverage`.
