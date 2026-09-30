import type { ReactNode } from "react";

import { SearchInput } from "./search-input";

export function ListToolbar({
  children,
  className,
  onSearchChange,
  search,
  searchError,
  searchMaxLength,
  searchPlaceholder,
}: {
  children?: ReactNode;
  className?: string;
  onSearchChange: (value: string) => void;
  search: string;
  searchError?: string;
  searchMaxLength?: number;
  searchPlaceholder?: string;
}) {
  return (
    <div className={className ?? "flex flex-wrap items-start gap-3"}>
      <SearchInput
        className="min-w-[280px] flex-[1_0_0]"
        error={searchError}
        maxLength={searchMaxLength}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        value={search}
      />
      {children}
    </div>
  );
}
