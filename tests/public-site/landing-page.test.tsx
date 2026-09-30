import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LandingPage } from "@/features/public-site/landing-page";

vi.mock("@/features/public-site/career/career.api", () => ({
  fetchJobs: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    filters: { locations: [], enterprises: [] },
  }),
}));

vi.mock("@/features/public-site/enterprise/enterprise.api", () => ({
  fetchEnterpriseDirectory: vi.fn().mockResolvedValue([]),
}));

describe("LandingPage", () => {
  it("renders hero heading and job search button", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]}>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /where it careers/i,
    );
    expect(screen.getByRole("button", { name: /search jobs/i })).toBeInTheDocument();
  });
});
