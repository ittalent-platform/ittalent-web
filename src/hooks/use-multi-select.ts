import { useCallback, useMemo, useState } from "react";

/**
 * Generic multi-select state for any list of ids (card grids, tables, etc).
 * Not tied to a specific feature — reuse wherever bulk selection + a bulk
 * action bar is needed (e.g. admin lists, board views).
 */
export function useMultiSelect<T extends string>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggle = useCallback((id: T) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const isSelected = useCallback(
    (id: T) => selectedIds.has(id),
    [selectedIds],
  );

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectAll = useCallback((ids: T[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const selectedIdList = useMemo(
    () => Array.from(selectedIds),
    [selectedIds],
  );

  return {
    clear,
    isSelected,
    selectAll,
    selectedCount: selectedIds.size,
    selectedIdList,
    toggle,
  };
}
