import { useCallback, useState, type ReactNode } from "react";

import { ScheduleInterviewDialog } from "./schedule-interview-dialog";

/** Opens the Schedule interview dialog, optionally on a given day (`YYYY-MM-DD`); the screen renders `dialog`. */
export function useScheduleInterview(): { dialog: ReactNode; open: (day?: string) => void } {
  const [state, setState] = useState<{ day?: string | undefined } | null>(null);
  const open = useCallback((day?: string) => setState({ day }), []);

  const dialog = state ? <ScheduleInterviewDialog initialDate={state.day} onClose={() => setState(null)} /> : null;
  return { dialog, open };
}
