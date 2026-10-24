import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as savedJobsApi from "@/features/applicant/saved-jobs/saved-jobs.api";
import { savedJobKeys } from "@/features/applicant/saved-jobs/saved-jobs.constants";
import {
  useCheckSavedJobQuery,
  useClearUnavailableMutation,
  useRemoveSavedJobMutation,
  useSaveJobMutation,
  useSavedJobsQuery,
  useToggleSaveJobMutation,
} from "@/features/applicant/saved-jobs/saved-jobs.queries";
import type { SavedJobsListResponse } from "@/features/applicant/saved-jobs/saved-jobs.types";

vi.mock("@/features/applicant/saved-jobs/saved-jobs.api", () => ({
  checkJobSaved: vi.fn(),
  clearUnavailableSavedJobs: vi.fn(),
  getSavedJobs: vi.fn(),
  removeSavedJob: vi.fn(),
  removeSavedJobById: vi.fn(),
  saveJob: vi.fn(),
  toggleSaveJob: vi.fn(),
}));

function createTestClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("saved-jobs queries and key factories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds consistent query keys", () => {
    expect(savedJobKeys.all).toEqual(["saved-jobs"]);
    expect(savedJobKeys.lists()).toEqual(["saved-jobs", "list"]);
    expect(savedJobKeys.list({ status: "available" })).toEqual([
      "saved-jobs",
      "list",
      { status: "available" },
    ]);
    expect(savedJobKeys.check("job-123")).toEqual(["saved-jobs", "check", "job-123"]);
  });

  it("fetches saved jobs list through useSavedJobsQuery with items shape", async () => {
    const mockList: SavedJobsListResponse = {
      items: [
        {
          id: "wl-1",
          jobId: "j-1",
          savedAt: "2026-10-23T10:00:00.000Z",
          availability: "available",
          title: "Frontend Developer",
          slug: "frontend-developer",
          enterprise: { id: "ent-1", name: "Lumen Labs" },
          location: "Ho Chi Minh City",
          employmentType: "Full-time",
          level: "Mid",
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
      limit: 20,
    };

    vi.mocked(savedJobsApi.getSavedJobs).mockResolvedValue(mockList);

    const client = createTestClient();
    const { result } = renderHook(() => useSavedJobsQuery({ status: "available" }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockList);
    expect(result.current.data?.items).toHaveLength(1);
    expect(savedJobsApi.getSavedJobs).toHaveBeenCalledWith({ status: "available" });
  });

  it("checks saved job status through useCheckSavedJobQuery", async () => {
    vi.mocked(savedJobsApi.checkJobSaved).mockResolvedValue({
      isSaved: true,
      wishlistId: "wl-1",
    });

    const client = createTestClient();
    const { result } = renderHook(() => useCheckSavedJobQuery("j-1"), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.isSaved).toBe(true);
    expect(result.current.data?.wishlistId).toBe("wl-1");
  });

  it("saves job and updates check cache directly via useSaveJobMutation", async () => {
    vi.mocked(savedJobsApi.saveJob).mockResolvedValue({
      saved: true,
      message: "Job added to wishlist successfully",
      id: "wl-1",
    });

    const client = createTestClient();
    const { result } = renderHook(() => useSaveJobMutation(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate("j-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(savedJobsApi.saveJob).toHaveBeenCalledWith("j-1");
    expect(client.getQueryData(savedJobKeys.check("j-1"))).toEqual({
      isSaved: true,
      wishlistId: "wl-1",
    });
  });

  it("removes a saved job and updates check cache via useRemoveSavedJobMutation", async () => {
    vi.mocked(savedJobsApi.removeSavedJob).mockResolvedValue({
      removed: true,
      message: "Job removed from wishlist",
    });

    const client = createTestClient();
    client.setQueryData(savedJobKeys.check("j-1"), { isSaved: true, wishlistId: "wl-1" });

    const { result } = renderHook(() => useRemoveSavedJobMutation(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate("j-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(savedJobsApi.removeSavedJob).toHaveBeenCalledWith("j-1");
    expect(client.getQueryData(savedJobKeys.check("j-1"))).toEqual({
      isSaved: false,
      wishlistId: null,
    });
  });

  it("toggles saved job status via useToggleSaveJobMutation", async () => {
    vi.mocked(savedJobsApi.toggleSaveJob).mockResolvedValue({
      saved: true,
      message: "Job added to wishlist successfully",
      id: "wl-1",
    });

    const client = createTestClient();
    const { result } = renderHook(() => useToggleSaveJobMutation(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate("j-1");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(savedJobsApi.toggleSaveJob).toHaveBeenCalledWith("j-1");
    expect(client.getQueryData(savedJobKeys.check("j-1"))).toEqual({
      isSaved: true,
      wishlistId: "wl-1",
    });
  });

  it("clears unavailable saved jobs via useClearUnavailableMutation", async () => {
    vi.mocked(savedJobsApi.clearUnavailableSavedJobs).mockResolvedValue({
      removedCount: 3,
      message: "Unavailable saved jobs cleared successfully",
    });

    const client = createTestClient();
    const { result } = renderHook(() => useClearUnavailableMutation(), {
      wrapper: createWrapper(client),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(savedJobsApi.clearUnavailableSavedJobs).toHaveBeenCalled();
  });
});
