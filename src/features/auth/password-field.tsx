import { useState, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordField({
  className,
  error,
  hint,
  id,
  inputClassName,
  label,
  labelExtra,
  registration,
  required,
}: {
  className?: string;
  error?: ReactNode;
  hint?: ReactNode;
  id: string;
  inputClassName?: string;
  label: string;
  labelExtra?: ReactNode;
  registration: UseFormRegisterReturn;
  required?: boolean;
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <FormField className={className} error={error} hint={hint} htmlFor={id} label={label} labelExtra={labelExtra} required={required}>
      <div className="relative">
        <Input
          aria-invalid={Boolean(error)}
          className={cn("pr-12", inputClassName)}
          id={id}
          placeholder={t("auth.password.placeholder")}
          type={visible ? "text" : "password"}
          {...registration}
        />
        <Button
          aria-label={t(visible ? "auth.password.hide" : "auth.password.show", { label: label.toLowerCase() })}
          className="absolute right-1.5 top-1/2 size-[34px] -translate-y-1/2 rounded-[10px] text-muted-foreground"
          onClick={() => setVisible((value) => !value)}
          size="icon"
          type="button"
          variant="ghost"
        >
          {visible ? <EyeOff className="size-[17px]" /> : <Eye className="size-[17px]" />}
        </Button>
      </div>
    </FormField>
  );
}
