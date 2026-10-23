import { Bookmark } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SavedJobsPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="itt-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {t("accountNav.savedJobs", "Saved jobs")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("savedJobs.subtitle", "Review, track and manage your saved IT opportunities.")}
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Bookmark aria-hidden="true" className="size-6" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {t("savedJobs.loadingTitle", "Saved jobs workspace")}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t(
            "savedJobs.loadingDescription",
            "Your saved jobs list is ready. Detailed card management and filters will appear here.",
          )}
        </p>
      </div>
    </div>
  );
}
