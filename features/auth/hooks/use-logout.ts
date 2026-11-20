"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { unwrapApiResult } from "@/lib/api/api-error";

import { logoutRequest } from "../api/client";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => unwrapApiResult(await logoutRequest()),
    onSuccess: () => {
      // Drop everything cached for the old user so the next login starts clean.
      queryClient.clear();
      toast.success("Logged out");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
