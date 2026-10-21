import { MemoryRouter, Route, Routes } from "react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { CompanyProfilePage } from "@/features/recruiter/company-profile/company-profile-page";
import { EditCompanyProfilePage } from "@/features/recruiter/company-profile/edit-company-profile-page";
import * as profQueries from "@/features/recruiter/company-profile/company-profile.queries";
import { ToastProvider } from "@/components/toast/toast-provider";

function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

const mockEnterprise = {
  id: "ent-001",
  name: "Acme Corporation",
  taxCode: "0102030405",
  email: "contact@acme.inc",
  phone: "+84 28 3822 1100",
  website: "https://acme.inc",
  logoUrl: "https://example.com/logo.png",
  coverUrl: "https://example.com/cover.png",
  companySize: "50-249",
  industry: "Software & Technology",
  description:
    "Building the next generation cloud productivity tools for global enterprises.",
  address: {
    street: "123 Tech Park Blvd",
    city: "Ho Chi Minh City",
    country: "Vietnam",
  },
  status: "active" as const,
  createdAt: "2025-01-10T08:00:00.000Z",
  updatedAt: "2026-02-15T10:00:00.000Z",
};

describe("Recruiter Company Profile Feature Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders company profile view page with complete details", () => {
    vi.spyOn(profQueries, "useMyEnterpriseProfileQuery").mockReturnValue({
      data: mockEnterprise,
      isLoading: false,
      isError: false,
    } as never);

    renderWithClient(
      <MemoryRouter>
        <CompanyProfilePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Acme Corporation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Software & Technology")).toBeInTheDocument();
    expect(screen.getByText(/50-249/i)).toBeInTheDocument();
    expect(screen.getByText("https://acme.inc")).toBeInTheDocument();
    expect(
      screen.getByText(/Building the next generation cloud productivity/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Premium health insurance")).toBeInTheDocument();
    expect(screen.getByText(/123 Tech Park Blvd/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Edit profile/i }),
    ).toBeInTheDocument();
  });

  it("opens change logo modal and submits logo url", async () => {
    vi.spyOn(profQueries, "useMyEnterpriseProfileQuery").mockReturnValue({
      data: mockEnterprise,
      isLoading: false,
      isError: false,
    } as never);

    const mutateAsync = vi.fn().mockResolvedValue({
      ...mockEnterprise,
      logoUrl: "https://example.com/new-logo.png",
    });

    vi.spyOn(
      profQueries,
      "useUpdateMyEnterpriseProfileMutation",
    ).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    renderWithClient(
      <MemoryRouter>
        <CompanyProfilePage />
      </MemoryRouter>,
    );

    const changeLogoBtn = screen.getByTitle("Change logo");
    fireEvent.click(changeLogoBtn);

    expect(
      screen.getByRole("heading", { name: "Change company logo" }),
    ).toBeInTheDocument();

    const urlInput = screen.getByPlaceholderText(
      "https://cdn.example.com/logo.png",
    );
    fireEvent.change(urlInput, {
      target: { value: "https://example.com/new-logo.png" },
    });

    const saveBtn = screen.getByRole("button", { name: /Save logo/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        logo_url: "https://example.com/new-logo.png",
      });
    });
  });

  it("renders edit company profile form with prefilled values and updates profile", async () => {
    vi.spyOn(profQueries, "useMyEnterpriseProfileQuery").mockReturnValue({
      data: mockEnterprise,
      isLoading: false,
      isError: false,
    } as never);

    const mutateAsync = vi.fn().mockResolvedValue({
      ...mockEnterprise,
      description: "Updated mission statement and enterprise objectives.",
    });

    vi.spyOn(
      profQueries,
      "useUpdateMyEnterpriseProfileMutation",
    ).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as never);

    renderWithClient(
      <MemoryRouter initialEntries={["/recruiter/profile/edit"]}>
        <Routes>
          <Route
            path="/recruiter/profile/edit"
            element={<EditCompanyProfilePage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Edit company profile" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Legal name, tax code, registration number/i),
    ).toBeInTheDocument();

    const descInput = screen.getByLabelText(/About description/i);
    fireEvent.change(descInput, {
      target: { value: "Updated mission statement and enterprise objectives." },
    });

    const submitBtn = screen.getByRole("button", { name: /Save changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Updated mission statement and enterprise objectives.",
        }),
      );
    });
  });
});
