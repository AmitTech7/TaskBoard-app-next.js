import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/api/server";
import { LoginForm } from "@/features/auth/components/login-form";
import { appRoutes } from "@/lib/constants/navigation";

export default async function LoginPage() {
  // Already signed in? No reason to show the login form.
  if (await getCurrentUser()) {
    redirect(appRoutes.DASHBOARD);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
