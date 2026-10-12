import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteApiV1MeCertificateLinksById,
  getApiV1MeCertificateLinks,
  patchApiV1MeCertificateLinksById,
  postApiV1MeCertificateLinks,
} from "@/api/generated";
import type { CreateCertificateLinkRequest, GetApiV1MeCertificateLinksData, UpdateCertificateLinkRequest } from "@/api/generated/types.gen";
import { unwrap } from "@/api/request-error";

export type CertificateListParams = NonNullable<GetApiV1MeCertificateLinksData["query"]>;

export const certificateKeys = {
  all: ["certificates"] as const,
  list: (params: CertificateListParams) => [...certificateKeys.all, params] as const,
};

export function useCertificatesQuery(params: CertificateListParams, enabled = true) {
  return useQuery({
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap(await getApiV1MeCertificateLinks({ query: params }), "Could not load certificates."),
    queryKey: certificateKeys.list(params),
  });
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    // One key per submitted form, so a retry of the same click never adds the certificate twice.
    mutationFn: async ({ body, key }: { body: CreateCertificateLinkRequest; key: string }) =>
      unwrap(await postApiV1MeCertificateLinks({ body, headers: { "Idempotency-Key": key } }), "Couldn't save the certificate."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
  });
}

export function useUpdateCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, id }: { body: UpdateCertificateLinkRequest; id: string }) =>
      unwrap(await patchApiV1MeCertificateLinksById({ body, path: { id } }), "Couldn't update this certificate."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ expectedVersion, id }: { expectedVersion: number; id: string }) =>
      unwrap(await deleteApiV1MeCertificateLinksById({ path: { id }, query: { expectedVersion } }), "Couldn't delete the certificate."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
  });
}
