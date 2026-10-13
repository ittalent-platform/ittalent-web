import { useCallback, useState, type ReactNode } from "react";

import { InterviewStatusDialog } from "./interview-status-dialog";
import type { InterviewItem, StatusAction } from "./interviews.constants";

export type InterviewAction = StatusAction;

type Pending = { action: InterviewAction; interview: InterviewItem };

/**
 * What a recruiter can do to an interview from a menu or a button. A screen calls `run` and renders `dialog`,
 * so the confirmation outlives the menu that asked for it.
 */
export function useInterviewActions(): { dialog: ReactNode; run: (action: InterviewAction, interview: InterviewItem) => void } {
  const [pending, setPending] = useState<Pending | null>(null);
  const run = useCallback((action: InterviewAction, interview: InterviewItem) => setPending({ action, interview }), []);

  const dialog = pending ? <InterviewStatusDialog action={pending.action} interview={pending.interview} onClose={() => setPending(null)} /> : null;
  return { dialog, run };
}
