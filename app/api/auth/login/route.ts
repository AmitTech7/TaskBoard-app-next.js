import { cookies } from "next/headers";

import { loginWithCredentials } from "@/features/auth/api/server";
import type { CurrentUser } from "@/features/auth/types";
import { loginSchema } from "@/features/auth/validations/schemas";
import { respond } from "@/lib/api/route-response";
import type { ApiResult } from "@/lib/api/types";
import { COOKIE_NAMES, getAuthCookieOptions } from "@/lib/constants/cookie-helper";

const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;

/** POST /api/auth/login: validate -> call API -> put the token in an HttpOnly cookie. */
export async function POST(request: Request) {
  const payload: unknown = await request.json().catch(() => null);

  // Never trust the browser: validate again on the server with the same Zod schema.
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return respond<CurrentUser>({
      status: false,
      statusCode: HTTP_BAD_REQUEST,
      message: parsed.error.issues.map((issue) => issue.message),
      data: null,
    });
  }

  const result = await loginWithCredentials(parsed.data);

  if (!result.status || result.data === null) {
    return respond<CurrentUser>({ ...result, data: null });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.AUTH_TOKEN, result.data.token, getAuthCookieOptions());

  // Only the safe user goes back to the browser. The token stays in the HttpOnly cookie.
  const body: ApiResult<CurrentUser> = { ...result, statusCode: HTTP_OK, data: result.data.user };

  return respond(body);
}
