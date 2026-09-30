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

  // Several keys in ONE update: React Router applies each functional update to the params of the last render,
  // so two separate calls in the same event would drop the first change.
  const setMany = useCallback(
    (patch: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === "") next.delete(key);
          else next.set(key, value);
        }
        // Any change other than paging itself goes back to the first page.
        if (!("page" in patch)) next.delete("page");
        return next;
      });
    },
    [setSearchParams],
  );

  const set = useCallback((key: string, value: string | null) => setMany({ [key]: value }), [setMany]);

  return { page, limit, search, debouncedSearch, sort, set, setMany };
}
