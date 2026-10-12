import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "@/api/generated";
import type { CertificateLink } from "@/api/generated/types.gen";
import { ToastProvider } from "@/components/toast/toast-provider";
import { validateCertificate } from "@/features/certificates/certificate-form-dialog";
import { CertificatesPage } from "@/features/certificates/certificates-page";

vi.mock("@/api/generated", () => ({
  deleteApiV1MeCertificateLinksById: vi.fn(),
  getApiV1MeCertificateLinks: vi.fn(),
  patchApiV1MeCertificateLinksById: vi.fn(),
  postApiV1MeCertificateLinks: vi.fn(),
}));

const certificate = (over: Partial<CertificateLink>): CertificateLink => ({
  id: "c1", name: "AWS Architect", url: "https://www.credly.com/badges/1", issuer: "Amazon Web Services", issuedDate: "2025-03-12", expiryDate: "2028-03-12",
  version: 2, status: "available", suggested: true, sentCount: 2, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-03T00:00:00.000Z", ...over,
});
const page = (items: CertificateLink[]) => ({ data: { items, page: 1, limit: 10, total: items.length, totalPages: items.length ? 1 : 0, suggestedTotal: items.filter((item) => item.suggested).length }, response: { ok: true, status: 200 } });

function renderPage(path = "/certificates") {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider><MemoryRouter initialEntries={[path]}><CertificatesPage /></MemoryRouter></ToastProvider>
    </QueryClientProvider>,
  );
}

describe("Certificates page (UC-S4-CERT-01..05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getApiV1MeCertificateLinks).mockResolvedValue(page([
      certificate({}),
      certificate({ id: "c2", name: "IELTS 7.5", url: "http://ielts.britishcouncil.org/1", issuer: null, issuedDate: "2023-01-14", expiryDate: "2025-01-14", version: 3, suggested: false, sentCount: 0 }),
    ]) as never);
  });

  it("lists certificates with host, dates, version, suggested count and the read-only link warnings", async () => {
    renderPage();
    expect(await screen.findByText("AWS Architect")).toBeInTheDocument();
    expect(screen.getByText("credly.com")).toBeInTheDocument();
    expect(screen.getByText("Issued 12 Mar 2025")).toBeInTheDocument();
    expect(screen.getByText("Version 2")).toBeInTheDocument();
    expect(screen.getByText("Not HTTPS")).toBeInTheDocument();
    expect(screen.getByText("Expired 14 Jan 2025")).toBeInTheDocument();
    expect(screen.getByText("No issuer")).toBeInTheDocument();
    expect(screen.getByText(/are suggested when you apply|is suggested when you apply/).textContent).toContain("1 certificate");
  });

  it("turns Suggest on apply on with the loaded version", async () => {
    vi.mocked(api.patchApiV1MeCertificateLinksById).mockResolvedValue({ data: certificate({ id: "c2", suggested: true }), response: { ok: true, status: 200 } } as never);
    renderPage();
    fireEvent.click(await screen.findByRole("switch", { name: "Suggest IELTS 7.5 when I apply" }));
    await waitFor(() => expect(api.patchApiV1MeCertificateLinksById).toHaveBeenCalledWith({ body: { expectedVersion: 3, suggested: true }, path: { id: "c2" } }));
    expect(await screen.findByText("Will be suggested when you apply.")).toBeInTheDocument();
  });

  it("asks to load the latest version when the certificate changed elsewhere", async () => {
    vi.mocked(api.patchApiV1MeCertificateLinksById).mockResolvedValue({ error: { message: "changed", code: "VERSION_CONFLICT" }, response: { ok: false, status: 409 } } as never);
    renderPage();
    fireEvent.click(await screen.findByRole("switch", { name: "Suggest AWS Architect when I apply" }));
    expect(await screen.findByRole("alertdialog", { name: "This certificate changed somewhere else" })).toBeInTheDocument();
  });

  it("deletes with the version and says sent applications keep their copy", async () => {
    vi.mocked(api.deleteApiV1MeCertificateLinksById).mockResolvedValue({ data: undefined, response: { ok: true, status: 204 } } as never);
    renderPage();
    fireEvent.pointerDown(await screen.findByRole("button", { name: "Actions for AWS Architect" }), { button: 0, ctrlKey: false });
    fireEvent.click(await screen.findByRole("menuitem", { name: /Delete/ }));
    const dialog = await screen.findByRole("alertdialog", { name: "Delete this certificate?" });
    expect(within(dialog).getByText(/The 2 applications you already sent keep their copy/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(api.deleteApiV1MeCertificateLinksById).toHaveBeenCalledWith({ path: { id: "c1" }, query: { expectedVersion: 2 } }));
  });

  it("shows the empty state", async () => {
    vi.mocked(api.getApiV1MeCertificateLinks).mockResolvedValue(page([]) as never);
    renderPage();
    expect(await screen.findByText("No certificates yet")).toBeInTheDocument();
  });

  it("validates name, a web link only and the date order before sending", () => {
    const base = { expiryDate: "", issuedDate: "", issuer: "", name: "Cert", suggested: false, url: "https://cert.example/1" };
    expect(validateCertificate(base)).toEqual({});
    expect(validateCertificate({ ...base, name: " " })).toHaveProperty("name");
    expect(validateCertificate({ ...base, url: "javascript:alert(1)" })).toHaveProperty("url");
    expect(validateCertificate({ ...base, url: "ftp://files.example.com/cert.pdf" })).toHaveProperty("url");
    expect(validateCertificate({ ...base, issuedDate: "2026-09-02", expiryDate: "2026-09-01" })).toHaveProperty("expiryDate");
  });
});
