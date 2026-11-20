"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { unwrapApiResult } from "@/lib/api/api-error";
import { authKeys } from "@/lib/queries/query-keys";

import { loginRequest } from "../api/client";
import type { LoginFormValues } from "../validations/schemas";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: LoginFormValues) => unwrapApiResult(await loginRequest(values)),
    onSuccess: (user) => {
      // Seed the cache so the dashboard knows the user without another request.
      queryClient.setQueryData(authKeys.currentUser(), user);
      toast.success(`Welcome back, ${user.firstName}!`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
