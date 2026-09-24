import { useState, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordField({
  error,
  id,
  label,
  labelExtra,
  registration,
}: {
  error?: ReactNode;
  id: string;
  label: string;
  labelExtra?: ReactNode;
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          className="text-[13px] font-semibold text-foreground"
          htmlFor={id}
        >
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <Input
          className="pr-12"
          id={id}
          placeholder="••••••••"
          type={visible ? "text" : "password"}
          {...registration}
        />
        <Button
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
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
