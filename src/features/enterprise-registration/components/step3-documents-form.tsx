import { useState, useRef, type ReactNode } from "react";
import { FileText, UploadCloud, Trash2 } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";

import { InlineBanner } from "@/components/common/inline-banner";
import { SectionCard } from "@/components/common/section-card";
import { Button } from "@/components/ui/button";
import {
  BYTES_PER_MB,
  REGISTRATION_CONFIG,
  REGISTRATION_MESSAGE_KEYS,
  type LegalDocumentType,
} from "@/features/enterprise-registration/enterprise-registration.constants";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import {
  useEnterpriseRegistrationDetailQuery,
  useUploadLegalDocumentMutation,
} from "@/features/enterprise-registration/enterprise-registration.queries";
import type { LegalDocumentResponse } from "@/features/enterprise-registration/enterprise-registration.types";

import { WIZARD_PRIMARY_BUTTON_CLASS, WizardActions } from "./wizard-actions";
import { formatFileSize } from "./format-file-size";

const PDF_EXTENSION = ".pdf";
const MAX_FILE_MB = REGISTRATION_CONFIG.MAX_FILE_SIZE / BYTES_PER_MB;
const ALLOWED_MIME_TYPES: readonly string[] = REGISTRATION_CONFIG.ALLOWED_DOCUMENT_MIME_TYPES;
const SLOT_CLASS = "flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40";

