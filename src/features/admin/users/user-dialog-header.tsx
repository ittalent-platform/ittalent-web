import type { UserDto } from "@/api/generated/types.gen";
import { PersonAvatar } from "@/components/common/person-avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

import { userDisplayName } from "./user-display";

/** Header of the per-account dialogs (edit information, change email): avatar, title and the account name. */
export function UserDialogHeader({ title, user }: { title: string; user: UserDto }) {
  return (
    <DialogHeader className="pr-14">
      <div className="flex items-center gap-3.5">
        <PersonAvatar className="size-10 text-[13px]" name={userDisplayName(user)} tone="peach" />
        <div className="flex min-w-0 flex-col gap-[3px]">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{userDisplayName(user)}</DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
}

/** Read-only email with a lock icon; `tooltip` says why it can't be edited. */
export function LockedEmailInput({ tooltip, ...props }: { tooltip?: string } & Omit<React.ComponentProps<typeof Input>, "readOnly" | "type">) {
  const input = <Input aria-readonly className="cursor-not-allowed truncate border-border bg-muted pr-10 text-muted-foreground" readOnly type="email" {...props} />;
  return (
    <div className="relative">
      {tooltip ? <Tooltip content={tooltip}>{input}</Tooltip> : input}
      <Lock aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
