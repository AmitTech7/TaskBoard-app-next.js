import { notFound } from "next/navigation";

import { TaskDetail } from "@/features/tasks/components/task-detail";

export default async function TaskDetailPage({ params }: PageProps<"/tasks/[id]">) {
  const { id } = await params;
  const taskId = Number(id);

  // "/tasks/abc" or "/tasks/-3" can never be a task: show the 404 page instead of calling the API.
  if (!Number.isInteger(taskId) || taskId < 1) {
    notFound();
  }

  return <TaskDetail taskId={taskId} />;
}
