import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { deleteApiV1InterviewsById } from "@/api/generated";
import { interviewKeys, useDeleteInterview } from "@/features/recruiter/interviews/interviews.queries";

vi.mock("@/api/generated", () => ({ deleteApiV1InterviewsById: vi.fn() }));

const LIST_KEY = interviewKeys.list({});
const DELETED_KEY = interviewKeys.detail("i1");
const OTHER_KEY = interviewKeys.detail("i2");

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const key of [LIST_KEY, DELETED_KEY, OTHER_KEY]) client.setQueryData(key, { fresh: true });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { result } = renderHook(() => useDeleteInterview(), { wrapper });
  const stateOf = (key: readonly unknown[]) => client.getQueryState(key)?.isInvalidated;
  return { result, stateOf };
}

describe("Deleting an interview (useDeleteInterview)", () => {
  beforeEach(() => {
    vi.mocked(deleteApiV1InterviewsById).mockReset();
  });

  it("asks the API to delete that interview", async () => {
    vi.mocked(deleteApiV1InterviewsById).mockResolvedValue({ data: undefined, response: { ok: true, status: 204 } } as never);
    const { result } = setup();
    await act(() => result.current.mutateAsync("i1"));
    expect(deleteApiV1InterviewsById).toHaveBeenCalledWith({ path: { id: "i1" } });
  });

  it("refreshes the lists and the other details after a delete, but leaves the page of the deleted interview alone", async () => {
    vi.mocked(deleteApiV1InterviewsById).mockResolvedValue({ data: undefined, response: { ok: true, status: 204 } } as never);
    const { result, stateOf } = setup();
    await act(() => result.current.mutateAsync("i1"));

    await waitFor(() => expect(stateOf(LIST_KEY)).toBe(true));
    expect(stateOf(OTHER_KEY)).toBe(true);
    expect(stateOf(DELETED_KEY)).toBe(false);
  });

  it("fails with the status and code of the refusal, and refreshes everything since the interview is not what the screen showed", async () => {
    vi.mocked(deleteApiV1InterviewsById).mockResolvedValue({ error: { code: "INTERVIEW_COMPLETED", message: "A completed interview cannot be deleted" }, response: { ok: false, status: 409 } } as never);
    const { result, stateOf } = setup();
    await act(async () => {
      await expect(result.current.mutateAsync("i1")).rejects.toMatchObject({ code: "INTERVIEW_COMPLETED", status: 409 });
    });

    await waitFor(() => expect(stateOf(DELETED_KEY)).toBe(true));
    expect(stateOf(LIST_KEY)).toBe(true);
  });

  it("treats a refusal without a readable body as a failure too", async () => {
    vi.mocked(deleteApiV1InterviewsById).mockResolvedValue({ error: "", response: { ok: false, status: 502 } } as never);
    const { result } = setup();
    await act(async () => {
      await expect(result.current.mutateAsync("i1")).rejects.toMatchObject({ status: 502 });
    });
  });
});
