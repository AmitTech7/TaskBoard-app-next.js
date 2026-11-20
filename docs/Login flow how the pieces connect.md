# Login flow: how the pieces connect

Nov 20, 2026 · @Amit Kumar

## The big picture: three places, four trips

Logging in means the browser talks to **our** Next.js server, and only our server talks to DummyJSON. Trips 1 and 2 are the login itself. Trips 3 and 4 happen when the dashboard opens.

&#91;embedded content: login flow · 3 places, 4 trips\]

Read it top to bottom, and the numbers match the steps below. The token takes the highlighted road: it rides back to the browser inside a cookie header that page JavaScript cannot read.

## The cast: 15 files, and where each one runs

A login touches 15 files. The only thing to keep straight is **where each one runs**: in the **browser** (your Chrome tab) or on the **server** (the Next.js process started by `pnpm dev`). The browser can never read server-only code, and the server can never click a button.

| File | What it does | Runs in |
| --- | --- | --- |
| `features/auth/components/login-form.tsx` | The form. Validates, calls the hook, then redirects | Browser |
| `features/auth/validations/schemas.ts` | `loginSchema`: the rules (username required, password 6+ characters) | Both |
| `features/auth/hooks/use-login.ts` | `useLogin()`: wraps the request in a TanStack mutation, shows toasts, fills the cache | Browser |
| `features/auth/api/client.ts` | `loginRequest()`: one function = one browser call to "log in" | Browser |
| `lib/api/client.ts` | `apiClient`: builds the URL and runs `fetch` | Browser |
| `lib/api/endpoints.ts` | Every URL in one place (`/api/auth/login`, `/auth/login`...) | Both |
| `lib/api/map-response.ts` | Turns a raw `fetch` Response into our standard `ApiResponse` shape | Both |
| `lib/api/api-error.ts` | `unwrapApiResult()`: turns a failed result into a thrown error | Browser |
| `app/api/auth/login/route.ts` | The server door: receives `POST /api/auth/login` | Server |
| `features/auth/api/server.ts` | `loginWithCredentials()`: asks DummyJSON to log in. Also `getCurrentUser()` | Server |
| `lib/api/server.ts` | `fetchServer`: the server's own `fetch` wrapper | Server |
| `features/auth/api/mappers.ts` | `mapRemoteUser()`: keeps 6 safe fields, drops the password | Server |
| `lib/constants/cookie-helper.ts` | The cookie's name and its safety settings | Server |
| `lib/api/route-response.ts` | `respond()`: sends our result back with a sensible HTTP status | Server |
| `app/(core)/layout.tsx` | The gate every logged-in page passes through | Server |

## Two kinds of URL: LOCAL and REMOTE, and what `isLocal` does

`LOCAL` and `REMOTE` answer one question: **which server does this path belong to?** The flag `isLocal: true` is what makes the browser call **our Next.js server** instead of DummyJSON. This is the hand-off behind steps 3 to 7 below.

### What `API_ENDPOINTS.LOCAL.AUTH.LOGIN` means

`API_ENDPOINTS` (in `lib/api/endpoints.ts`) is a nested object, like a phone book. Reading `LOCAL.AUTH.LOGIN` is walking down it, and the result is a plain string:

```text
API_ENDPOINTS → LOCAL → AUTH → LOGIN   =   "/api/auth/login"
                group    feature  action
```

The object exists so every URL lives in one file and nobody types `"/api/auth/login"` by hand. It holds only **paths**. A request needs a **base** too (which server), and the base comes from somewhere else:

| Group | Example path | Belongs to |
| --- | --- | --- |
| `REMOTE.AUTH.LOGIN` | `/auth/login` | DummyJSON, the fake API |
| `LOCAL.AUTH.LOGIN` | `/api/auth/login` | Our own Next.js server |

### How `isLocal` picks the server

A path alone cannot say which server to use, so the flag chooses the base. It is one line in `lib/api/client.ts`:

```ts
const baseUrl = options.isLocal ? globalThis.location.origin : REMOTE_BASE_URL;
```

| Flag | Base | Final URL |
| --- | --- | --- |
| `isLocal: true` | `location.origin`, the page's own address: `http://localhost:3000` | `http://localhost:3000/api/auth/login` → **our Next.js server** |
| no flag | `NEXT_PUBLIC_API_URL`: `https://dummyjson.com` | `https://dummyjson.com/auth/login` → **DummyJSON directly** |

&#91;embedded content: the isLocal switch · 1 decision, 2 servers\]

