import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/toast/toast-provider";
import { ProfilePage } from "@/features/profile/profile-page";

const fixture = {
  id: "my-user-id",
  email: "mine@example.test",
  username: "mine",
  fullName: "My Name",
  phone: "0901234567",
  avatarUrl: null,
  hasPassword: true,
  role: "user",
  status: "active",
  emailVerified: true,
  enterpriseId: null,
};

const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  update: vi.fn(),
  upload: vi.fn(),
  changePassword: vi.fn(),
}));

vi.mock("@/features/profile/profile.queries", () => ({
  useMyProfile: () => mocks.profile(),
  useUpdateMyProfile: () => mocks.update(),
  useUploadMyAvatar: () => mocks.upload(),
  useChangeMyPassword: () => mocks.changePassword(),
}));

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/profile"]}>
        <ToastProvider>
          <Routes>
            <Route element={<ProfilePage />} path="/profile" />
            <Route element={<ProfilePage />} path="/profile/password" />
            <Route element={<p>Sign in page</p>} path="/login" />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profile.mockReturnValue({
      data: fixture,
      isPending: false,
      isError: false,
    });
    mocks.update.mockReturnValue({
      isPending: false,
      mutateAsync: vi
        .fn()
        .mockResolvedValue({ ...fixture, fullName: "New Name" }),
    });
    mocks.upload.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({
        ...fixture,
        avatarUrl: "https://example.test/avatar.png",
      }),
    });
    mocks.changePassword.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
    });
  });

  it("renders the signed-in profile and saves only editable fields", async () => {
    const user = userEvent.setup();
    renderProfile();
    expect(screen.getAllByText("mine@example.test")).not.toHaveLength(0);
    expect(screen.getByText("Active")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    expect(screen.getByDisplayValue("My Name")).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/Full name/));
    await user.type(screen.getByLabelText(/Full name/), "New Name");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.update().mutateAsync).toHaveBeenCalledWith({
        expectedVersion: undefined,
        fullName: "New Name",
        phone: "0901234567",
      }),
    );
  });

  it("rejects an invalid image before upload", async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change profile photo" }));
    const file = new File(["invalid"], "avatar.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [file] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a JPEG, PNG, or WebP image.",
    );
    expect(mocks.upload().mutateAsync).not.toHaveBeenCalled();
  });

  it("explains when an avatar file is empty", async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change profile photo" }));
    const file = new File([], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [file] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This file is empty. Choose another image.",
    );
    expect(mocks.upload().mutateAsync).not.toHaveBeenCalled();
  });

  it("previews and uploads a valid avatar", async () => {
    const user = userEvent.setup();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn().mockReturnValue("blob:preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change profile photo" }));
    const file = new File(["png"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [file] },
    });
    expect(
      screen.getByRole("button", { name: "Save photo" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save photo" }));
    await waitFor(() =>
      expect(mocks.upload().mutateAsync).toHaveBeenCalledWith(file),
    );
  });

  it("keeps the current session signed in after a successful password change", async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change password" }));
    fireEvent.change(screen.getByLabelText(/Current password/), {
      target: { value: "Old123!a" },
    });
    fireEvent.change(screen.getByLabelText(/New password/), {
      target: { value: "New123!a" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm new password/), {
      target: { value: "New123!a" },
    });
    await user.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() =>
      expect(mocks.changePassword().mutateAsync).toHaveBeenCalledWith({
        currentPassword: "Old123!a",
        newPassword: "New123!a",
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument(),
    );
    expect(screen.queryByText("Sign in page")).not.toBeInTheDocument();
    expect(
      await screen.findAllByText("Password changed successfully."),
    ).not.toHaveLength(0);
  });

  it("shows a confirmation mismatch only after submitting the password form", async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change password" }));
    await user.type(screen.getByLabelText(/Current password/), "Old123!a");
    await user.type(screen.getByLabelText(/New password/), "New123!a");
    await user.type(
      screen.getByLabelText(/Confirm new password/),
      "Different123!",
    );

    expect(screen.queryByText("Passwords do not match.")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(mocks.changePassword().mutateAsync).not.toHaveBeenCalled();
  });

  it("explains passwordless accounts", async () => {
    const user = userEvent.setup();
    mocks.profile.mockReturnValue({
      data: { ...fixture, hasPassword: false },
      isPending: false,
      isError: false,
    });
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(screen.getByText(/no local password/)).toBeInTheDocument();
  });

  it("shows the server error for an incorrect current password", async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockReturnValue({
      isPending: false,
      mutateAsync: vi
        .fn()
        .mockRejectedValue(new Error("Incorrect current password.")),
    });
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change password" }));
    fireEvent.change(screen.getByLabelText(/Current password/), {
      target: { value: "Wrong123!" },
    });
    fireEvent.change(screen.getByLabelText(/New password/), {
      target: { value: "New123!a" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm new password/), {
      target: { value: "New123!a" },
    });
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText(/That password isn't right/)).toBeInTheDocument();
    expect(screen.getByLabelText(/New password/)).toHaveValue("New123!a");
  });

  it("asks before discarding dirty profile changes", async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Edit profile" }));
    await user.clear(screen.getByLabelText(/Full name/));
    await user.type(screen.getByLabelText(/Full name/), "Changed name");
    expect(screen.getByText("1 unsaved change")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading", { name: "Discard your changes?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByDisplayValue("Changed name")).toBeInTheDocument();
  });

  it("uses the recruiter-specific heading copy", () => {
    mocks.profile.mockReturnValue({
      data: { ...fixture, role: "recruiter", enterpriseName: "Northstar Labs" },
      isPending: false,
      isError: false,
    });
    renderProfile();
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("HR · Northstar Labs")).toBeInTheDocument();
    expect(screen.queryByText(/companies you apply to/)).not.toBeInTheDocument();
  });
});
