import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteApiV1MePortfolioLinksById,
  getApiV1MePortfolioLinks,
  patchApiV1MePortfolioLinksById,
  postApiV1MePortfolioLinks,
} from "@/api/generated";
import type { CreatePortfolioLinkRequest, GetApiV1MePortfolioLinksData, UpdatePortfolioLinkRequest } from "@/api/generated/types.gen";
import { unwrap } from "@/api/request-error";

export type PortfolioListParams = NonNullable<GetApiV1MePortfolioLinksData["query"]>;

export const portfolioKeys = {
  all: ["portfolio"] as const,
  list: (params: PortfolioListParams) => [...portfolioKeys.all, params] as const,
};

export function usePortfolioQuery(params: PortfolioListParams, enabled = true) {
  return useQuery({
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap(await getApiV1MePortfolioLinks({ query: params }), "Could not load your portfolio."),
    queryKey: portfolioKeys.list(params),
  });
}

export function useCreatePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    // One key per submitted form, so a retry of the same click never adds the item twice.
    mutationFn: async ({ body, key }: { body: CreatePortfolioLinkRequest; key: string }) =>
      unwrap(await postApiV1MePortfolioLinks({ body, headers: { "Idempotency-Key": key } }), "Couldn't save the portfolio item."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: portfolioKeys.all }),
  });
}

export function useUpdatePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ body, id }: { body: UpdatePortfolioLinkRequest; id: string }) =>
      unwrap(await patchApiV1MePortfolioLinksById({ body, path: { id } }), "Couldn't update this portfolio item."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: portfolioKeys.all }),
  });
}

export function useDeletePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ expectedVersion, id }: { expectedVersion: number; id: string }) =>
      unwrap(await deleteApiV1MePortfolioLinksById({ path: { id }, query: { expectedVersion } }), "Couldn't delete the portfolio item."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: portfolioKeys.all }),
  });
}
