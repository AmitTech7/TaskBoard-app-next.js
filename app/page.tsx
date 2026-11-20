import { redirect } from "next/navigation";

import { appRoutes } from "@/lib/constants/navigation";

// "/" has no content of its own. The (core) layout sends logged-out visitors on to /login.
export default function HomePage() {
  redirect(appRoutes.DASHBOARD);
}
