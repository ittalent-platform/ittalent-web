import { Bookmark } from "lucide-react";
import { Link, useLocation } from "react-router";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";

export type SignInToSaveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SignInToSaveDialog({ open, onOpenChange }: SignInToSaveDialogProps) {
  const location = useLocation();
  const currentPath = encodeURIComponent(`${location.pathname}${location.search}`);

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-[480px] gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl">
        <div className="flex flex-col gap-4 p-6 sm:p-7">
          <div className="grid size-11 place-items-center rounded-xl bg-mkt-accent-tint text-mkt-accent">
            <Bookmark aria-hidden="true" className="size-5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <AlertDialogTitle className="itt-display text-xl font-semibold text-mkt-ink">
              Sign in to save jobs
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-mkt-ink-2">
              Saved jobs are private to your candidate account. You’ll come back to this job after signing in.
            </AlertDialogDescription>
          </div>
        </div>

        <div className="flex flex-col-reverse items-stretch justify-end gap-2.5 border-t border-mkt-line bg-mkt-card px-6 py-4 sm:flex-row sm:items-center">
          <AlertDialogCancel asChild className={DIALOG_BUTTON_CLASS}>
            <Link
              className="flex h-10 items-center justify-center rounded-lg border border-mkt-line bg-white px-4 text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip"
              to={`/register?redirect=${currentPath}`}
            >
              Create an account
            </Link>
          </AlertDialogCancel>
          <Link
            className="flex h-10 items-center justify-center rounded-lg bg-mkt-accent px-5 text-[13.5px] font-semibold text-white hover:bg-mkt-accent-hover"
            onClick={() => onOpenChange(false)}
            to={`/login?redirect=${currentPath}`}
          >
            Sign in
          </Link>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
