/**
 * Every URL the app talks to lives here. Never write a URL string anywhere else.
 *
 * REMOTE paths are appended to the API base URL (DummyJSON).
 * LOCAL paths are our own Next.js route handlers (same origin, used by the browser).
 */
export const API_ENDPOINTS = {
  REMOTE: {
    AUTH: {
      LOGIN: "/auth/login",
      ME: "/auth/me",
    },
    TODOS: {
      LIST: "/todos",
      DETAIL: (id: number | string) => `/todos/${id}`,
      CREATE: "/todos/add",
      UPDATE: (id: number | string) => `/todos/${id}`,
      DELETE: (id: number | string) => `/todos/${id}`,
    },
  },
  LOCAL: {
    AUTH: {
      LOGIN: "/api/auth/login",
      LOGOUT: "/api/auth/logout",
      CURRENT_USER: "/api/auth/get-current-user",
    },
  },
} as const;
