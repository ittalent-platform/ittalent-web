import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserDto } from "@/api/generated/types.gen";
import { getCurrentUser, handleLogout } from "./auth-client";
import { getStoredTokens } from "@/api/client";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export type SessionData = {
  user: UserDto;
};

export function useSession() {
  const queryClient = useQueryClient();
  const hasTokens = Boolean(getStoredTokens());

  const {
    data: user,
    isPending,
    refetch,
  } = useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled: hasTokens,
    staleTime: 30_000,
    retry: false,
  });

  const logout = () => {
    handleLogout();
    queryClient.setQueryData(authKeys.me(), null);
    void queryClient.invalidateQueries({ queryKey: authKeys.all });
  };

  return {
    data: user ? ({ user } as SessionData) : null,
    isPending: hasTokens && isPending,
    refetch: async () => {
      await refetch();
    },
    logout,
  };
}
