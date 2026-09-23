import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";

export function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(234,88,12,0.16),_transparent_34%),linear-gradient(180deg,#fff,_#fbfbfb)] px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-2xl backdrop-blur">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">{t("loadingScreen.message")}</p>
      </div>
    </div>
  );
}
