import { getApiV1AuthMe } from "@/api/generated";
import type { UserDto } from "@/api/generated/types.gen";
import {
  getStoredTokens,
  setStoredTokens,
  refreshAuthTokens,
  type AuthTokens,
} from "@/api/client";

const HTTP_UNAUTHORIZED = 401;

export async function getCurrentUser(): Promise<UserDto | null> {
  const tokens = getStoredTokens();
  if (!tokens?.accessToken) {
    return null;
  }

  const result = await getApiV1AuthMe();
  if (result.error || !result.data) {
    // Only a rejected session ends it. A dropped or aborted request (for example a reload while this
    // call is in flight) must not wipe the stored tokens and silently sign the user out.
    if (result.response?.status === HTTP_UNAUTHORIZED) {
      setStoredTokens(null);
    }
    return null;
  }

  return result.data;
}

export function handleLoginSuccess(tokens: AuthTokens, user?: UserDto): void {
  setStoredTokens(tokens);
  if (user) {
    sessionStorage.setItem("ittalent_user", JSON.stringify(user));
  }
}

export function handleLogout(): void {
  setStoredTokens(null);
  sessionStorage.removeItem("ittalent_user");
}

export const authClient = {
  getStoredTokens,
  setStoredTokens,
  getCurrentUser,
  refreshToken: refreshAuthTokens,
  login: handleLoginSuccess,
  logout: handleLogout,
};
