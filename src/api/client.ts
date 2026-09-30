import { getPublicEnv } from "@/config/env";
import { client } from "./generated/client.gen";
import type { RefreshTokenResponse } from "./generated/types.gen";

export type AuthTokens = RefreshTokenResponse;

const env = getPublicEnv(import.meta.env);

export const SESSION_EXPIRED_EVENT = "auth:session-expired";
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

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAuthTokens(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    setStoredTokens(null);
    return null;
  }

  try {
    const fetchFn = client.getConfig().fetch ?? fetch;
    const baseUrl = client.getConfig().baseUrl ?? env.VITE_API_URL;
    const res = await fetchFn(`${baseUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!res.ok) {
      setStoredTokens(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      }
      return null;
    }

    const json = (await res.json()) as {
      data?: RefreshTokenResponse;
    };
    const newTokens = json?.data;
    if (newTokens?.accessToken && newTokens?.refreshToken) {
      setStoredTokens(newTokens);
      return newTokens.accessToken;
    }

    setStoredTokens(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return null;
  } catch {
    setStoredTokens(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return null;
  } finally {
    refreshPromise = null;
  }
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

// Intercept responses to handle 401 and auto-refresh token
client.interceptors.response.use(async (response, request, opts) => {
  if (response.status !== 401) {
    return response;
  }

  // Prevent infinite retry loops
  if (request.headers.get("x-retry-attempt")) {
    return response;
  }

  const url = new URL(
    request.url,
    typeof window !== "undefined" ? window.location.origin : "http://localhost",
  );
  const isAuthEndpoint =
    url.pathname.endsWith("/auth/login") ||
    url.pathname.endsWith("/auth/register") ||
    url.pathname.endsWith("/auth/refresh") ||
    url.pathname.endsWith("/auth/reset-password") ||
    url.pathname.endsWith("/auth/forgot-password") ||
    url.pathname.endsWith("/auth/verify-email");

  if (isAuthEndpoint) {
    return response;
  }

  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) {
    // No way to renew the session: tell the app to send the user to Sign in.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    return response;
  }

  if (!refreshPromise) {
    refreshPromise = refreshAuthTokens();
  }

  const newAccessToken = await refreshPromise;
  if (!newAccessToken) {
    return response;
  }

  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${newAccessToken}`);
  headers.set("x-retry-attempt", "1");

  const requestInit: RequestInit = {
    method: request.method,
    headers,
    credentials: request.credentials,
    mode: request.mode,
    cache: request.cache,
    redirect: request.redirect,
  };

  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    opts.body !== undefined
  ) {
    requestInit.body =
      typeof opts.body === "string" ||
      opts.body instanceof FormData ||
      opts.body instanceof Blob
        ? opts.body
        : JSON.stringify(opts.body);
  }

  const retryRequest = new Request(request.url, requestInit);
  const fetchFn = opts.fetch ?? client.getConfig().fetch ?? fetch;
  return await fetchFn(retryRequest);
});

export { client };
