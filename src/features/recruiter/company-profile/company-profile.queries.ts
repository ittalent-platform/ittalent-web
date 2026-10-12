import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "@/api/client";
import {
  getApiV1EnterprisesMyProfile,
  patchApiV1EnterprisesByEnterpriseId,
} from "@/api/generated";
import type {
  EnterpriseDetailDto,
  UpdateEnterpriseDto,
} from "@/api/generated/types.gen";

export const companyProfileKeys = {
  all: ["recruiter-company-profile"] as const,
  mine: () => [...companyProfileKeys.all, "mine"] as const,
};

export function useMyEnterpriseProfileQuery() {
  return useQuery({
    queryKey: companyProfileKeys.mine(),
    queryFn: async (): Promise<EnterpriseDetailDto> => {
      const result = await getApiV1EnterprisesMyProfile({
        client,
      });

      if (result.error) {
        throw Object.assign(result.error as object, {
          status: result.response?.status,
        });
      }

      if (!result.data) {
        throw new Error("Enterprise profile not found");
      }

      return result.data;
    },
    staleTime: 60_000,
  });
}

export function useUpdateMyEnterpriseProfileMutation(enterpriseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: UpdateEnterpriseDto,
    ): Promise<EnterpriseDetailDto> => {
      const result = await patchApiV1EnterprisesByEnterpriseId({
        client,
        path: { enterpriseId },
        body: data,
      });

      if (result.error) {
        const errorData = result.error as { message?: string };
        throw Object.assign(
          new Error(errorData.message ?? "Failed to update company profile"),
          errorData,
          {
            status: result.response?.status,
          },
        );
      }

      if (!result.data) {
        throw new Error("No data returned from update");
      }

      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: companyProfileKeys.mine(),
      });
    },
  });
}
