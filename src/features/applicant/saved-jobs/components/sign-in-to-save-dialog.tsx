import { Bookmark } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  redirectTo?: string;
};

export function SignInToSaveDialog({
  open,
  onOpenChange,
  redirectTo,
}: SignInToSaveDialogProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const currentPath = encodeURIComponent(
    redirectTo || `${location.pathname}${location.search}`,
  );

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-[480px] gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl">
        <div className="flex flex-col gap-4 p-6 sm:p-7">
          <div className="grid size-11 place-items-center rounded-xl bg-mkt-accent-tint text-mkt-accent">
            <Bookmark aria-hidden="true" className="size-5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <AlertDialogTitle className="itt-display text-xl font-semibold text-mkt-ink">
              {t("savedJobs.dialog.signInTitle", "Sign in to save jobs")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed text-mkt-ink-2">
              {t(
                "savedJobs.dialog.signInDescription",
                "Saved jobs are private to your candidate account. Sign in to return directly to this job.",
              )}
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
                {t("savedJobs.dialog.createAccountAction", "Create an account")}
              </Link>
            </Button>
          </AlertDialogCancel>
          <Button
            asChild
            className="h-10 px-5 text-[13.5px] font-semibold bg-mkt-accent text-white hover:bg-mkt-accent-hover"
            shape="pill"
          >
            <Link onClick={() => onOpenChange(false)} to={`/login?next=${currentPath}`}>
              {t("savedJobs.dialog.signInAction", "Sign in")}
            </Link>
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
