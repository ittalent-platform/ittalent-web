import { getPublicEnv } from "@/config/env";
import { client } from "./generated/client.gen";
import type { RefreshTokenResponse } from "./generated/types.gen";

export type AuthTokens = RefreshTokenResponse;

const env = getPublicEnv(import.meta.env);

const ACCESS_TOKEN_KEY = "ittalent_access_token";
const REFRESH_TOKEN_KEY = "ittalent_refresh_token";

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const accessToken = memoryAccessToken ?? localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = memoryRefreshToken ?? localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function setStoredTokens(tokens: AuthTokens | null): void {
  if (typeof window === "undefined") return;
  if (!tokens) {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return;
  }
  memoryAccessToken = tokens.accessToken;
  memoryRefreshToken = tokens.refreshToken;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

client.setConfig({
  baseUrl: env.VITE_API_URL,
  credentials: "include",
});

// Intercept requests to attach Bearer token
client.interceptors.request.use((request) => {
  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    request.headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }
  return request;
});

export { client };
