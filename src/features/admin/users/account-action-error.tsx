import { useTranslation } from "react-i18next";

import { DIALOG_BUTTON_CLASS } from "@/components/common/action-confirm-dialog";
import { Callout } from "@/components/common/callout";
import { Button } from "@/components/ui/button";

import type { AccountErrorKind } from "./account-error";

/** Explains why an account action failed and offers the one next step that helps (reload, retry). */
export function AccountActionError({ kind, message, onReload, onRetry }: { kind: AccountErrorKind; message?: string; onReload?: () => void; onRetry?: () => void }) {
  const { t } = useTranslation();
  const action = kind === "stale" && onReload
    ? <Button className={DIALOG_BUTTON_CLASS} onClick={onReload} shape="default" type="button" variant="outline">{t("adminUsers.errors.showLatest")}</Button>
    : kind === "server" && onRetry ? <Button className={DIALOG_BUTTON_CLASS} onClick={onRetry} shape="default" type="button" variant="outline">{t("actions.retry")}</Button> : null;
  const body = kind === "other" ? (message || t("state.error")) : t(`adminUsers.errors.${kind}.body`);
  return (
    <Callout role="alert" title={kind === "other" ? t("adminUsers.errors.otherTitle") : t(`adminUsers.errors.${kind}.title`)} tone={kind === "stale" || kind === "server" ? "warning" : "error"}>
      <div className="flex flex-col items-start gap-2"><span>{body}</span>{action}</div>
    </Callout>
  );
}
