import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

export type AllAvailableBannerProps = {
  onShowAll: () => void;
};

export function AllAvailableBanner({ onShowAll }: AllAvailableBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-mkt-line bg-white p-10 text-center shadow-xs sm:p-12">
      <div className="grid size-12 place-items-center rounded-full bg-mkt-green-bg text-mkt-green-fg">
        <Check aria-hidden="true" className="size-6 stroke-[2.5]" />
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="itt-display text-lg font-semibold text-mkt-ink">
          {t(
            "savedJobs.allAvailable.title",
            "All your saved jobs are still available",
          )}
        </h2>
      </div>

      <Button
        className="mt-2 h-10 px-5 text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip shadow-xs"
        onClick={onShowAll}
        shape="pill"
        variant="outline"
      >
        {t("savedJobs.allAvailable.showAll", "Show all")}
      </Button>
    </div>
  );
}
