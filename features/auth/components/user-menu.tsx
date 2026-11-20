"use client";

import { Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appRoutes } from "@/lib/constants/navigation";

import { useCurrentUser } from "../hooks/use-current-user";
import { useLogout } from "../hooks/use-logout";

const ICON_SIZE = 16;

/** The avatar button in the top bar: shows who you are and offers Log out. */
export function UserMenu() {
  const router = useRouter();
  // Already in the cache (CurrentUserHydration), so there is no loading state to handle.
  const { data: user } = useCurrentUser();
  const { mutateAsync, isPending } = useLogout();

  const handleLogout = useCallback(async () => {
    try {
      await mutateAsync();
      router.replace(appRoutes.LOGIN);
      router.refresh();
    } catch {
      // Nothing to do: useLogout's onError already showed the toast.
    }
  }, [mutateAsync, router]);

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Account";
  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="btn-user-menu"
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open user menu"
          className="cursor-pointer rounded-full"
        >
          <Avatar>
            <AvatarImage src={user?.image} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-sm font-medium wrap-break-word">{fullName}</span>
          <span className="text-xs text-muted-foreground wrap-break-word">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          id="btn-auth-logout"
          disabled={isPending}
          onSelect={handleLogout}
          className="cursor-pointer"
        >
          <HugeiconsIcon icon={Logout01Icon} size={ICON_SIZE} />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
