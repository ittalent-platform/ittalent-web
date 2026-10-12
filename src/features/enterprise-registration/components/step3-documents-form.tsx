import { useState, useRef } from "react";
import { FileText, UploadCloud, Trash2 } from "lucide-react";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DOCUMENT_TYPE_LABELS,
  REGISTRATION_CONFIG,
  REGISTRATION_MESSAGES,
  type LegalDocumentType,
} from "../enterprise-registration.constants";
import { useRegistrationWizard } from "../context/registration-wizard-context";
import { useUploadLegalDocumentMutation } from "../enterprise-registration.queries";

function formatBytes(bytes?: number): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

  const [docType, setDocType] = useState<LegalDocumentType>("business_license");
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useUploadLegalDocumentMutation();

  const documents = draft?.legal_documents || [];

  const hasBusinessLicense = documents.some(
    (d) => d.document_type === "business_license",
  );
  const hasAuthLetter = documents.some(
    (d) => d.document_type === "power_of_attorney",
  );

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
        documentType: docType,
        file,
      });

      if (uploadedDoc && draft) {
        // Append or replace the uploaded document in local draft
        const filteredDocs = (draft.legal_documents || []).filter(
          (d) => d.file_name !== uploadedDoc.file_name,
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
      setErrorMessage(REGISTRATION_MESSAGES.MISSING_LEGAL_DOCUMENTS);
      return;
    }

    if (!isLegalRepresentative && !hasAuthLetter) {
      setErrorMessage(REGISTRATION_MESSAGES.AUTHORIZATION_LETTER_REQUIRED);
      return;
    }

    onNext();
  };

  return (
    <div className="rounded-2xl border border-[#e6e4df] bg-[#ffffff] p-6 shadow-xs sm:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-[#19191c]">
          Legal Verification Documents
        </h2>
        <p className="mt-1 text-[13.5px] text-[#64646b]">
          Upload official legal records (PDF format, up to 5MB each) verifying your enterprise identity.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6">
          <InlineBanner tone="error">{errorMessage}</InlineBanner>
        </div>
      )}

      {/* Mandatory Requirements Checklist Callout */}
      <div className="mb-6 rounded-xl border border-[#e6e4df] bg-[#faf9f5] p-4 text-[13px]">
        <span className="font-semibold text-[#19191c]">Required documents for submission:</span>
        <ul className="mt-2 space-y-1.5 text-[#64646b]">
          <li className="flex items-center gap-2">
            <span
              className={`inline-flex size-4.5 items-center justify-center rounded-full text-xs font-bold ${
                hasBusinessLicense
                  ? "bg-[#e8f5ee] text-[#12764a]"
                  : "bg-[#f1efe9] text-[#737379]"
              }`}
            >
              {hasBusinessLicense ? "✓" : "1"}
            </span>
            <span className={hasBusinessLicense ? "font-medium text-[#19191c]" : ""}>
              Business Registration Certificate (BRC) — Mandatory
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span
              className={`inline-flex size-4.5 items-center justify-center rounded-full text-xs font-bold ${
                isLegalRepresentative || hasAuthLetter
                  ? "bg-[#e8f5ee] text-[#12764a]"
                  : "bg-[#feeceb] text-[#d93829]"
              }`}
            >
              {isLegalRepresentative || hasAuthLetter ? "✓" : "2"}
            </span>
            <span
              className={
                !isLegalRepresentative && !hasAuthLetter
                  ? "font-medium text-[#d93829]"
                  : hasAuthLetter
                    ? "font-medium text-[#19191c]"
                    : "text-[#737379]"
              }
            >
              Letter of Authorization (LoA) — {isLegalRepresentative ? "Not required (Legal Rep)" : "Mandatory for delegate"}
            </span>
          </li>
        </ul>
      </div>

      {/* Uploader Box */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="w-full sm:w-72">
            <label htmlFor="doc_type_select" className="mb-1 block text-xs font-semibold text-[#19191c]">
              Select document type:
            </label>
            <Select
              value={docType}
              onValueChange={(val) => setDocType(val as LegalDocumentType)}
            >
              <SelectTrigger id="doc_type_select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business_license">
                  {DOCUMENT_TYPE_LABELS.business_license}
                </SelectItem>
                <SelectItem value="power_of_attorney">
                  {DOCUMENT_TYPE_LABELS.power_of_attorney}
                </SelectItem>
                <SelectItem value="tax_registration">
                  {DOCUMENT_TYPE_LABELS.tax_registration}
                </SelectItem>
                <SelectItem value="other">
                  {DOCUMENT_TYPE_LABELS.other}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-[#f2470c] bg-[#fff5f2]"
              : "border-[#d8d6d0] bg-[#faf9f5] hover:border-[#b8b6af]"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f2ec] text-[#64646b]">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-[#19191c]">
            Click to upload or drag & drop PDF here
          </p>
          <p className="mt-1 text-xs text-[#737379]">
            Supported file type: PDF only (maximum 5MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            className="mt-4"
          >
            {uploadMutation.isPending ? "Uploading..." : "Select PDF Document"}
          </Button>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="mt-8 space-y-3">
        <h3 className="text-sm font-semibold text-[#19191c]">
          Attached Documents ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e6e4df] p-6 text-center text-xs text-[#737379]">
            No legal documents uploaded yet.
          </div>
        ) : (
          <div className="divide-y divide-[#efede8] rounded-xl border border-[#e6e4df] bg-[#ffffff]">
            {documents.map((doc, idx) => (
              <div
                key={`${doc.file_name}-${idx}`}
                className="flex items-center justify-between p-3.5 transition-colors hover:bg-[#faf9f5]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fde8e0] text-[#f2470c]">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#19191c]">
                      {doc.file_name}
                    </p>
                    <div className="flex items-center gap-2 text-[11.5px] text-[#737379]">
                      <span className="rounded bg-[#efede8] px-1.5 py-0.5 text-[10.5px] font-medium text-[#19191c]">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </span>
                      <span>•</span>
                      <span>{formatBytes(doc.file_size)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveDoc(idx)}
                  className="rounded p-1.5 text-[#737379] hover:bg-[#feeceb] hover:text-[#d93829]"
                  title="Remove document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nav Actions */}
      <div className="flex items-center justify-between gap-3 border-t border-[#efede8] pt-6 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving || uploadMutation.isPending}
        >
          ← Back
        </Button>

        <Button
          type="button"
          onClick={handleProceed}
          disabled={isSaving || uploadMutation.isPending}
          className="min-w-[140px]"
        >
          Review & Submit →
        </Button>
      </div>
    </div>
  );
}
