import type {
  EnterpriseRegistrationDetail,
  LegalDocumentResponse,
  PaginatedEnterpriseRegistrationSummary,
  SaveEnterpriseRegistrationDraftRequest,
  StartEnterpriseRegistrationRequest,
  StartEnterpriseRegistrationResponse,
  SubmissionReceiptResponse,
  SubmitEnterpriseRegistrationRequest,
  VerifyEnterpriseRegistrationEmailResponse,
} from "@/api/generated/types.gen";
import type {
  AdminDecisionType,
  EnterpriseRegistrationStatus,
  LegalDocumentType,
} from "./enterprise-registration.constants";

export type EnterpriseRegistrationSummary =
  PaginatedEnterpriseRegistrationSummary["items"][number];

export type {
  EnterpriseRegistrationDetail,
  LegalDocumentResponse,
  PaginatedEnterpriseRegistrationSummary,
  SaveEnterpriseRegistrationDraftRequest,
  StartEnterpriseRegistrationRequest,
  StartEnterpriseRegistrationResponse,
  SubmissionReceiptResponse,
  SubmitEnterpriseRegistrationRequest,
  VerifyEnterpriseRegistrationEmailResponse,
};

export type RegistrationListParams = {
  enabled?: boolean;
  limit?: number;
  page: number;
  status?: EnterpriseRegistrationStatus;
  search?: string;
};

export type AdminChecklistState = {
  tax_code_verified: boolean;
  legal_representative_verified: boolean;
  documents_verified: boolean;
};

export type AdminDecisionPayload = {
  decision: AdminDecisionType;
  version: number;
  checklist?: AdminChecklistState;
  rejection_reason?: string;
};

export type WizardStepKey = "step1" | "step2" | "step3" | "step4";

export interface LegalDocumentItem {
  document_type: LegalDocumentType;
  file_name: string;
  file_url: string;
  file_size?: number;
}
