import { cookies } from "next/headers";

import type { LogoutResult } from "@/features/auth/types";
import { respond } from "@/lib/api/route-response";
import { COOKIE_NAMES } from "@/lib/constants/cookie-helper";

const HTTP_OK = 200;

/** POST /api/auth/logout: clear the auth cookie. The browser then redirects to /login. */
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.AUTH_TOKEN);

  return respond<LogoutResult>({
    status: true,
    statusCode: HTTP_OK,
    message: "Logged out",
    data: { isLoggedOut: true },
  });
}
