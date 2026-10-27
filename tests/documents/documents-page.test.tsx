import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PaginatedDocuments } from "@/api/generated/types.gen";
import { DocumentsPage } from "@/features/documents/documents-page";
import * as documentQueries from "@/features/documents/documents.queries";
import { formatDocumentFileSize } from "@/lib/document-files";

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
      <LocationDisplay />
    </MemoryRouter>,
  );
}

function LocationDisplay() {
  const location = useLocation();
  return <output aria-label="Current URL">{location.pathname}{location.search}</output>;
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

  it("sends the header search and document-type filter to the backend", async () => {
    renderPage("/documents?search=resume&type=cv");

    await waitFor(() =>
      expect(documentQueries.useDocuments).toHaveBeenLastCalledWith({
        limit: 10,
        page: 1,
        search: "resume",
        sort_by: "created_at",
        sort_order: "desc",
        type: "cv",
      }),
    );
    expect(screen.getByText("backend-resume.pdf")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("formats document sizes from bytes through megabytes", () => {
    expect(formatDocumentFileSize(0)).toBe("0 B");
    expect(formatDocumentFileSize(128)).toBe("128 B");
    expect(formatDocumentFileSize(1280)).toBe("1.3 KB");
    expect(formatDocumentFileSize(3.5 * 1024 * 1024)).toBe("3.5 MB");
  });

  it("shows formatted file sizes in the table", () => {
    renderPage();

    expect(screen.getByRole("columnheader", { name: "Size" })).toBeInTheDocument();
    expect(screen.getByText("128 B")).toBeInTheDocument();
    expect(screen.getByText("256 B")).toBeInTheDocument();
  });

  it("uses valid sort values from the URL", async () => {
    renderPage("/documents?sort_by=file_name&sort_order=asc");

    await waitFor(() =>
      expect(documentQueries.useDocuments).toHaveBeenLastCalledWith({
        limit: 10,
        page: 1,
        sort_by: "file_name",
        sort_order: "asc",
      }),
    );
  });

  it("updates sort in the URL and resets pagination", async () => {
    renderPage("/documents?page=2&limit=20&search=resume&type=cv&sort_order=asc");

    fireEvent.click(screen.getByRole("combobox", { name: "Sort documents" }));
    fireEvent.click(screen.getByRole("option", { name: "File name" }));

    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Current URL" })).toHaveTextContent(
        "/documents?page=1&limit=20&search=resume&type=cv&sort_order=asc&sort_by=file_name",
      ),
    );
    fireEvent.click(screen.getByRole("combobox", { name: "Sort order" }));
    fireEvent.click(screen.getByRole("option", { name: "Descending" }));

    await waitFor(() =>
      expect(screen.getByRole("status", { name: "Current URL" })).toHaveTextContent(
        "/documents?page=1&limit=20&search=resume&type=cv&sort_order=desc&sort_by=file_name",
      ),
    );
    expect(documentQueries.useDocuments).toHaveBeenLastCalledWith({
      limit: 20,
      page: 1,
      search: "resume",
      sort_by: "file_name",
      sort_order: "desc",
      type: "cv",
    });
  });

  it("falls back to the default sort for invalid URL values", async () => {
    renderPage("/documents?sort_by=owner&sort_order=sideways");

    await waitFor(() =>
      expect(documentQueries.useDocuments).toHaveBeenLastCalledWith({
        limit: 10,
        page: 1,
        sort_by: "created_at",
        sort_order: "desc",
      }),
    );
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
