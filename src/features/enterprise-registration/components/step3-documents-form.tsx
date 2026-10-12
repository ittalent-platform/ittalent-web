import { useState, useRef } from "react";
import { ArrowRight, Check, FileText, UploadCloud, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { InlineBanner } from "@/components/common/inline-banner";
import { SectionCard } from "@/components/common/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUTH_ACTION_CLASS } from "@/features/auth/auth-status.constants";
import {
  BYTES_PER_MB,
  legalDocumentTypes,
  REGISTRATION_CONFIG,
  REGISTRATION_MESSAGE_KEYS,
  type LegalDocumentType,
} from "@/features/enterprise-registration/enterprise-registration.constants";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import {
  useEnterpriseRegistrationDetailQuery,
  useUploadLegalDocumentMutation,
} from "@/features/enterprise-registration/enterprise-registration.queries";
import { cn } from "@/lib/utils";

import { StepActions } from "./step-actions";

const BYTES_PER_KB = 1024;
const MAX_FILE_MB = REGISTRATION_CONFIG.MAX_FILE_SIZE / BYTES_PER_MB;
const ALLOWED_MIME_TYPES: readonly string[] = REGISTRATION_CONFIG.ALLOWED_DOCUMENT_MIME_TYPES;

/** One line of the "required documents" checklist: green tick when met, red when missing and needed. */
function RequirementRow({ label, met, missing }: { label: string; met: boolean; missing?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex size-[18px] shrink-0 items-center justify-center rounded-full",
          met ? "bg-(--status-success-bg) text-(--status-success-fg)" : missing ? "bg-(--status-error-bg) text-(--status-error-fg)" : "bg-card text-muted-foreground",
        )}
      >
        {met ? <Check aria-hidden className="size-3" strokeWidth={3} /> : <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      </span>
      <span className={cn(met && "font-medium text-foreground", missing && !met && "font-medium text-(--danger-fg)")}>{label}</span>
    </li>
  );
}

