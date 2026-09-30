import { useTranslation } from "react-i18next";

import { DocumentChip } from "@/components/common/document-chip";
import type { ApplicationItem } from "./applications.constants";

/** The documents submitted with an application, as compact chips (CV, Cover letter). */
export function ApplicationDocuments({ types }: { types: ApplicationItem["submittedDocuments"] }) {
  const { t } = useTranslation();
  if (!types.length) return <span className="text-xs text-muted-foreground">{t("applications.noDocuments")}</span>;
  return <span className="flex flex-wrap gap-1.5">{types.map((type) => <DocumentChip key={type} label={t(`applications.attachment.${type}`)} />)}</span>;
}
