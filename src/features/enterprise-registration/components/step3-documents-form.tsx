import { useState, useRef } from "react";
import { FileText, UploadCloud, Trash2 } from "lucide-react";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import {
  REGISTRATION_CONFIG,
  type LegalDocumentType,
} from "@/features/enterprise-registration/enterprise-registration.constants";
import { useRegistrationWizard } from "@/features/enterprise-registration/context/registration-wizard-context";
import { useUploadLegalDocumentMutation } from "@/features/enterprise-registration/enterprise-registration.queries";

function formatBytes(bytes?: number): string {
  if (!bytes) return "1.2 MB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Step3DocumentsForm({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
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

  const documents = draft?.legal_documents || [];

  const bLicenseDoc = documents.find((d) => d.document_type === "business_license");
  const loaDoc = documents.find((d) => d.document_type === "power_of_attorney");
  const otherDoc = documents.find((d) => d.document_type === "other");

  const triggerUpload = (slot: LegalDocumentType) => {
    setActiveSlot(slot);
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);

    if (file.type !== "application/pdf") {
      setErrorMessage("Only PDF documents (.pdf) are accepted for legal verification.");
      return;
    }

    if (file.size > REGISTRATION_CONFIG.MAX_FILE_SIZE) {
      setErrorMessage(
        `File size exceeds ${REGISTRATION_CONFIG.MAX_FILE_SIZE / (1024 * 1024)} MB limit.`,
      );
      return;
    }

    if (!registrationId) {
      setErrorMessage("Registration intake ID is missing. Please restart registration.");
      return;
    }

    try {
      const uploadedDoc = await uploadMutation.mutateAsync({
        id: registrationId,
        documentType: activeSlot,
        file,
      });

      if (uploadedDoc && draft) {
        const filteredDocs = (draft.legal_documents || []).filter(
          (d) => d.document_type !== activeSlot,
        );
        const nextDocs = [...filteredDocs, uploadedDoc];
        setDraft({
          ...draft,
          legal_documents: nextDocs,
        });
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setErrorMessage(errorObj.message || "Failed to upload document. Please try again.");
    }
  };

  const removeDoc = (slotType: LegalDocumentType) => {
    if (!draft) return;
    const nextDocs = (draft.legal_documents || []).filter(
      (d) => d.document_type !== slotType,
    );
    setDraft({
      ...draft,
      legal_documents: nextDocs,
    });
  };

  const handleProceed = () => {
    setErrorMessage(null);
    if (!bLicenseDoc) {
      setErrorMessage(
        "Business Registration Certificate (PDF) is required for submission.",
      );
      return;
    }

    if (!isLegalRepresentative && !loaDoc) {
      setErrorMessage(
        "Letter of Authorization (PDF) is required when you are not the legal representative.",
      );
      return;
    }

    onNext();
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-7 flex flex-col gap-5">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">
            Documents
          </h2>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            An ITTalent admin checks these before approving. Files are private: only reviewers can open them.
          </p>
        </div>

        {errorMessage && (
          <InlineBanner tone="error">{errorMessage}</InlineBanner>
        )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileProcess(file);
          e.target.value = "";
        }}
      />

      <div className="space-y-6">
        {/* Slot 1: Business registration certificate * */}
        <div className="space-y-2">
          <div>
            <label className="text-sm font-semibold text-foreground">
              Business registration certificate <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground">
              The latest certificate showing the legal name and tax code.
            </p>
          </div>

          {bLicenseDoc ? (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {bLicenseDoc.file_name || "Business registration certificate.pdf"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(bLicenseDoc.file_size)} ·{" "}
                    <span className="font-semibold text-(--status-success-fg)">
                      Uploaded
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => triggerUpload("business_license")}
                >
                  Replace
                </Button>
                <button
                  type="button"
                  onClick={() => removeDoc("business_license")}
                  className="p-2 text-muted-foreground transition-colors hover:text-destructive"
                  title="Remove document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => triggerUpload("business_license")}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <UploadCloud className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Select Business Registration Certificate (PDF)
                </span>
              </div>
              <Button type="button" variant="outline" size="sm">
                Choose file
              </Button>
            </div>
          )}
        </div>

        {/* Slot 2: Letter of authorization * */}
        {(!isLegalRepresentative || loaDoc) && (
          <div className="space-y-2">
            <div>
              <label className="text-sm font-semibold text-foreground">
                Letter of authorization {!isLegalRepresentative && <span className="text-destructive">*</span>}
              </label>
              <p className="text-xs text-muted-foreground">
                Signed by the legal representative, saying you may register the company. Not needed if you are the legal representative.
              </p>
            </div>

            {loaDoc ? (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {loaDoc.file_name || "Letter of authorization.pdf"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(loaDoc.file_size)} ·{" "}
                      <span className="font-semibold text-(--status-success-fg)">
                        Uploaded
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => triggerUpload("power_of_attorney")}
                  >
                    Replace
                  </Button>
                  <button
                    type="button"
                    onClick={() => removeDoc("power_of_attorney")}
                    className="p-2 text-muted-foreground transition-colors hover:text-destructive"
                    title="Remove document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => triggerUpload("power_of_attorney")}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-3">
                  <UploadCloud className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Select Letter of Authorization (PDF)
                  </span>
                </div>
                <Button type="button" variant="outline" size="sm">
                  Choose file
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Slot 3: Other supporting document (optional) */}
        <div className="space-y-2">
          <div>
            <label className="text-sm font-semibold text-foreground">
              Other supporting document
            </label>
            <p className="text-xs text-muted-foreground">
              Optional. For example, an office lease or a company profile.
            </p>
          </div>

          {otherDoc ? (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {otherDoc.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(otherDoc.file_size)} ·{" "}
                    <span className="font-semibold text-(--status-success-fg)">
                      Uploaded
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => triggerUpload("other")}
                >
                  Replace
                </Button>
                <button
                  type="button"
                  onClick={() => removeDoc("other")}
                  className="p-2 text-muted-foreground transition-colors hover:text-destructive"
                  title="Remove document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => triggerUpload("other")}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center transition-colors hover:bg-muted/20"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-(--status-warning-bg) text-(--status-warning-fg)">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Drop a PDF here or{" "}
                <span className="font-semibold text-primary underline">choose a file</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF only · up to 5 MB</p>
            </div>
          )}
        </div>
      </div>

      </section>

      {/* Footer Navigation on background */}
      <div className="flex items-center justify-between pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 rounded-xl px-5 text-[14px] font-semibold"
        >
          Back
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={async () => {
              if (draft) await saveDraft({ version: draft.version });
            }}
            className="h-11 rounded-xl px-5 text-[14px] font-semibold"
          >
            Save draft
          </Button>
          <Button
            type="submit"
            disabled={uploadMutation.isPending}
            onClick={handleProceed}
            className="h-11 rounded-xl px-6 text-[14px] font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