export function Step3DocumentsForm({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const {
    registrationId,
    draft,
    setDraft,
    saveDraft,
    isSaving,
    isLegalRepresentative,
  } = useRegistrationWizard();

  const [docType, setDocType] = useState<LegalDocumentType>("business_license");
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadLegalDocumentMutation();
  // The server bumps the draft version on every upload; re-read it so later saves and the submit carry the new one.
  const detailQuery = useEnterpriseRegistrationDetailQuery(registrationId ?? "", { enabled: false });

  const documents = draft?.legal_documents || [];

  const hasBusinessLicense = documents.some(
    (d) => d.document_type === "business_license",
  );
  const hasAuthLetter = documents.some(
    (d) => d.document_type === "power_of_attorney",
  );
  const authLetterMet = isLegalRepresentative || hasAuthLetter;

  const formatBytes = (bytes?: number): string => {
    if (!bytes) return t("enterpriseRegistration.step3.unknownSize");
    if (bytes < BYTES_PER_KB) return `${bytes} B`;
    if (bytes < BYTES_PER_MB) return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
    return `${(bytes / BYTES_PER_MB).toFixed(2)} MB`;
  };

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(t("enterpriseRegistration.step3.onlyPdf"));
      return;
    }

    if (file.size > REGISTRATION_CONFIG.MAX_FILE_SIZE) {
      setErrorMessage(t("enterpriseRegistration.step3.tooLarge", { mb: MAX_FILE_MB }));
      return;
    }

    if (!registrationId) {
      setErrorMessage(t("enterpriseRegistration.step3.missingId"));
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        id: registrationId,
        documentType: docType,
        file,
      });
      const { data: fresh } = await detailQuery.refetch();
      if (fresh) setDraft(fresh);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message || t("enterpriseRegistration.step3.uploadFailed"));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileProcess(file);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileProcess(file);
    }
  };

  const handleRemoveDoc = async (indexToRemove: number) => {
    if (!draft) return;
    const nextDocs = documents.filter((_, i) => i !== indexToRemove);
    setDraft({
      ...draft,
      legal_documents: nextDocs,
    });

    try {
      await saveDraft({
        legal_documents: nextDocs.map((d) => ({
          document_type: d.document_type,
          file_name: d.file_name,
          file_url: d.file_url,
          file_size: d.file_size,
        })),
        version: draft.version,
      });
    } catch {
      // Ignore background auto-save failure on deletion
    }
  };

  const handleProceed = () => {
    setErrorMessage(null);

    if (!hasBusinessLicense) {
      setErrorMessage(t(REGISTRATION_MESSAGE_KEYS.MISSING_LEGAL_DOCUMENTS));
      return;
    }

    if (!isLegalRepresentative && !hasAuthLetter) {
      setErrorMessage(t(REGISTRATION_MESSAGE_KEYS.AUTHORIZATION_LETTER_REQUIRED));
      return;
    }

    onNext();
  };

  const busy = isSaving || uploadMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <SectionCard description={t("enterpriseRegistration.step3.subtitle", { mb: MAX_FILE_MB })} title={t("enterpriseRegistration.step3.title")}>
        {errorMessage ? <InlineBanner tone="error">{errorMessage}</InlineBanner> : null}

        <div className="rounded-xl border border-border bg-muted/40 p-4 text-[13px]">
          <span className="font-semibold text-foreground">{t("enterpriseRegistration.step3.requiredTitle")}</span>
          <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0 text-muted-foreground">
            <RequirementRow label={t("enterpriseRegistration.step3.brcRequired")} met={hasBusinessLicense} />
            <RequirementRow
              label={t(isLegalRepresentative ? "enterpriseRegistration.step3.loaNotRequired" : "enterpriseRegistration.step3.loaRequired")}
              met={authLetterMet}
              missing={!authLetterMet}
            />
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="w-full sm:w-72">
            <label className="mb-1 block text-xs font-semibold text-foreground" htmlFor="doc_type_select">
              {t("enterpriseRegistration.step3.typeLabel")}
            </label>
            <Select onValueChange={(val) => setDocType(val as LegalDocumentType)} value={docType}>
              <SelectTrigger id="doc_type_select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {legalDocumentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`enterpriseRegistration.documentTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
              dragOver ? "border-primary bg-accent" : "border-(--line-dashed) bg-muted/40 hover:border-muted-foreground/50",
            )}
            onDragLeave={() => setDragOver(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDrop={handleDrop}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <UploadCloud aria-hidden className="size-6" />
            </div>
            <p className="m-0 mt-3 text-sm font-semibold text-foreground">{t("enterpriseRegistration.step3.dropTitle")}</p>
            <p className="m-0 mt-1 text-xs text-muted-foreground">{t("enterpriseRegistration.step3.dropHint", { mb: MAX_FILE_MB })}</p>
            <input
              accept={ALLOWED_MIME_TYPES.join(",")}
              className="hidden"
              onChange={handleFileInputChange}
              ref={fileInputRef}
              type="file"
            />
            <Button
              className={`${AUTH_ACTION_CLASS} mt-4`}
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
              shape="xl"
              type="button"
              variant="outline"
            >
              {uploadMutation.isPending ? t("enterpriseRegistration.step3.uploading") : t("enterpriseRegistration.step3.select")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="m-0 text-[13.5px] font-bold text-foreground">{t("enterpriseRegistration.step3.attached", { count: documents.length })}</h3>

          {documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-(--line-dashed) p-6 text-center text-xs text-muted-foreground">
              {t("enterpriseRegistration.step3.none")}
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col divide-y divide-line-muted rounded-xl border border-border bg-card p-0">
              {documents.map((doc, idx) => (
                <li className="flex items-center justify-between gap-3 p-3.5" key={`${doc.file_name}-${idx}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-(--status-warning-bg) text-(--status-warning-fg)">
                      <FileText aria-hidden className="size-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 truncate text-xs font-semibold text-foreground">{doc.file_name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                        <Badge>{t(`enterpriseRegistration.documentTypes.${doc.document_type}`)}</Badge>
                        <span>{formatBytes(doc.file_size)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    aria-label={t("enterpriseRegistration.step3.remove")}
                    className="cursor-pointer rounded p-1.5 text-muted-foreground hover:bg-(--status-error-bg) hover:text-destructive"
                    onClick={() => void handleRemoveDoc(idx)}
                    title={t("enterpriseRegistration.step3.remove")}
                    type="button"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>

      <StepActions backDisabled={busy} onBack={onBack}>
        <Button className={AUTH_ACTION_CLASS} disabled={busy} onClick={handleProceed} shape="xl" type="button">
          {t("enterpriseRegistration.step3.next")}
          <ArrowRight aria-hidden />
        </Button>
      </StepActions>
    </div>
  );
}
