import { getCurrentUser } from "@/features/auth/api/server";
import type { CurrentUser } from "@/features/auth/types";
import { respond } from "@/lib/api/route-response";

const HTTP_OK = 200;
const HTTP_UNAUTHORIZED = 401;

/** GET /api/auth/get-current-user: lets browser code ask "who am I?" (the token cookie is HttpOnly). */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return respond<CurrentUser>({
      status: false,
      statusCode: HTTP_UNAUTHORIZED,
      message: "Not authenticated",
      data: null,
    });
  }

  return respond<CurrentUser>({
    status: true,
    statusCode: HTTP_OK,
    message: "Success",
    data: user,
  });
}
