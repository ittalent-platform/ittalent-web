import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PaginatedDocuments } from "@/api/generated/types.gen";
import { DocumentsPage } from "@/features/documents/documents-page";
import * as documentQueries from "@/features/documents/documents.queries";

vi.mock("@/features/documents/documents.queries", () => ({
  useDocuments: vi.fn(),
  useUploadDocument: vi.fn(),
}));

const showToast = vi.fn();
vi.mock("@/components/toast/toast-provider", () => ({
  useToast: () => ({ dismissToast: vi.fn(), showToast }),
}));

const documents: PaginatedDocuments = {
  items: [
    {
      createdAt: "2026-10-01T00:00:00.000Z",
      fileName: "backend-resume.pdf",
      fileUrl: "https://storage.example/backend-resume.pdf",
      id: "507f1f77bcf86cd799439011",
      mimeType: "application/pdf",
      ownerId: "507f1f77bcf86cd799439012",
      size: 128,
      type: "cv",
    },
    {
      createdAt: "2026-09-01T00:00:00.000Z",
      fileName: "frontend-resume.pdf",
      fileUrl: "https://storage.example/frontend-resume.pdf",
      id: "507f1f77bcf86cd799439013",
      mimeType: "application/pdf",
      ownerId: "507f1f77bcf86cd799439012",
      size: 256,
      type: "cv",
    },
  ],
  limit: 10,
  page: 1,
  total: 2,
  totalPages: 1,
};

function renderPage(initial = "/documents") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <DocumentsPage />
    </MemoryRouter>,
  );
}

describe("DocumentsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    showToast.mockClear();
    vi.mocked(documentQueries.useDocuments).mockReturnValue({
      data: documents,
      isError: false,
      isPending: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof documentQueries.useDocuments>);
    vi.mocked(documentQueries.useUploadDocument).mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof documentQueries.useUploadDocument>);
  });

  it("uses URL-backed search, type and sort order state", async () => {
    renderPage(
      "/documents?search=resume&type=cv&sort_order=asc",
    );

    await waitFor(() =>
      expect(documentQueries.useDocuments).toHaveBeenLastCalledWith({
        limit: 10,
        page: 1,
        sort_order: "asc",
        type: "cv",
      }),
    );
    expect(screen.getByText("backend-resume.pdf")).toBeInTheDocument();
  });

  it("opens the stored file URL for preview and download", () => {
    const open = vi.spyOn(window, "open").mockReturnValue({
      close: vi.fn(),
      location: { replace: vi.fn() },
      opener: null,
    } as unknown as Window);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Preview backend-resume.pdf" }),
    );
    expect(open).toHaveBeenCalledWith(
      "https://storage.example/backend-resume.pdf",
      "_blank",
      "noopener,noreferrer",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Download backend-resume.pdf" }),
    );
    expect(click).toHaveBeenCalled();
  });
});
