"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useTasks } from "../hooks/use-tasks";
import { getTaskCounts } from "../utils/task-list";

interface StatCardProps {
  id: string;
  label: string;
  value: number | null;
}

function StatCard({ id, label, value }: Readonly<StatCardProps>) {
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <p className="text-3xl font-semibold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

/** Task counts for the dashboard, read from the same cached list the Tasks page uses. */
export function DashboardStats() {
  const { data } = useTasks();
  const counts = useMemo(() => (data ? getTaskCounts(data) : null), [data]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard id="stat-tasks-total" label="Total tasks" value={counts?.total ?? null} />
      <StatCard id="stat-tasks-completed" label="Completed" value={counts?.completed ?? null} />
      <StatCard id="stat-tasks-pending" label="Pending" value={counts?.pending ?? null} />
    </div>
  );
}
