import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";

import { DASHBOARD_PARAMS, DEFAULT_RANGE, type DashboardRange } from "./dashboard.constants";
import { parsePeriodParams, periodQuery, type PeriodSelection } from "./dashboard.period";

/** The period shown, read from the address; choosing another one rewrites the address (and so keeps it shareable). */
export function useDashboardPeriod() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selection = useMemo<PeriodSelection>(() => parsePeriodParams(searchParams), [searchParams]);
  const query = useMemo(() => periodQuery(selection), [selection]);

  const select = useCallback(
    (range: DashboardRange, days?: { from: string; to: string }) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          // A choice replaces what the link carried: the dates are overwritten and its time-zone note no longer applies.
          next.delete(DASHBOARD_PARAMS.timeZone);
          next.delete(DASHBOARD_PARAMS.from);
          next.delete(DASHBOARD_PARAMS.to);
          if (range === DEFAULT_RANGE) next.delete(DASHBOARD_PARAMS.range);
          else next.set(DASHBOARD_PARAMS.range, range);
          if (range === "custom" && days) {
            next.set(DASHBOARD_PARAMS.from, days.from);
            next.set(DASHBOARD_PARAMS.to, days.to);
          }
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  return { query, selection, selectCustom: (from: string, to: string) => select("custom", { from, to }), selectPreset: (range: DashboardRange) => select(range) };
}
