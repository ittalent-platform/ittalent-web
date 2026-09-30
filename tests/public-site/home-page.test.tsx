import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomePage } from "@/features/public-site/home/home-page";
import type {
  HomeData,
  HomeJob,
} from "@/features/public-site/home/home.queries";
import * as homeQueries from "@/features/public-site/home/home.queries";

vi.mock("@/features/public-site/home/home.queries", () => ({
  useHomeData: vi.fn(),
  useFieldCount: vi.fn(),
}));

const job: HomeJob = {
  id: "job-1",
  enterpriseId: "ent-1",
  postedByUserId: "user-1",
  title: "Senior Backend Engineer",
  slug: "senior-backend-engineer",
  location: "Ha Noi",
  employmentType: "Full-time",
  salaryMin: 45_000_000,
  salaryMax: 60_000_000,
  currency: "VND",
  status: "published",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  companyName: "Nimbus Pay",
};

const data: HomeData = {
  totalJobs: 12,
  newThisWeek: 4,
  hiringCompanies: 3,
  cities: ["Ha Noi", "Da Nang"],
  latestJobs: [job],
  topCompanies: [
    {
      id: "ent-1",
      name: "Nimbus Pay",
      industry: "Fintech",
      location: "Ha Noi",
      shortDescription: "Payment infrastructure.",
      companySize: "100-200",
      openJobs: 1,
    },
  ],
};

function mockHome(result: Partial<ReturnType<typeof homeQueries.useHomeData>>) {
  vi.mocked(homeQueries.useHomeData).mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...result,
  } as ReturnType<typeof homeQueries.useHomeData>);
}

function Where() {
  const { pathname, search } = useLocation();
  return <p data-testid="where">{pathname + search}</p>;
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<Where />} path="/career" />
      </Routes>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(homeQueries.useFieldCount).mockReturnValue({
      data: 7,
    } as ReturnType<typeof homeQueries.useFieldCount>);
    mockHome({ data });
  });

  it("shows marketplace stats, latest jobs and top companies from the API", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /where it careers\s*take shape/i,
      }),
    ).toBeInTheDocument();
    const stats = screen.getByRole("region", {
      name: /marketplace at a glance/i,
    });
    expect(within(stats).getByText("12")).toBeInTheDocument();
    expect(
      within(stats).getByText(/companies hiring now/i),
    ).toBeInTheDocument();

    const latest = screen
      .getByRole("heading", { name: /open roles, newest first/i })
      .closest("section")!;
    expect(
      within(latest).getByRole("link", { name: "Senior Backend Engineer" }),
    ).toHaveAttribute("href", "/career/senior-backend-engineer");
    expect(
      within(latest).getByRole("link", { name: "Nimbus Pay" }),
    ).toHaveAttribute("href", "/enterprises/ent-1");
    expect(within(latest).getByText("45–60M VND / mo")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /meet the teams behind the jobs/i }),
    ).toBeInTheDocument();
  });

  it("sends the keyword and city to the Jobs page", async () => {
    renderHome();

    fireEvent.change(screen.getByRole("textbox", { name: /keyword/i }), {
      target: { value: "React" },
    });
    await userEvent.click(screen.getByRole("combobox", { name: /city/i }));
    await userEvent.click(await screen.findByRole("option", { name: "Da Nang" }));
    fireEvent.click(screen.getByRole("button", { name: "Search jobs" }));

    expect(screen.getByTestId("where")).toHaveTextContent(
      "/career?search=React&location=Da+Nang",
    );
  });

  it("blocks unsafe search keywords", () => {
    renderHome();

    fireEvent.change(screen.getByRole("textbox", { name: /keyword/i }), {
      target: { value: "<script>" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/invalid characters/i);
    expect(screen.getByRole("button", { name: "Search jobs" })).toBeDisabled();
  });

  it("explains a failed load and omits the companies section when there are none", () => {
    mockHome({ isError: true });
    renderHome();

    expect(screen.getByRole("alert")).toHaveTextContent(
      /couldn't load the latest jobs/i,
    );
    expect(
      screen.queryByRole("heading", {
        name: /meet the teams behind the jobs/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("says so when no roles are open", () => {
    mockHome({ data: { ...data, latestJobs: [], topCompanies: [] } });
    renderHome();

    expect(screen.getByText(/no open roles right now/i)).toBeInTheDocument();
  });
});