/** One upload slot: a label with its hint, then either the uploaded file (replace / remove) or a prompt to pick one. */
function DocumentSlot({
  doc,
  emptyState,
  hint,
  isBusy,
  label,
  onRemove,
  onSelect,
  required,
  selectLabel,
}: {
  doc?: LegalDocumentResponse;
  /** Replaces the default "select a file" row when no file is uploaded yet. */
  emptyState?: ReactNode;
  hint: string;
  isBusy: boolean;
  label: string;
  onRemove: () => void;
  onSelect: () => void;
  required?: boolean;
  selectLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="m-0 text-sm font-semibold text-foreground">
          {label} {required ? <span className="text-destructive">*</span> : null}
        </p>
        <p className="m-0 text-xs text-muted-foreground">{hint}</p>
      </div>

      {doc ? (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-(--status-error-bg) text-(--status-error-fg)">
              <FileText aria-hidden className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="m-0 truncate text-sm font-medium text-foreground">{doc.file_name}</p>
              <p className="m-0 text-xs text-muted-foreground">
                {formatFileSize(doc.file_size) ?? t("enterpriseRegistration.step3.unknownSize")} · <span className="font-semibold text-(--status-success-fg)">{t("enterpriseRegistration.step3.uploaded")}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button disabled={isBusy} onClick={onSelect} size="sm" type="button" variant="outline">
              {t("enterpriseRegistration.step3.replace")}
            </Button>
            <button
              aria-label={t("enterpriseRegistration.step3.remove")}
              className="cursor-pointer p-2 text-muted-foreground transition-colors hover:text-destructive"
              disabled={isBusy}
              onClick={onRemove}
              title={t("enterpriseRegistration.step3.remove")}
              type="button"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        (emptyState ?? <div className={SLOT_CLASS} onClick={onSelect}>
          <div className="flex items-center gap-3">
            <UploadCloud aria-hidden className="size-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{selectLabel}</span>
          </div>
          <Button size="sm" type="button" variant="outline">
            {t("enterpriseRegistration.step3.chooseFile")}
          </Button>
        </div>)
      )}
    </div>
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

  const [activeSlot, setActiveSlot] = useState<LegalDocumentType>("business_license");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadLegalDocumentMutation();
  // The server bumps the draft version on every upload; re-read it so later saves and the submit carry the new one.
  const detailQuery = useEnterpriseRegistrationDetailQuery(registrationId ?? "", { enabled: false });

  const documents = draft?.legal_documents || [];
  const findDoc = (type: LegalDocumentType) => documents.find((d) => d.document_type === type);
  const bLicenseDoc = findDoc("business_license");
  const loaDoc = findDoc("power_of_attorney");
  const otherDoc = findDoc("other");
  const isBusy = uploadMutation.isPending || isSaving;

  const triggerUpload = (slot: LegalDocumentType) => {
    setActiveSlot(slot);
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);

    // Some systems report an empty MIME type for PDFs, so the extension counts too; the server checks the real bytes.
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(PDF_EXTENSION)) {
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
      await uploadMutation.mutateAsync({ id: registrationId, documentType: activeSlot, file });
      const { data: fresh } = await detailQuery.refetch();
      if (fresh) setDraft(fresh);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message || t("enterpriseRegistration.step3.uploadFailed"));
    }
  };

  const saveDocuments = async (docs: LegalDocumentResponse[]) => {
    if (!draft) return;
    await saveDraft({
      legal_documents: docs.map((d) => ({ document_type: d.document_type, file_name: d.file_name, file_url: d.file_url, file_size: d.file_size })),
      version: draft.version,
    });
  };

  const removeDoc = async (slotType: LegalDocumentType) => {
    if (!draft) return;
    setErrorMessage(null);
    try {
      await saveDocuments(documents.filter((d) => d.document_type !== slotType));
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message || t("enterpriseRegistration.step3.uploadFailed"));
    }
  };

  const handleProceed = () => {
    setErrorMessage(null);
    if (!bLicenseDoc) {
      setErrorMessage(t(REGISTRATION_MESSAGE_KEYS.MISSING_LEGAL_DOCUMENTS));
      return;
    }

    if (!isLegalRepresentative && !loaDoc) {
      setErrorMessage(t(REGISTRATION_MESSAGE_KEYS.AUTHORIZATION_LETTER_REQUIRED));
      return;
    }

    onNext();
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionCard className="gap-5 p-6 sm:p-7" description={t("enterpriseRegistration.step3.subtitle")} title={t("enterpriseRegistration.step3.title")}>
        {errorMessage ? <InlineBanner tone="error">{errorMessage}</InlineBanner> : null}

        <input
          accept={PDF_EXTENSION}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileProcess(file);
            e.target.value = "";
          }}
          ref={fileInputRef}
          type="file"
        />

        <div className="flex flex-col gap-6">
          <DocumentSlot
            doc={bLicenseDoc}
            hint={t("enterpriseRegistration.step3.brcHint")}
            isBusy={isBusy}
            label={t("enterpriseRegistration.step3.brc")}
            onRemove={() => void removeDoc("business_license")}
            onSelect={() => triggerUpload("business_license")}
            required
            selectLabel={t("enterpriseRegistration.step3.brcSelect")}
          />

          {!isLegalRepresentative || loaDoc ? (
            <DocumentSlot
              doc={loaDoc}
              hint={t("enterpriseRegistration.step3.loaHint")}
              isBusy={isBusy}
              label={t("enterpriseRegistration.step3.loa")}
              onRemove={() => void removeDoc("power_of_attorney")}
              onSelect={() => triggerUpload("power_of_attorney")}
              required={!isLegalRepresentative}
              selectLabel={t("enterpriseRegistration.step3.loaSelect")}
            />
          ) : null}

          <DocumentSlot
            doc={otherDoc}
            emptyState={
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center transition-colors hover:bg-muted/20"
                onClick={() => triggerUpload("other")}
              >
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-(--status-warning-bg) text-(--status-warning-fg)">
                  <UploadCloud aria-hidden className="size-5" />
                </div>
                <p className="m-0 text-sm font-medium text-foreground">
                  <Trans components={{ choose: <span className="font-semibold text-fg-link underline" /> }} i18nKey="enterpriseRegistration.step3.dropText" />
                </p>
                <p className="m-0 mt-1 text-xs text-muted-foreground">{t("enterpriseRegistration.step3.dropHint", { mb: MAX_FILE_MB })}</p>
              </div>
            }
            hint={t("enterpriseRegistration.step3.otherHint")}
            isBusy={isBusy}
            label={t("enterpriseRegistration.step3.other")}
            onRemove={() => void removeDoc("other")}
            onSelect={() => triggerUpload("other")}
            selectLabel=""
          />
        </div>
      </SectionCard>

      <WizardActions onBack={onBack} onSaveDraft={() => void saveDocuments(documents)} saveDisabled={isBusy}>
        <Button className={WIZARD_PRIMARY_BUTTON_CLASS} disabled={isBusy} onClick={handleProceed} type="button">
          {t("enterpriseRegistration.common.continue")}
        </Button>
      </WizardActions>
    </div>
  );
}
