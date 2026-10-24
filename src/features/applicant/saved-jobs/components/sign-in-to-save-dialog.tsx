import { Bookmark } from "lucide-react";
import { Link, useLocation } from "react-router";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
          <AlertDialogCancel asChild>
            <Button
              asChild
              className="h-10 px-4 text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip"
              shape="pill"
              variant="outline"
            >
              <Link to={`/register?next=${currentPath}`}>
                Create an account
              </Link>
            </Button>
          </AlertDialogCancel>
          <Button
            asChild
            className="h-10 px-5 text-[13.5px] font-semibold bg-mkt-accent text-white hover:bg-mkt-accent-hover"
            shape="pill"
          >
            <Link onClick={() => onOpenChange(false)} to={`/login?next=${currentPath}`}>
              Sign in
            </Link>
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
