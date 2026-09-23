import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function SearchEmptyState({
  description,
  icon: Icon,
  onClear,
  title,
}: {
  description: string;
  icon: LucideIcon;
  onClear: () => void;
  title: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[270px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid size-12 place-items-center">
        <Icon className="size-10 text-(--status-disabled-fg)" strokeWidth={1.9} />
      </span>
      <h2 className="mt-4 text-[20px] font-semibold leading-tight text-foreground">{title}</h2>
      <p className="mt-3 max-w-[335px] text-[15px] leading-[1.85] text-muted-foreground">{description}</p>
      <Button className="mt-3 text-[15px]" onClick={onClear} variant="link">
        {t("search.clearSearch")}
      </Button>
    </div>
  );
}
