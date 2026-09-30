import { useState, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordField({
  className,
  error,
  id,
  inputClassName,
  label,
  labelExtra,
  registration,
}: {
  className?: string;
  error?: ReactNode;
  id: string;
  inputClassName?: string;
  label: string;
  labelExtra?: ReactNode;
  registration: UseFormRegisterReturn;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label
          className="text-[13.5px] font-semibold text-foreground"
          htmlFor={id}
        >
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <Input
          className={cn(
            "pr-12",
            inputClassName,
          )}
          id={id}
          placeholder={t("auth.password.placeholder")}
          type={visible ? "text" : "password"}
          {...registration}
        />
        <Button
          aria-label={t(visible ? "auth.password.hide" : "auth.password.show", { label: label.toLowerCase() })}
          className="absolute right-1 top-1/2 -translate-y-1/2"
          onClick={() => setVisible((value) => !value)}
          size="icon"
          type="button"
          variant="ghost"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      {error ? (
        <p className="mt-1.5 text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
