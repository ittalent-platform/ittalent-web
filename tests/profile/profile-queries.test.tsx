import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { postApiV1AuthChangePassword } from "@/api/generated";
import { useChangeMyPassword } from "@/features/profile/profile.queries";

const mocks = vi.hoisted(() => ({
  setStoredTokens: vi.fn(),
}));

vi.mock("@/api/client", () => ({
  getStoredTokens: vi.fn(),
  refreshAuthTokens: vi.fn(),
  setStoredTokens: mocks.setStoredTokens,
}));

vi.mock("@/api/generated", () => ({
  getMyProfile: vi.fn(),
  postApiV1AuthChangePassword: vi.fn(),
  updateMyProfile: vi.fn(),
  uploadMyAvatar: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("profile password query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores replacement tokens so the current session remains usable", async () => {
    const tokens = { accessToken: "new-access", refreshToken: "new-refresh" };
    vi.mocked(postApiV1AuthChangePassword).mockResolvedValue({
      data: { success: true, message: "changed", data: { tokens } },
      response: new Response(null, { status: 200 }),
    });
    const { result } = renderHook(() => useChangeMyPassword(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        currentPassword: "Old123!a",
        newPassword: "New123!a",
        confirmation: "New123!a",
      });
    });

    expect(postApiV1AuthChangePassword).toHaveBeenCalledWith({
      body: {
        currentPassword: "Old123!a",
        newPassword: "New123!a",
        confirmation: "New123!a",
      },
    });
    expect(mocks.setStoredTokens).toHaveBeenCalledWith(tokens);
  });
});