`apiClient` is one function used for both cases, and `isLocal` is its switch. The path and the flag must match: if you passed a `LOCAL` path **without** the flag, the browser would ask `dummyjson.com` for `/api/auth/login`, which does not exist (a 404).

### Where the Next.js server gets called: URL to file

When `fetch` sends `POST http://localhost:3000/api/auth/login`, Next.js turns the URL into a file path. That is why every `LOCAL` path starts with `/api/`: it matches the folder `app/api/`. The `LOCAL` list is exactly the list of `route.ts` files that exist.

| `LOCAL` endpoint | File that runs on the server | Function |
| --- | --- | --- |
| `LOCAL.AUTH.LOGIN` = `/api/auth/login` | `app/api/auth/login/route.ts` | `POST` |
| `LOCAL.AUTH.LOGOUT` = `/api/auth/logout` | `app/api/auth/logout/route.ts` | `POST` |
| `LOCAL.AUTH.CURRENT_USER` = `/api/auth/get-current-user` | `app/api/auth/get-current-user/route.ts` | `GET` |

### Who uses which

Both lists exist because three different callers need them:

| Who is calling | What it calls | Tool | Path group |
| --- | --- | --- | --- |
| Browser, to our server | Our `route.ts` files | `apiClient` with `isLocal: true` | `LOCAL` |
| Browser, to DummyJSON directly | Public data (reading the todo list) | `apiClient` | `REMOTE` |
| Our server, to DummyJSON | Login, `/auth/me`, create/edit/delete | `fetchServer` | `REMOTE` |

The server never uses a `LOCAL` path, because it does not need to call itself.

### When to use which

- **Needs a secret or a cookie: go through our server.** Login must set an HttpOnly cookie, and only the server can do that. If the browser called DummyJSON directly, the token would end up in page JavaScript.
- **Public data with no secret: call `REMOTE` straight from the browser.** The todo list needs no login, so the browser asks DummyJSON itself.
- **Writes (create, edit, delete): use server actions.** That is a third door into the server, and it still ends with `fetchServer` calling a `REMOTE` path.

In short, `isLocal: true` means "this request needs our server in the middle". For login the chain is:

```text
browser --isLocal:true--> our route.ts --fetchServer--> DummyJSON /auth/login
                          (sets the cookie)
```

## Step by step: from the form to the dashboard

A successful login is 12 steps and 4 network trips. Steps 1 to 4 happen in the browser, 5 to 7 on the server, 8 to 10 back in the browser, and 11 to 12 when the dashboard opens.

### In the browser

**1. You click "Sign in".** `login-form.tsx` hands the form to React Hook Form, which first runs your Zod rules (`loginSchema`). If a rule fails (empty username, password under 6 characters) red text appears under the field and **nothing is sent**. If it passes, `handleValidSubmit` runs with `{ username, password }`.

```tsx
<form onSubmit={form.handleSubmit(handleValidSubmit)}>
```

**2. The form calls the hook.** `useLogin()` returns TanStack's `mutateAsync`. Calling it starts the mutation and tracks `isPending` (the button shows "Signing in...").

```tsx
const { mutateAsync, isPending } = useLogin();
// ...
await mutateAsync(values);
```

**3. The hook calls `loginRequest`.** This is the line you selected. `mutationFn` is the work the mutation does:

```ts
mutationFn: async (values) => unwrapApiResult(await loginRequest(values)),
```

`loginRequest` (in `features/auth/api/client.ts`) is one line: it asks `apiClient` to POST to **our own** server. `isLocal: true` means "my Next.js server, not DummyJSON".

```ts
apiClient.post(API_ENDPOINTS.LOCAL.AUTH.LOGIN, { isLocal: true, body: values });
// LOCAL.AUTH.LOGIN is the string "/api/auth/login"
```

**4. `apiClient` sends the request.** It builds `http://localhost:3000/api/auth/login` from the page's own address, turns `values` into JSON and calls `fetch`. **This is the moment the request leaves the browser (trip 1).** On the wire it is a plain HTTP request:

```http
POST /api/auth/login
Content-Type: application/json

{"username":"emilys","password":"emilyspass"}
```

### On the server

**5. Next.js finds the right file by the URL.** The file path *is* the route: `app/api/auth/login/route.ts` handles `/api/auth/login`, and its `POST` function runs. It reads the JSON, then checks it with `loginSchema` **again**. The browser already checked, but anyone can send a request without the form, so the server never trusts it.

**6. The server asks DummyJSON (trip 2).** `loginWithCredentials` calls `fetchServer`, which POSTs to `https://dummyjson.com/auth/login`. DummyJSON replies with the user plus two tokens. Then the server splits the reply in two:

