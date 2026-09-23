import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ErrorStateAction = {
  label: string;
  onClick: () => void;
};

type ErrorStateProps = {
  description: string;
  icon?: LucideIcon;
  onRetry?: () => void;
  secondaryAction?: ErrorStateAction;
  title?: string;
};

export function ErrorState({ description, icon, onRetry, secondaryAction, title }: ErrorStateProps) {
  const { t } = useTranslation();
  const Icon = icon;

  return (
    <Card
      aria-live="assertive"
      className="border-destructive/20 bg-destructive/5"
      role="alert"
    >
      <CardHeader className="mx-auto max-w-md items-center text-center">
        {Icon ? (
          <div className="mb-2 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <Icon className="size-6" />
          </div>
        ) : null}
        <CardTitle>{title ?? t("errorState.defaultTitle")}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {onRetry || secondaryAction ? (
        <CardContent className="mx-auto flex max-w-md flex-col items-center gap-3">
          {onRetry ? (
            <Button onClick={onRetry} variant="outline">
              {t("errorState.retry")}
            </Button>
          ) : null}
          {secondaryAction ? (
            <button
              className="text-[13px] font-semibold text-primary hover:underline"
              onClick={secondaryAction.onClick}
              type="button"
            >
              {secondaryAction.label}
            </button>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
