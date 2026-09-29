import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  client,
  getStoredTokens,
  refreshAuthTokens,
  setStoredTokens,
} from "@/api/client";

describe("Token Auto-Refresh Interceptor", () => {
  beforeEach(() => {
    localStorage.clear();
    setStoredTokens(null);
    vi.restoreAllMocks();
  });

  describe("refreshAuthTokens", () => {
    it("returns null when no refresh token is stored", async () => {
      const result = await refreshAuthTokens();
      expect(result).toBeNull();
    });

    it("refreshes tokens and updates storage on success", async () => {
      setStoredTokens({
        accessToken: "old-access-token",
        refreshToken: "valid-refresh-token",
      });

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            message: "Tokens refreshed successfully",
            data: {
              accessToken: "new-access-token",
              refreshToken: "new-refresh-token",
            },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

      client.setConfig({ fetch: fetchMock });

      const newAccessToken = await refreshAuthTokens();

      expect(newAccessToken).toBe("new-access-token");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/auth/refresh"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ refreshToken: "valid-refresh-token" }),
        }),
      );

      const stored = getStoredTokens();
      expect(stored?.accessToken).toBe("new-access-token");
      expect(stored?.refreshToken).toBe("new-refresh-token");
    });

    it("clears storage and returns null when refresh fails", async () => {
      setStoredTokens({
        accessToken: "old-access-token",
        refreshToken: "expired-refresh-token",
      });

      const dispatchSpy = vi.spyOn(window, "dispatchEvent");

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: false,
            message: "Invalid or expired refresh token",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

      client.setConfig({ fetch: fetchMock });

      const result = await refreshAuthTokens();

      expect(result).toBeNull();
      expect(getStoredTokens()).toBeNull();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: "auth:session-expired" }),
      );
    });
  });

  describe("Response Interceptor on 401", () => {
    it("intercepts 401, refreshes tokens, and replays original request", async () => {
      setStoredTokens({
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
      });

      const fetchMock = vi
        .fn()
        // 1. Initial protected request returns 401
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        )
        // 2. Refresh request returns 200 with new tokens
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        )
        // 3. Retried request returns 200 with data
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              success: true,
              data: [{ id: "user-1", username: "alex" }],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );

      client.setConfig({ fetch: fetchMock });

      const response = await client.get({
        url: "/api/v1/users",
      });

      expect(response.data).toEqual({
        success: true,
        data: [{ id: "user-1", username: "alex" }],
      });

      expect(fetchMock).toHaveBeenCalledTimes(3);

      // Verify the retried request carried the new access token and retry flag
      const retriedCall = fetchMock.mock.calls[2];
      const retriedRequest = retriedCall[0] as Request;
      expect(retriedRequest.headers.get("Authorization")).toBe(
        "Bearer new-access-token",
      );
      expect(retriedRequest.headers.get("x-retry-attempt")).toBe("1");
    });

    it("deduplicates concurrent 401 requests into a single refresh call", async () => {
      setStoredTokens({
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
      });

      let refreshCount = 0;

      const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const isRetry = input instanceof Request ? Boolean(input.headers.get("x-retry-attempt")) : false;

        if (url.includes("/api/v1/auth/refresh")) {
          refreshCount += 1;
          return Promise.resolve(
            new Response(
              JSON.stringify({
                success: true,
                data: {
                  accessToken: "new-access-token",
                  refreshToken: "new-refresh-token",
                },
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        // If it's a retried request, succeed
        if (isRetry) {
          return Promise.resolve(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }

        // Initial requests fail with 401
        return Promise.resolve(
          new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );
      });

      client.setConfig({ fetch: fetchMock });

      const [res1, res2] = await Promise.all([
        client.get({ url: "/api/v1/users" }),
        client.get({ url: "/api/v1/enterprises" }),
      ]);

      expect(res1.data).toEqual({ success: true });
      expect(res2.data).toEqual({ success: true });
      expect(refreshCount).toBe(1);
    });

    it("does not trigger refresh for auth endpoints that return 401", async () => {
      setStoredTokens({
        accessToken: "some-token",
        refreshToken: "valid-refresh-token",
      });

      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      );

      client.setConfig({ fetch: fetchMock });

      const response = await client.post({
        url: "/api/v1/auth/login",
        body: { identifier: "wrong", password: "wrong" },
      });

      expect(response.error).toEqual({ message: "Invalid credentials" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("prevents infinite loops when retried request also returns 401", async () => {
      setStoredTokens({
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
      });

      const fetchMock = vi
        .fn()
        // 1. Initial request returns 401
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        )
        // 2. Refresh returns new token
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        )
        // 3. Retried request returns 401 again
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ message: "Still Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );

      client.setConfig({ fetch: fetchMock });

      const response = await client.get({
        url: "/api/v1/users",
      });

      expect(response.error).toEqual({ message: "Still Unauthorized" });
      // Exactly 3 calls: initial, refresh, retry. No 4th call!
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});
