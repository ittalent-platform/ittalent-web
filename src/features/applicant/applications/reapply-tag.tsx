import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import { applicationDisplayId } from "./application-formatters";
import { APPLICATIONS_PATH, type ApplicationItem } from "./applications.constants";

const TAG_STATIC = "inline-flex h-5 items-center rounded-[5px] bg-(--status-info-bg) px-1.5 text-[11px] font-bold text-(--status-info-fg)";
const TAG = `${TAG_STATIC} hover:underline`;

/** BR-APP-008 links: "2nd application" on the reapplication, "Reapplied as APP-…" on the withdrawn record. */
/** `interactive={false}` renders plain text, for use inside another link (board cards). */
export function ReapplyTag({ application, interactive = true }: { application: Pick<ApplicationItem, "reappliedAs" | "reappliedFrom">; interactive?: boolean }) {
  const { t } = useTranslation();
  if (!interactive) {
    const label = application.reappliedFrom ? t("applications.reapply.second") : application.reappliedAs ? t("applications.reapply.reappliedAs", { id: applicationDisplayId(application.reappliedAs) }) : null;
    return label ? <span className={TAG_STATIC}>{label}</span> : null;
  }
  if (application.reappliedFrom) {
    return <Link className={TAG} title={t("applications.reapply.openEarlier", { id: applicationDisplayId(application.reappliedFrom) })} to={`${APPLICATIONS_PATH}/${application.reappliedFrom}`}>{t("applications.reapply.second")}</Link>;
  }
  if (application.reappliedAs) {
    return <Link className={TAG} to={`${APPLICATIONS_PATH}/${application.reappliedAs}`}>{t("applications.reapply.reappliedAs", { id: applicationDisplayId(application.reappliedAs) })}</Link>;
  }
  return null;
}
