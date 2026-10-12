import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "@/api/generated";
import type { CertificateLink } from "@/api/generated/types.gen";
import { ApplyButton } from "@/features/public-site/career/apply-button";

vi.mock("@/api/generated", () => ({
  getApiV1Documents: vi.fn(),
  getApiV1MeCertificateLinks: vi.fn(),
  postApiV1Documents: vi.fn(),
  postApiV1MeApplications: vi.fn(),
}));

const certificate = (id: string, name: string, suggested: boolean): CertificateLink => ({
  id, name, suggested, url: `https://cert.example/${id}`, issuer: "Example Institute", issuedDate: null, expiryDate: null,
  version: 1, status: "available", sentCount: 0, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z",
});
const page = (items: CertificateLink[]) => ({ data: { items, page: 1, limit: 100, total: items.length, totalPages: 1, suggestedTotal: items.filter((item) => item.suggested).length } });

function renderDialog() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter><ApplyButton jobId="507f1f77bcf86cd799439012" jobTitle="Backend Engineer" /></MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Apply now" }));
}

const lastBody = () => vi.mocked(api.postApiV1MeApplications).mock.calls.at(-1)?.[0].body;

describe("Apply dialog certificates (BR-S4-LINK-003)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getApiV1Documents).mockImplementation((async (options: { query: { type: string } }) => ({
      data: { items: options.query.type === "cv" ? [{ id: "cv1", type: "cv", fileName: "Nguyen_CV.pdf" }] : [], page: 1, limit: 100, total: 1, totalPages: 1 },
    })) as never);
    vi.mocked(api.getApiV1MeCertificateLinks).mockResolvedValue(page([certificate("c1", "AWS Architect", true), certificate("c2", "IELTS 7.5", false)]) as never);
    vi.mocked(api.postApiV1MeApplications).mockResolvedValue({ data: { id: "a1" } } as never);
  });

  it("pre-ticks suggested certificates and sends what stays ticked", async () => {
    renderDialog();
    const aws = await screen.findByRole("checkbox", { name: /AWS Architect/ });
    expect(aws).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /IELTS 7.5/ })).not.toBeChecked();
    expect(screen.getByText("1 ticked from your suggestions. Untick any, or send none.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open AWS Architect in a new tab" })).toHaveAttribute("rel", "noopener noreferrer");

    fireEvent.click(await screen.findByRole("radio", { name: /Nguyen_CV.pdf/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /IELTS 7.5/ }));
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await waitFor(() => expect(lastBody()).toMatchObject({ cvId: "cv1", certificateLinkIds: ["c1", "c2"] }));
  });

  it("sends no certificates once every tick is removed", async () => {
    renderDialog();
    fireEvent.click(await screen.findByRole("checkbox", { name: /AWS Architect/ }));
    fireEvent.click(await screen.findByRole("radio", { name: /Nguyen_CV.pdf/ }));
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    await waitFor(() => expect(api.postApiV1MeApplications).toHaveBeenCalled());
    expect(lastBody()).not.toHaveProperty("certificateLinkIds");
  });

  it("hides the section when the candidate has no certificates", async () => {
    vi.mocked(api.getApiV1MeCertificateLinks).mockResolvedValue(page([]) as never);
    renderDialog();
    await screen.findByRole("radio", { name: /Nguyen_CV.pdf/ });
    await waitFor(() => expect(api.getApiV1MeCertificateLinks).toHaveBeenCalled());
    expect(screen.queryByRole("group", { name: /Certificates/ })).not.toBeInTheDocument();
  });

  it("explains a certificate that changed meanwhile and reloads the list", async () => {
    vi.mocked(api.postApiV1MeApplications).mockResolvedValue({ error: { code: "CERTIFICATE_UNAVAILABLE" }, response: { status: 409 } } as never);
    renderDialog();
    await screen.findByRole("checkbox", { name: /AWS Architect/ });
    fireEvent.click(await screen.findByRole("radio", { name: /Nguyen_CV.pdf/ }));
    fireEvent.click(screen.getByRole("button", { name: "Submit application" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("A certificate you ticked was changed or deleted. Check the list and send again.");
    await waitFor(() => expect(api.getApiV1MeCertificateLinks).toHaveBeenCalledTimes(2));
  });
});
