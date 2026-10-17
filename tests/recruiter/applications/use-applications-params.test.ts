import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { useApplicationsParams } from "@/features/recruiter/applications/use-applications-params";

function createWrapper(initialUrl = "/recruiter/applications") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(MemoryRouter, { initialEntries: [initialUrl] }, children);
  };
}

describe("useApplicationsParams", () => {
  it("initializes with default query parameters", () => {
    const { result } = renderHook(() => useApplicationsParams(), {
      wrapper: createWrapper(),
    });

    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(10);
    expect(result.current.search).toBe("");
    expect(result.current.statuses).toEqual([]);
    expect(result.current.jobId).toBeUndefined();
    expect(result.current.documentType).toBeUndefined();
    expect(result.current.range).toBe("any");
    expect(result.current.sortBy).toBe("submittedAt");
    expect(result.current.sortOrder).toBe("desc");
    expect(result.current.view).toBe("table");
    expect(result.current.hasFilters).toBe(false);
    expect(result.current.errors).toEqual({});
  });

  it("parses valid search, status, job, and range from URL query parameters", () => {
    const { result } = renderHook(() => useApplicationsParams(), {
      wrapper: createWrapper(
        "/recruiter/applications?search=Frontend&status=submitted,under_review&jobId=507f1f77bcf86cd799439011&range=7d&sortBy=id&sortOrder=asc&view=board",
      ),
    });

    expect(result.current.search).toBe("Frontend");
    expect(result.current.statuses).toEqual(["submitted", "under_review"]);
    expect(result.current.jobId).toBe("507f1f77bcf86cd799439011");
    expect(result.current.range).toBe("7d");
    expect(result.current.sortBy).toBe("id");
    expect(result.current.sortOrder).toBe("asc");
    expect(result.current.view).toBe("board");
    expect(result.current.hasFilters).toBe(true);
  });

  it("flags contradictory date range when from > to", () => {
    const { result } = renderHook(() => useApplicationsParams(), {
      wrapper: createWrapper(
        "/recruiter/applications?range=custom&from=2026-10-20&to=2026-10-10",
      ),
    });

    expect(result.current.errors.range).toBe("rangeContradictory");
  });

  it("flags keyword length exceeding MAX_SEARCH_LENGTH", () => {
    const longKeyword = "a".repeat(101);
    const { result } = renderHook(() => useApplicationsParams(), {
      wrapper: createWrapper(`/recruiter/applications?search=${longKeyword}`),
    });

    expect(result.current.errors.keyword).toBe("keywordTooLong");
  });

  it("updates parameters using set and clearFilters", () => {
    const { result } = renderHook(() => useApplicationsParams(), {
      wrapper: createWrapper("/recruiter/applications?search=DevOps&status=submitted"),
    });

    expect(result.current.hasFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    // clearFilters removes filter parameters
    expect(result.current.search).toBe("");
  });
});
