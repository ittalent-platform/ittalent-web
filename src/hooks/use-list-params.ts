import { useCallback } from "react";
import { useSearchParams } from "react-router";

import { useDebouncedValue } from "./use-debounced-value";

function positiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function useListParams(options: { defaultLimit?: number } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get("page"), 1);
  const limit = positiveInteger(searchParams.get("limit"), options.defaultLimit ?? 10);
  const search = searchParams.get("search") ?? "";
  const sort = searchParams.get("sort") ?? undefined;
  const debouncedSearch = useDebouncedValue(search, 300);

  const set = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
        if (key !== "page") next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  return { page, limit, search, debouncedSearch, sort, set };
}
