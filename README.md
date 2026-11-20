# TaskBoard

A small, authenticated task manager built as a learning project. It follows the same architecture as a large production Next.js app, but is small enough to read in an afternoon.

- Log in, see a dashboard with task counts, then list, search, filter, paginate, create, edit and delete tasks.
- Filters live in the URL, so refreshing, sharing a link, or pressing Back all keep your place.
- Light and dark themes. The sidebar collapses with **Ctrl/Cmd+B** and remembers its state.

**Demo login:** `emilys` / `emilyspass`

## Quick start

```bash
pnpm install
cp .env.example .env.local   # already points at the public demo API
pnpm dev                     # http://localhost:3000
```

Open the app and you are sent to `/login`.

## The backend is a fake API

There is no backend in this repo. The app talks to [DummyJSON](https://dummyjson.com), a free fake API. Things worth knowing:

- **Writes are simulated.** Creating, editing and deleting tasks returns "success" but the server saves nothing. TaskBoard updates its own cache so the change appears while you use the app, but **a page refresh brings the original data back**. This is expected.
- **Tasks you create exist only in your browser.** They get ids from 10,000 up. The API would answer 404 if we tried to edit them, so edits and deletes of those tasks skip the API.
- **There is no search or status filter endpoint for todos.** The app fetches all 254 tasks once (`?limit=0`) and does search, filtering and paging locally.
- DummyJSON's `/auth/me` returns the user's plaintext password (it is fake data). The app copies only safe fields, so the password never reaches the browser.

## Scripts

| Command              | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `pnpm dev`           | Start the dev server                                              |
| `pnpm build`         | Production build                                                  |
| `pnpm start`         | Run the production build                                          |
| `pnpm lint`          | ESLint (also enforces our project rules)                          |
| `pnpm type-check`    | Generate Next route types, then `tsc --noEmit`                    |
| `pnpm test`          | Run all tests                                                     |
| `pnpm test:coverage` | Tests plus a coverage report (fails under 80%)                    |
| `pnpm format`        | Format everything with Prettier                                   |

> `pnpm test -- --coverage` does **not** work: pnpm passes the literal `--` on to Jest. Use `pnpm test:coverage`.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript 7 · Tailwind CSS v4 · shadcn/ui (Radix) · HugeIcons · React Hook Form + Zod · TanStack Query · Zustand · next-themes · sonner · Jest + React Testing Library · ESLint 9 + Prettier · pnpm

TypeScript 7 note: `typescript-eslint` cannot run on TS 7 yet, so `package.json` uses the officially documented side-by-side setup. `typescript` is an alias for the TS 6 compatibility package (so ESLint works), and TS 7 is installed as `@typescript/native` (so the `tsc` command runs 7.0).

## Folder map

```
app/                     Routes and layouts
├── (auth)/login/          Login page (route groups don't change the URL)
├── (core)/                Everything behind login
│   ├── layout.tsx           THE AUTH GATE + app shell (sidebar, top bar)
│   ├── dashboard/           Welcome + task counts
│   └── tasks/               List page, detail page ([id]), shared dialogs
└── api/auth/              The only route handlers: login, logout, get-current-user
features/                One folder per feature
├── auth/                  api, hooks, components, validations, types
└── tasks/                 api (server, client, actions, mappers), hooks, components,
                           utils (filter/paginate/URL helpers), validations, constants, types
components/
├── ui/                    shadcn components (+ our Form and Combobox)
├── layout/                app-sidebar, top-nav
├── shared/                reusable pieces (theme toggle)
└── providers/             Theme and Query providers
lib/
├── api/                   apiClient (browser), fetchServer (server), endpoints, helpers
├── constants/             navigation, validation limits, cookie names
├── queries/               query client setup, query keys, stale-time constants
├── utils/                 normalizeMessage, formatDateDisplay, safe redirect
└── test-utils/            helpers used only by tests
hooks/                   Hooks shared across features
```

## How authentication works

```
Login form ─▶ POST /api/auth/login ─▶ API login ─▶ HttpOnly cookie ─▶ redirect /dashboard

Any page in (core) ─▶ (core)/layout.tsx (server) ─▶ getCurrentUser()
                      ─▶ reads cookie ─▶ API /auth/me ─▶ no user? redirect('/login')

Logout ─▶ POST /api/auth/logout ─▶ cookie cleared ─▶ redirect /login
```

- The token lives **only** in an HttpOnly cookie, so browser JavaScript can never read it. The browser talks to our own `/api/auth/*` routes, which hold the cookie.
- The layout is the single gate for every page in `(core)`, so there is no middleware. One place to check means no second copy to forget.
- `getCurrentUser()` is wrapped in React `cache()`, so the layout and a page share one API call per request.
- The server-fetched user is placed into the TanStack Query cache (`CurrentUserHydration`), and client code reads it with `useCurrentUser()`.
- Server actions (create/edit/delete) check the login and re-validate their input themselves, because anyone can call a server action directly.

## How data flows (tasks)

1. `TasksBoundary` (server) fetches all tasks and hands them to the browser's cache, so the page arrives with data.
2. `TasksContent` (client) reads search, status and page from the URL, filters and paginates the cached list, and passes it to `TasksSection` (the table).
3. Clicking a row opens `/tasks/12?from=<list URL>`. The Back button returns there, after a safety check that refuses anything that is not a path on this site (open-redirect protection).
4. Edits and deletes are server actions. On success the cache is updated by hand (see "fake API" above).
5. Zustand only remembers which dialog is open. Server data lives in TanStack Query, and filters live in the URL.

## Testing

```bash
pnpm test                          # everything
pnpm test:coverage                 # with a coverage report
pnpm exec jest features/tasks      # one folder
```

Tests sit in `__tests__/` folders next to the code. They cover the API clients, server actions, hooks, utilities and validation schemas. Components, types and constants are not unit-tested. Shared fake data is in `features/tasks/__tests__/_mocks_/mock-data.ts`.

Tip: a test file that needs a real server environment (for example one using `NextResponse`) starts with `@jest-environment node`. Everything else runs in jsdom.

## Project rules

The coding rules (TypeScript, React, forms, UI, security) are written in [`CLAUDE.md`](./CLAUDE.md). Several are enforced by ESLint (`pnpm lint`): no `console`, no non-null `!`, `===` only, `import type`.