- `mapRemoteUser(...)` keeps **6 safe fields** (id, username, email, first name, last name, image) and drops the rest, including the password.
- The `accessToken` is kept as the login token. The `refreshToken` is thrown away, because this app has no refresh feature.

**7. The server sets the cookie and answers.** Back in `route.ts`:

```ts
cookieStore.set(COOKIE_NAMES.AUTH_TOKEN, result.data.token, getAuthCookieOptions());
return respond({ ...result, data: result.data.user });
```

The reply to the browser has two parts: a `Set-Cookie` **header** carrying the token, and a JSON **body** carrying only the safe user. The token is never in the body.

### Back in the browser

**8. The browser receives the reply.** It stores the cookie automatically, with no code from us. `apiClient` passes the body through `mapResponse`. Our own routes already answer in the `ApiResponse` shape, so it is passed through as-is, and not wrapped a second time. (Wrapping it twice was the bug that crashed `UserMenu` earlier.)

**9. `unwrapApiResult` opens the box, then `onSuccess` runs.** The result looks like `{ status: true, data: user }`. `unwrapApiResult` returns just the `user`, or **throws** if `status` is false. TanStack Query only counts a call as failed when something is thrown, which is why this step exists. On success the hook runs:

```ts
onSuccess: (user) => {
  queryClient.setQueryData(authKeys.currentUser(), user); // remember who is logged in
  toast.success(`Welcome back, ${user.firstName}!`);
},
```

**10. The form redirects.** Now that `await mutateAsync(values)` has finished without throwing, the next lines of `handleValidSubmit` run:

```ts
router.replace(appRoutes.DASHBOARD); // go to /dashboard
router.refresh();                     // re-run server code now that the cookie exists
```

### When the dashboard opens

**11. The browser asks for `/dashboard` (trip 3), and the cookie rides along automatically.** `app/(core)/layout.tsx` runs on the server first, because every page in `(core)` passes through it. It calls `getCurrentUser()`, which reads the cookie and then (trip 4) sends the token to DummyJSON's `/auth/me`, and gets the user back. No user means `redirect("/login")`. A user means the page is built, and the user is also copied into the query cache.

**12. The user menu shows your name.** `UserMenu` calls `useCurrentUser()`, which finds the user already in the cache. No network request happens here at all.

## When login fails: where each error stops

A failure travels the same road as a success, but it ends earlier, and nothing is stored: no cookie, no cache entry. The table shows where each kind of failure stops and what you see.

| What goes wrong | Where it stops | What you see |
| --- | --- | --- |
| Empty username, or password under 6 characters | In the browser, by Zod (step 1) | Red text under the field. No request is sent |
| Wrong password | DummyJSON answers 400 "Invalid credentials" (step 6) | A red toast, and the form stays open |
| Someone skips the form and sends bad JSON | Our route's own Zod check (step 5) | A 400 reply with the messages. DummyJSON is never called |
| DummyJSON is unreachable | `fetchServer` catches the network error (step 6) | A 502 reply, then a toast "Network error..." |

The wrong-password case, in code order:

1. DummyJSON replies `400` with `{ "message": "Invalid credentials" }`.
2. `mapResponse` turns that into `{ status: false, statusCode: 400, message: "Invalid credentials", data: null }`.
3. `route.ts` sends that back with HTTP status 400 and **no `Set-Cookie` header**.
4. In the browser, `unwrapApiResult` sees `status: false` and **throws** an `ApiRequestError` carrying the message.
5. TanStack Query catches the throw and runs `onError`, which shows `toast.error(error.message)`.
6. `await mutateAsync(values)` in the form throws too, so the `catch` block runs. It is empty on purpose (the toast was already shown), and the redirect lines after it are skipped.

## How the pieces bind: the data's shape at every hop

Each layer receives data in one shape and hands it on in the next. That hand-off is what "binding" means here: the output of one function is exactly the input of the next. `ApiResult<T>` is our standard box: `{ status, statusCode, message, data }`, where `data` is `null` when something failed.

