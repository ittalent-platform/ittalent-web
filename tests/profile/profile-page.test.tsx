import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
      mutateAsync: vi
        .fn()
        .mockResolvedValue({
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
    render(<ProfilePage />);
    expect(screen.getByDisplayValue("mine@example.test")).toHaveAttribute(
      "readonly",
    );
    expect(screen.getByDisplayValue("My Name")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Full name"));
    await user.type(screen.getByLabelText("Full name"), "New Name");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.update().mutateAsync).toHaveBeenCalledWith({
        fullName: "New Name",
        phone: "0901234567",
      }),
    );
  });

  it("rejects an invalid image before upload", async () => {
    render(<ProfilePage />);
    const file = new File(["invalid"], "avatar.txt", { type: "text/plain" });
    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [file] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a JPEG, PNG, or WebP image.",
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
    render(<ProfilePage />);
    const file = new File(["png"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [file] },
    });
    expect(
      screen.getByRole("button", { name: "Upload avatar" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upload avatar" }));
    await waitFor(() =>
      expect(mocks.upload().mutateAsync).toHaveBeenCalledWith(file),
    );
  });

  it("shows the password form and clears it after a successful change", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);
    await user.click(screen.getByRole("tab", { name: "Password" }));
    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "Old123!a" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "New123!a" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "New123!a" },
    });
    await user.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() =>
      expect(mocks.changePassword().mutateAsync).toHaveBeenCalledWith({
        currentPassword: "Old123!a",
        newPassword: "New123!a",
      }),
    );
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Password changed successfully.",
    );
  });

  it("explains passwordless accounts", async () => {
    const user = userEvent.setup();
    mocks.profile.mockReturnValue({
      data: { ...fixture, hasPassword: false },
      isPending: false,
      isError: false,
    });
    render(<ProfilePage />);
    await user.click(screen.getByRole("tab", { name: "Password" }));
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
    render(<ProfilePage />);
    await user.click(screen.getByRole("tab", { name: "Password" }));
    fireEvent.change(screen.getByLabelText("Current password"), {
      target: { value: "Wrong123!" },
    });
    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "New123!a" },
    });
    fireEvent.change(screen.getByLabelText("Confirm new password"), {
      target: { value: "New123!a" },
    });
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(
      await screen.findByText("Incorrect current password."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toHaveValue("New123!a");
  });
});
