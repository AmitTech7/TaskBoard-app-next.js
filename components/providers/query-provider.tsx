"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

import { makeQueryClient } from "@/lib/queries/query-client-config";

export function QueryProvider({ children }: Readonly<{ children: ReactNode }>) {
  // useState's initialiser runs once per browser session, so the cache survives re-renders.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* The devtools are stripped from production builds automatically. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
