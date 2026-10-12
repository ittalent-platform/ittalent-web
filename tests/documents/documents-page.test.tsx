import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PaginatedDocuments } from "@/api/generated/types.gen";
import { DocumentsPage } from "@/features/documents/documents-page";
import * as documentQueries from "@/features/documents/documents.queries";

vi.mock("@/features/documents/documents.queries", () => ({
  downloadDocument: vi.fn(),
  previewDocument: vi.fn(),
  useDeleteDocument: vi.fn(),
  useDocuments: vi.fn(),
  useSetDefaultDocument: vi.fn(),
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
      isDefault: true,
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
      isDefault: false,
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

const deleteMutate = vi.fn();
const defaultMutate = vi.fn();

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
    deleteMutate.mockClear();
    defaultMutate.mockClear();
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
    vi.mocked(documentQueries.useDeleteDocument).mockReturnValue({
      isPending: false,
      mutate: deleteMutate,
    } as unknown as ReturnType<typeof documentQueries.useDeleteDocument>);
    vi.mocked(documentQueries.useSetDefaultDocument).mockReturnValue({
      isPending: false,
      mutate: defaultMutate,
    } as unknown as ReturnType<typeof documentQueries.useSetDefaultDocument>);
  });

  it("sends URL-backed search, type, default and sort filters to the backend", async () => {
    renderPage(
      "/documents?search=resume&type=cv&default=true&sort_by=file_name&sort_order=asc",
    );

    await waitFor(() =>
      expect(documentQueries.useDocuments).toHaveBeenLastCalledWith({
        is_default: "true",
        limit: 10,
        page: 1,
        search: "resume",
        sort_by: "file_name",
        sort_order: "asc",
        type: "cv",
      }),
    );
    expect(screen.getByText("backend-resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("sets a non-default document as the default", () => {
    renderPage();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Set frontend-resume.pdf as default",
      }),
    );
    expect(defaultMutate).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439013",
      expect.any(Object),
    );
  });

  it("requires confirmation before deleting an owned document", () => {
    renderPage();
    fireEvent.click(
      screen.getByRole("button", { name: "Delete frontend-resume.pdf" }),
    );
    expect(
      screen.getByRole("heading", { name: "Delete “frontend-resume.pdf”?" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete document" }));
    expect(deleteMutate).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439013",
      expect.any(Object),
    );
  });

  it("uses the authenticated preview and download endpoints instead of fileUrl", async () => {
    vi.mocked(documentQueries.downloadDocument).mockResolvedValue(
      new Blob(["pdf"], { type: "application/pdf" }),
    );
    vi.mocked(documentQueries.previewDocument).mockResolvedValue({
      previewUrl: "https://docs.google.com/gview?embedded=true",
    });
    const replace = vi.fn();
    vi.spyOn(window, "open").mockReturnValue({
      addEventListener: vi.fn(),
      close: vi.fn(),
      location: { replace },
      opener: null,
    } as unknown as Window);
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn().mockReturnValue("blob:download"),
        revokeObjectURL: vi.fn(),
      }),
    );
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Preview backend-resume.pdf" }),
    );
    await waitFor(() =>
      expect(documentQueries.previewDocument).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Download backend-resume.pdf" }),
    );
    await waitFor(() =>
      expect(documentQueries.downloadDocument).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
      ),
    );
  });
});
