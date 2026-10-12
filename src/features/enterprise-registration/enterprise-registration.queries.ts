import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getApiV1EnterpriseRegistrations,
  getApiV1EnterpriseRegistrationsById,
  getApiV1EnterpriseRegistrationsVerifyEmail,
  patchApiV1EnterpriseRegistrationsByIdDraft,
  postApiV1EnterpriseRegistrationsByIdDecision,
  postApiV1EnterpriseRegistrationsByIdDocuments,
  postApiV1EnterpriseRegistrationsByIdSubmit,
  postApiV1EnterpriseRegistrationsInvitationsAccept,
  postApiV1EnterpriseRegistrationsStart,
} from "@/api/generated";
import type {
  SaveEnterpriseRegistrationDraftRequest,
  StartEnterpriseRegistrationRequest,
  SubmitEnterpriseRegistrationRequest,
  UploadLegalDocumentFormRequest,
} from "@/api/generated/types.gen";
import type {
  AdminDecisionPayload,
  RegistrationListParams,
} from "./enterprise-registration.types";

function unwrap<T>(result: { data?: T; error?: unknown; response?: Response }): T {
  if (result.error) {
    throw Object.assign(result.error as object, { status: result.response?.status });
  }
  return result.data as T;
}

export const enterpriseRegistrationKeys = {
  all: ["enterprise-registrations"] as const,
  lists: () => [...enterpriseRegistrationKeys.all, "list"] as const,
  list: (params: RegistrationListParams) =>
    [...enterpriseRegistrationKeys.lists(), params] as const,
  details: () => [...enterpriseRegistrationKeys.all, "detail"] as const,
  detail: (id: string) => [...enterpriseRegistrationKeys.details(), id] as const,
  verifyEmail: (token: string) =>
    [...enterpriseRegistrationKeys.all, "verify-email", token] as const,
};

export function useEnterpriseRegistrationsListQuery(params: RegistrationListParams) {
  const { enabled = true, limit = 20, page, status, search } = params;
  return useQuery({
    enabled,
    queryKey: enterpriseRegistrationKeys.list({ page, limit, status, search }),
    queryFn: async () => {
      const res = await getApiV1EnterpriseRegistrations({
        query: { page, limit, ...(status ? { status } : {}), ...(search ? { search } : {}) },
      });
      return unwrap(res) ?? { items: [], total: 0, page, limit, totalPages: 0 };
    },
  });
}

export function useEnterpriseRegistrationDetailQuery(id: string, options = { enabled: Boolean(id) }) {
  return useQuery({
    enabled: options.enabled,
    queryKey: enterpriseRegistrationKeys.detail(id),
    queryFn: async () => unwrap(await getApiV1EnterpriseRegistrationsById({ path: { id } })),
  });
}

export function useVerifyRegistrationEmailQuery(token: string, options = { enabled: Boolean(token) }) {
  return useQuery({
    enabled: options.enabled,
    queryKey: enterpriseRegistrationKeys.verifyEmail(token),
    queryFn: async () => unwrap(await getApiV1EnterpriseRegistrationsVerifyEmail({ query: { token } })),
  });
}

export function useStartRegistrationMutation() {
  return useMutation({
    mutationFn: async (body: StartEnterpriseRegistrationRequest) =>
      unwrap(await postApiV1EnterpriseRegistrationsStart({ body })),
  });
}

export function useSaveRegistrationDraftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: SaveEnterpriseRegistrationDraftRequest }) =>
      unwrap(await patchApiV1EnterpriseRegistrationsByIdDraft({ path: { id }, body })),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(enterpriseRegistrationKeys.detail(id), data);
      queryClient.invalidateQueries({ queryKey: enterpriseRegistrationKeys.lists() });
    },
  });
}

export function useUploadLegalDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      documentType,
      file,
    }: {
      id: string;
      documentType: UploadLegalDocumentFormRequest["document_type"];
      file: File | Blob;
    }) =>
      unwrap(
        await postApiV1EnterpriseRegistrationsByIdDocuments({
          path: { id },
          body: { document_type: documentType, file },
        }),
      ),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: enterpriseRegistrationKeys.detail(id) });
    },
  });
}

export function useSubmitRegistrationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: SubmitEnterpriseRegistrationRequest }) =>
      unwrap(await postApiV1EnterpriseRegistrationsByIdSubmit({ path: { id }, body })),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: enterpriseRegistrationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: enterpriseRegistrationKeys.lists() });
    },
  });
}

export function useAdminRegistrationDecisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: AdminDecisionPayload }) =>
      unwrap(await postApiV1EnterpriseRegistrationsByIdDecision({ path: { id }, body: body as never })),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: enterpriseRegistrationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: enterpriseRegistrationKeys.lists() });
    },
  });
}

export function useAcceptRegistrationInvitationMutation() {
  return useMutation({
    mutationFn: async (body: { token: string; password: string; username?: string }) =>
      unwrap(await postApiV1EnterpriseRegistrationsInvitationsAccept({ body })),
  });
}
