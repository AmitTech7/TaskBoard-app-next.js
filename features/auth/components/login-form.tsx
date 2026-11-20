"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useForm, type ControllerProps } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { appRoutes } from "@/lib/constants/navigation";

import { useLogin } from "../hooks/use-login";
import { loginSchema, type LoginFormValues } from "../validations/schemas";

type FieldRender<TName extends keyof LoginFormValues> = ControllerProps<
  LoginFormValues,
  TName
>["render"];

// Render functions live outside the component so they are not re-created on every render
// (and so no arrow function sits inside the JSX props).
const renderUsername: FieldRender<"username"> = ({ field }) => (
  <FormItem controlId="input-auth-username">
    <FormLabel>Username</FormLabel>
    <FormControl>
      <Input autoComplete="username" placeholder="emilys" {...field} />
    </FormControl>
    <FormMessage />
  </FormItem>
);

const renderPassword: FieldRender<"password"> = ({ field }) => (
  <FormItem controlId="input-auth-password">
    <FormLabel>Password</FormLabel>
    <FormControl>
      <Input type="password" autoComplete="current-password" placeholder="••••••••" {...field} />
    </FormControl>
    <FormMessage />
  </FormItem>
);

export function LoginForm() {
  const router = useRouter();
  const { mutateAsync, isPending } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const handleValidSubmit = useCallback(
    async (values: LoginFormValues) => {
      try {
        await mutateAsync(values);
        router.replace(appRoutes.DASHBOARD);
        // Make Next re-run server components now that the auth cookie exists.
        router.refresh();
      } catch {
        // Nothing to do: useLogin's onError already showed the toast.
      }
    },
    [mutateAsync, router],
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign in to TaskBoard</CardTitle>
        <CardDescription>
          Demo account: <span className="font-medium text-foreground">emilys</span> /{" "}
          <span className="font-medium text-foreground">emilyspass</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            id="form-auth-login"
            noValidate
            onSubmit={form.handleSubmit(handleValidSubmit)}
            className="grid gap-4"
          >
            <FormField control={form.control} name="username" render={renderUsername} />
            <FormField control={form.control} name="password" render={renderPassword} />
            <Button
              id="btn-auth-login"
              type="submit"
              disabled={isPending}
              className="cursor-pointer"
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
