import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiV1AdminDocuments, getApiV1Documents, postApiV1Documents } from "@/api/generated";
import { requestError } from "@/api/request-error";
import type { Document, GetApiV1DocumentsData, UploadDocumentRequest } from "@/api/generated/types.gen";

export type DocumentListParams = NonNullable<GetApiV1DocumentsData["query"]>;
export type DocumentType = Document["type"];

export const documentKeys = {
  all: ["documents"] as const,
  list: (params: DocumentListParams) => [...documentKeys.all, params] as const,
};

function unwrap<T>(result: { data?: T; error?: unknown; response?: Response }, fallback: string): T {
  if (!result.error && result.data !== undefined) return result.data;
  throw requestError(result, fallback);
}

export function useDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: async () => unwrap(await getApiV1Documents({ query: params }), "Could not load documents."),
  });
}

export function useAdminDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: [...documentKeys.all, "admin", params] as const,
    queryFn: async () => unwrap(await getApiV1AdminDocuments({ query: params }), "Could not load documents."),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: UploadDocumentRequest) =>
      unwrap(await postApiV1Documents({ body }), "Could not upload document."),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
