import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { getApiV1JobPostingsByIdHistory } from "@/api/generated";
import { useJobPostingHistory } from "@/features/job-postings/job-postings.queries";

vi.mock("@/api/generated", async (original) => ({
  ...(await original<object>()),
  getApiV1JobPostingsByIdHistory: vi.fn(),
}));

const event = (id: string, action: string, occurredAt: string) => ({ action, actorUserId: "u", id, occurredAt });
const pages: Record<number, ReturnType<typeof event>[]> = {
  1: [event("a", "update", "2026-03-01T00:00:00.000Z")],
  2: [event("b", "publish", "2026-02-01T00:00:00.000Z")],
  3: [event("c", "create", "2026-01-01T00:00:00.000Z")],
};

describe("useJobPostingHistory withFirstPublish", () => {
  it("walks back from the oldest page until it finds the first publish event", async () => {
    vi.mocked(getApiV1JobPostingsByIdHistory).mockImplementation((async ({ query }: { query: { page: number } }) => ({
      data: { items: pages[query.page], limit: 1, page: query.page, total: 3, totalPages: 3 },
    })) as never);
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useJobPostingHistory("job-1", { withFirstPublish: true }), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.firstPublishedAt).toBe("2026-02-01T00:00:00.000Z");
  });
});
