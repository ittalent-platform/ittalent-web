import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteApiV1DocumentsById,
  getApiV1AdminDocuments,
  getApiV1Documents,
  getApiV1DocumentsByIdDownload,
  getApiV1DocumentsByIdPreview,
  patchApiV1DocumentsByIdDefault,
  postApiV1Documents,
} from "@/api/generated";
import { requestError } from "@/api/request-error";
import type {
  Document,
  DocumentPreviewResponse,
  GetApiV1DocumentsData,
  UploadDocumentRequest,
} from "@/api/generated/types.gen";

export type DocumentListParams = NonNullable<GetApiV1DocumentsData["query"]>;
export type DocumentType = Document["type"];
export type DocumentPreview = Blob | DocumentPreviewResponse;

export const documentKeys = {
  all: ["documents"] as const,
  list: (params: DocumentListParams) => [...documentKeys.all, params] as const,
};

function unwrap<T>(
  result: { data?: T; error?: unknown; response?: Response },
  fallback: string,
): T {
  if (!result.error && result.data !== undefined) return result.data;
  throw requestError(result, fallback);
}

export function useDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: async () =>
      unwrap(
        await getApiV1Documents({ query: params }),
        "Could not load documents.",
      ),
  });
}

export function useAdminDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: [...documentKeys.all, "admin", params] as const,
    queryFn: async () =>
      unwrap(
        await getApiV1AdminDocuments({ query: params }),
        "Could not load documents.",
      ),
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

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const result = await deleteApiV1DocumentsById({ path: { id } });
      if (result.error)
        throw requestError(result, "Could not delete document.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useSetDefaultDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Document> =>
      unwrap(
        await patchApiV1DocumentsByIdDefault({ path: { id } }),
        "Could not set the default document.",
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export async function downloadDocument(id: string): Promise<Blob> {
  const result = await getApiV1DocumentsByIdDownload({
    parseAs: "blob",
    path: { id },
  });
  if (result.error || !(result.data instanceof Blob))
    throw requestError(result, "Could not download document.");
  return result.data;
}

export async function previewDocument(id: string): Promise<DocumentPreview> {
  const result = await getApiV1DocumentsByIdPreview({
    parseAs: "blob",
    path: { id },
  });
  if (result.error || result.data === undefined)
    throw requestError(result, "Could not preview document.");
  if (result.data instanceof Blob) {
    if (result.data.type !== "application/json") return result.data;
    const parsed: unknown = JSON.parse(await result.data.text());
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "previewUrl" in parsed &&
      typeof parsed.previewUrl === "string"
    ) {
      return { previewUrl: parsed.previewUrl };
    }
  }
  const data: unknown = result.data;
  if (
    typeof data === "object" &&
    data !== null &&
    "previewUrl" in data &&
    typeof data.previewUrl === "string"
  ) {
    return { previewUrl: data.previewUrl };
  }
  throw requestError(result, "Document preview returned an invalid response.");
}
