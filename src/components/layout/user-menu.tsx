import { useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, LogOut, Users } from "lucide-react";

import { useSession } from "@/auth/use-session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/toast/toast-provider";
import { getLogoutSuccessToast } from "@/features/auth/logout-toast";
import { cn } from "@/lib/utils";

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: session, logout } = useSession();

  const user = session?.user;
  const displayName = user?.username ?? user?.email ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  function handleSignOut() {
    setIsSigningOut(true);
    try {
      logout();
      queryClient.clear();
      showToast(getLogoutSuccessToast());
      navigate("/login", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className={cn(
            "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 pb-1 text-left text-foreground outline-none transition hover:bg-black/5 dark:text-white dark:hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/40",
            collapsed && "lg:justify-center lg:px-0",
          )}
          type="button"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-(--status-peach-bg) text-sm font-bold text-(--status-peach-fg)">
            {initials}
          </div>

          <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
            <p className="truncate text-[0.95rem] font-semibold">
              {displayName}
            </p>
            <p className="truncate text-[0.8rem] text-muted-foreground">
              {user?.role === "admin" ? "Admin" : "User"}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[260px] rounded-[18px] py-1"
        side="bottom"
        sideOffset={8}
      >
        <div className="px-4 py-3 border-b border-border">
          <p className="truncate text-sm font-bold text-foreground">
            {displayName}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {user?.email} ·{" "}
            <span className="capitalize font-medium">
              {user?.role ?? "user"}
            </span>
          </p>
        </div>

        {user?.role === "admin" ? (
          <DropdownMenuItem
            className="gap-2.5 px-4 py-2.5 text-sm cursor-pointer"
            onSelect={() => navigate("/admin/users")}
          >
            <Users className="size-4" />
            User Management
          </DropdownMenuItem>
        ) : null}

        {user?.role === "user" ? (
          <DropdownMenuItem
            className="gap-2.5 px-4 py-2.5 text-sm cursor-pointer"
            onSelect={() => navigate("/documents")}
          >
            <FileText className="size-4" />
            My Documents
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem
          className="gap-2.5 px-4 py-2.5 text-sm font-semibold cursor-pointer text-destructive focus:text-destructive"
          disabled={isSigningOut}
          onSelect={() => handleSignOut()}
        >
          <LogOut className="size-4" />
          {isSigningOut ? "Signing out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
