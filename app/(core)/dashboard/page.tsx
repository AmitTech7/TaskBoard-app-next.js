import { getCurrentUser } from "@/features/auth/api/server";
import { DashboardStats } from "@/features/tasks/components/dashboard-stats";
import { TasksBoundary } from "@/features/tasks/components/tasks-boundary";
import { formatDateDisplay } from "@/lib/utils/date";

// The page title is in the top bar (h1), and the shell's <main> already wraps this page.
// getCurrentUser() is React-cached, so this costs no second API call.
export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold wrap-break-word">
          Welcome, {user?.firstName} {user?.lastName}
        </h2>
        <p className="text-muted-foreground">Today is {formatDateDisplay(new Date())}</p>
      </div>
      <TasksBoundary>
        <DashboardStats />
      </TasksBoundary>
    </div>
  );
}