| # | Where | What the data looks like |
| --- | --- | --- |
| 1 | Form values (browser) | `{ username: "emilys", password: "emilyspass" }` |
| 2 | Request body, trip 1 (browser to our server) | The same, as JSON text |
| 3 | DummyJSON's raw reply (to our server) | `{ id, username, email, firstName, lastName, image, accessToken, refreshToken, ...more }`. Not our shape |
| 4 | After `mapResponse` (our server) | `ApiResult<raw reply>`: `{ status: true, statusCode: 200, message: "Success", data: {raw reply} }` |
| 5 | After `loginWithCredentials` (our server) | `ApiResult<LoginResult>`, with `data: { user: {6 safe fields}, token }` |
| 6 | Our route's reply (to the browser) | **Header:** `Set-Cookie` with the token. **Body:** `ApiResult<CurrentUser>`, user only |
| 7 | After `apiClient` (browser) | The same `ApiResult<CurrentUser>`, passed through, not wrapped again |
| 8 | After `unwrapApiResult` (browser) | Just `CurrentUser`, or a thrown `ApiRequestError` |
| 9 | In the query cache (browser) | Key `["auth", "current-user"]` holds `CurrentUser` |

Why each layer exists, in one line each:

- **`loginSchema` is used twice** (browser and server) so the rules are written once and cannot drift apart.
- **`loginRequest` vs `apiClient`:** the first knows *what* to ask (log in), the second knows *how* to ask (build a URL, run `fetch`).
- **`mapResponse`** gives every reply, DummyJSON's or ours, one shape, so the rest of the app never handles raw replies.
- **`unwrapApiResult`** converts "a result with `status: false`" into a thrown error, because TanStack Query only reacts to thrown errors.
- **The route handler** exists because only the server can set an HttpOnly cookie. If the browser called DummyJSON directly, the token would land in JavaScript's hands.
- **`mapRemoteUser`** copies fields one by one, so the password DummyJSON returns can never be sent to the browser by accident.

## Where the token lives, and why

The login token lives only in an **HttpOnly cookie**, so JavaScript running on the page can never read it. If a malicious script ever got into a page, it still could not steal the login.

- **The browser sends it for you.** After step 8, the browser attaches the cookie to every request to your site. You wrote no code for that.
- **The server reads it.** `getCurrentUser()` calls `cookies()` and uses the token to ask DummyJSON who you are (step 11).
- **It is never in a response body or in the query cache.** Step 7's reply carries it only in the `Set-Cookie` header, and the body holds just the safe user.
- **It expires with the token.** Both last 60 minutes (`AUTH_TOKEN_LIFETIME_MINUTES`). After that you are sent back to `/login`.
- **Cookie settings** (`lib/constants/cookie-helper.ts`): `HttpOnly` (hidden from JavaScript), `SameSite=Lax` (not sent on cross-site POSTs), `Path=/` (valid on every page), and `Secure` (HTTPS only) in production builds. In `pnpm dev` it is not `Secure`, so it works on plain `http://localhost`.

## See it yourself, and a change cheat sheet

You can watch every trip in the browser. Open DevTools (F12), then sign in with `emilys` / `emilyspass`:

1. **Network tab**: filter by **Fetch/XHR** and click the `login` request. **Payload** shows step 4's body, **Response** shows step 7's body (user only, no token), and **Headers** shows the `set-cookie` line under Response Headers.
2. **Application tab**: open **Cookies**, then `localhost`. You will see `auth_token` with the **HttpOnly** box ticked.
3. **TanStack devtools**: click the small TanStack logo button in the page's bottom corner and find the `["auth","current-user"]` entry. Its data is the user from step 9.
4. **Your terminal** (where `pnpm dev` runs) shows only server-side activity: steps 5 to 7 and 11. The browser steps never appear there.

To follow the code yourself, put a breakpoint (or a temporary log) on the first line of each of these, in order: `handleValidSubmit`, `loginRequest`, `POST` in `route.ts`, `loginWithCredentials`, `onSuccess`.

| I want to... | Edit this |  |
| --- | --- | --- |
| Change the password rule (minimum length) | `MIN_PASSWORD_LENGTH` in `lib/constants/validation.ts` |  |
| Change the username or password rules | `features/auth/validations/schemas.ts` |  |
| Change the welcome toast | `onSuccess` in `features/auth/hooks/use-login.ts` |  |
| Change where login sends you | `appRoutes.DASHBOARD` use in `login-form.tsx`, or the route in `lib/constants/navigation.ts` |  |
| Keep people logged in longer or shorter | `AUTH_TOKEN_LIFETIME_MINUTES` in `lib/constants/cookie-helper.ts` |  |
| Rename the cookie | `COOKIE_NAMES.AUTH_TOKEN` in `lib/constants/cookie-helper.ts` |  |
| Point at a different API | `API_URL` and `NEXT_PUBLIC_API_URL` in `.env.local` |  |
| Show another field about the user | `CurrentUser` and `RemoteUser` in `features/auth/types/index.ts`, plus `mapRemoteUser` |  |
| Protect another page | Put it inside the `app/(core)/` folder. The layout already guards everything there |  |
