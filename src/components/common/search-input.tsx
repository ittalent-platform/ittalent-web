import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export function SearchInput({
  className,
  error,
  maxLength,
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  error?: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className={cn(
          "relative flex h-11 items-center gap-[9px] rounded-lg border border-solid bg-card px-[15px] py-px focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          error ? "border-destructive" : "border-input",
        )}
      >
        <Search className="pointer-events-none relative ml-0.5 size-[15px] shrink-0 text-muted-foreground" />
        <input
          aria-invalid={Boolean(error)}
          className="w-full bg-transparent p-0 text-[13.5px] font-normal leading-normal tracking-normal text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? t("search.placeholder")}
          type="search"
          value={value}
        />
        {value ? (
          <button
            aria-label={t("search.clearSearch")}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onChange("")}
            type="button"
          >
            <X className="size-[15px]" />
          </button>
        ) : null}
      </div>
      {error ? <p className="text-[12.5px] font-normal leading-snug text-destructive">{error}</p> : null}
    </div>
  );
}
