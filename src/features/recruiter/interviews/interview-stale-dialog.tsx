import { Ban, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";

import type { StaleKind } from "./interviews.edit";

const ICON = { changed: RefreshCw, notEditable: Ban } as const satisfies Record<StaleKind, typeof RefreshCw>;

/** Said when an edit or a new time reaches an interview that someone else changed, or ended, in the meantime. */
export function InterviewStaleDialog({ kind, onClose }: { kind: StaleKind; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <ActionConfirmDialog
      action={t(`interviews.stale.${kind}.action`)}
      cancelLabel={t("actions.close")}
      description={t(`interviews.stale.${kind}.description`)}
      icon={ICON[kind]}
      onConfirm={onClose}
      onOpenChange={(open) => !open && onClose()}
      open
      title={t(`interviews.stale.${kind}.title`)}
      variant="info-solid"
    />
  );
}
