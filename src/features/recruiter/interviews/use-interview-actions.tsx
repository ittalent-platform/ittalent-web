import { useCallback, useState, type ReactNode } from "react";

import { EditInterviewDialog } from "./edit-interview-dialog";
import { InterviewStatusDialog } from "./interview-status-dialog";
import type { InterviewItem, StatusAction } from "./interviews.constants";
import { RescheduleInterviewDialog } from "./reschedule-interview-dialog";

/** Everything a recruiter can do to a scheduled interview: change its status, edit its details or move it. */
export type InterviewAction = StatusAction | "edit" | "reschedule";

type Pending = { action: InterviewAction; interview: InterviewItem };

function dialogFor({ action, interview }: Pending, onClose: () => void): ReactNode {
  if (action === "edit") return <EditInterviewDialog interview={interview} onClose={onClose} />;
  if (action === "reschedule") return <RescheduleInterviewDialog interview={interview} onClose={onClose} />;
  return <InterviewStatusDialog action={action} interview={interview} onClose={onClose} />;
}

/**
 * What a recruiter can do to an interview from a menu or a button. A screen calls `run` and renders `dialog`,
 * so the dialog outlives the menu that asked for it.
 */
export function useInterviewActions(): { dialog: ReactNode; run: (action: InterviewAction, interview: InterviewItem) => void } {
  const [pending, setPending] = useState<Pending | null>(null);
  const run = useCallback((action: InterviewAction, interview: InterviewItem) => setPending({ action, interview }), []);

  return { dialog: pending ? dialogFor(pending, () => setPending(null)) : null, run };
}
