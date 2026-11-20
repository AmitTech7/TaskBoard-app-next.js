import { TasksBoundary } from "@/features/tasks/components/tasks-boundary";
import { TasksContent } from "@/features/tasks/components/tasks-content";

// page -> Boundary (loads data on the server) -> Content (the interactive list)
export default function TasksPage() {
  return (
    <TasksBoundary>
      <TasksContent />
    </TasksBoundary>
  );
}
