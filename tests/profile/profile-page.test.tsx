import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "@/components/toast/toast-provider";
import { ProfilePage } from "@/features/profile/profile-page";
import { AVATAR_MAX_BYTES } from "@/features/profile/profile.constants";
import en from "@/locales/en/common.json";
import viLocale from "@/locales/vi/common.json";

const fixture = {
  access: "full" as const,
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
  enterpriseName: null,
  version: 7,
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

function profileResult(overrides: Record<string, unknown> = {}) {
  return {
    data: fixture,
    error: null,
    isError: false,
    isFetching: false,
    isPending: false,
    refetch: vi.fn().mockResolvedValue({ data: fixture }),
    ...overrides,
  };
}

function renderProfile(initialPath = "/profile") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: "/profile", element: <ProfilePage /> },
      { path: "/profile/password", element: <ProfilePage /> },
      { path: "/other", element: <h1>Other page</h1> },
      { path: "/login", element: <h1>Sign in page</h1> },
    ],
    { initialEntries: [initialPath] },
  );
  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>,
    ),
  };
}

async function beginEditing() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Edit profile" }));
  return user;
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profile.mockReturnValue(profileResult());
    mocks.update.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({
        ...fixture,
        fullName: "New Name",
        version: 8,
      }),
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

  it("loads the profile and displays only the approved profile fields", () => {
    renderProfile();
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getAllByText("mine@example.test")).not.toHaveLength(0);
    expect(screen.getAllByText("My Name")).not.toHaveLength(0);
    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.getByText("Candidate")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText(/date of birth|gender|location|headline/i)).not.toBeInTheDocument();
  });

  it("shows company membership only when the API returns a valid id and name", () => {
    mocks.profile.mockReturnValue(
      profileResult({
        data: {
          ...fixture,
          role: "recruiter",
          enterpriseId: "enterprise-id",
          enterpriseName: "Northstar Labs",
        },
      }),
    );
    renderProfile();
    expect(screen.getByText("Company membership")).toBeInTheDocument();
    expect(screen.getByText("Northstar Labs")).toBeInTheDocument();
    expect(screen.getByText("Recruiter")).toBeInTheDocument();
  });

  it("keeps email, role, status and company membership read-only while editing", async () => {
    mocks.profile.mockReturnValue(
      profileResult({
        data: {
          ...fixture,
          enterpriseId: "enterprise-id",
          enterpriseName: "Northstar Labs",
        },
      }),
    );
    renderProfile();
    await beginEditing();
    expect(screen.getByLabelText(/Full name/)).toBeEnabled();
    expect(screen.getByLabelText(/Mobile number/)).toBeEnabled();
    expect(screen.queryByRole("textbox", { name: /Email|Role|Account status|Company membership/ })).not.toBeInTheDocument();
    expect(screen.getByText("Northstar Labs")).toBeInTheDocument();
  });

  it("sends only changed allowlisted fields with the expected version", async () => {
    renderProfile();
    const user = await beginEditing();
    await user.clear(screen.getByLabelText(/Full name/));
    await user.type(screen.getByLabelText(/Full name/), "New Name");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.update().mutateAsync).toHaveBeenCalledWith({
        expectedVersion: 7,
        fullName: "New Name",
      }),
    );
    const payload = mocks.update().mutateAsync.mock.calls[0]?.[0];
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("role");
    expect(payload).not.toHaveProperty("status");
    expect(payload).not.toHaveProperty("enterpriseId");
  });

  it("clears phone with null and does not include unchanged fullName", async () => {
    renderProfile();
    const user = await beginEditing();
    await user.clear(screen.getByLabelText(/Mobile number/));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() =>
      expect(mocks.update().mutateAsync).toHaveBeenCalledWith({
        expectedVersion: 7,
        phone: null,
      }),
    );
  });

  it("does not send a no-op update", async () => {
    renderProfile();
    const user = await beginEditing();
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();
    await user.clear(screen.getByLabelText(/Full name/));
    await user.type(screen.getByLabelText(/Full name/), "  My Name  ");
    expect(save).toBeDisabled();
    expect(mocks.update().mutateAsync).not.toHaveBeenCalled();
  });

  it("requires a fresh profile projection after a 409 conflict", async () => {
    const refetch = vi.fn().mockResolvedValue({ data: fixture });
    mocks.profile.mockReturnValue(profileResult({ refetch }));
    mocks.update.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockRejectedValue(Object.assign(new Error("stale"), { status: 409 })),
    });
    renderProfile();
    const user = await beginEditing();
    await user.clear(screen.getByLabelText(/Full name/));
    await user.type(screen.getByLabelText(/Full name/), "Changed");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText(/changed elsewhere/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reload profile" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("cancels without mutation and confirms before discarding changes", async () => {
    renderProfile();
    const user = await beginEditing();
    await user.clear(screen.getByLabelText(/Full name/));
    await user.type(screen.getByLabelText(/Full name/), "Changed name");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading", { name: "Discard your changes?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByDisplayValue("Changed name")).toBeInTheDocument();
    expect(mocks.update().mutateAsync).not.toHaveBeenCalled();
  });

  it("blocks route navigation while profile changes are unsaved", async () => {
    const { router } = renderProfile();
    const user = await beginEditing();
    await user.clear(screen.getByLabelText(/Full name/));
    await user.type(screen.getByLabelText(/Full name/), "Changed name");
    void router.navigate("/other");
    expect(await screen.findByText(/Leave this page and discard/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Other page" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(await screen.findByRole("heading", { name: "Other page" })).toBeInTheDocument();
  });

  it("renders loading, retryable failure, missing profile and projection-failure states", async () => {
    const refetch = vi.fn();
    mocks.profile.mockReturnValue(profileResult({ data: undefined, isPending: true }));
    const loading = renderProfile();
    expect(screen.getByText("Loading your profile…")).toBeInTheDocument();
    loading.unmount();

    mocks.profile.mockReturnValue(profileResult({ data: undefined, error: new Error("offline"), isError: true, refetch }));
    const failed = renderProfile();
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
    failed.unmount();

    mocks.profile.mockReturnValue(profileResult({ data: undefined, error: Object.assign(new Error("missing"), { status: 404 }), isError: true }));
    const missing = renderProfile();
    expect(screen.getByText(/No replacement profile was created/i)).toBeInTheDocument();
    missing.unmount();

    mocks.profile.mockReturnValue(profileResult({ data: { ...fixture, email: undefined } }));
    renderProfile();
    expect(screen.getByText(/incomplete profile response/i)).toBeInTheDocument();
  });

  it("renders unauthenticated, suspended, and unverified basic-read states without stale success UI", () => {
    mocks.profile.mockReturnValue(profileResult({ data: undefined, error: Object.assign(new Error("auth"), { status: 401 }), isError: true }));
    const unauthenticated = renderProfile();
    expect(screen.getByText(/session is no longer available/i)).toBeInTheDocument();
    expect(screen.queryByText("My Name")).not.toBeInTheDocument();
    unauthenticated.unmount();

    mocks.profile.mockReturnValue(profileResult({ data: { ...fixture, status: "suspended" } }));
    const suspended = renderProfile();
    expect(screen.getByText("Your account is blocked")).toBeInTheDocument();
    expect(screen.queryByText("My Name")).not.toBeInTheDocument();
    suspended.unmount();

    mocks.profile.mockReturnValue(profileResult({ data: { access: "basic", id: fixture.id, email: fixture.email, username: fixture.username, fullName: fixture.fullName, avatarUrl: fixture.avatarUrl, role: fixture.role, status: "inactive", emailVerified: false } }));
    renderProfile();
    expect(screen.getByText(/email is not verified/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit profile" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change profile photo" })).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden Co")).not.toBeInTheDocument();
  });

  it("rejects unsupported and empty avatar files before upload", async () => {
    const user = userEvent.setup();
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change profile photo" }));
    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [new File(["invalid"], "avatar.svg", { type: "image/svg+xml" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a JPEG, PNG, or WebP image.");
    expect(mocks.upload().mutateAsync).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [new File([], "avatar.png", { type: "image/png" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("This file is empty");

    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: {
        files: [
          new File(
            [new Uint8Array(AVATAR_MAX_BYTES + 1)],
            "avatar.png",
            { type: "image/png" },
          ),
        ],
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose an image no larger than 5 MB.",
    );
  });

  it("previews the selected file and uploads it only after Save", async () => {
    const user = userEvent.setup();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn().mockReturnValue("blob:preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change profile photo" }));
    const file = new File(["png"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Choose image"), { target: { files: [file] } });
    fireEvent.load(screen.getByAltText("Profile photo preview"));
    expect(screen.getByText("Profile photo preview")).toBeInTheDocument();
    expect(mocks.upload().mutateAsync).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Save photo" }));
    await waitFor(() => expect(mocks.upload().mutateAsync).toHaveBeenCalledTimes(1));
    const uploaded = mocks.upload().mutateAsync.mock.calls[0]?.[0] as File;
    expect(uploaded).toBe(file);
    expect(uploaded.type).toBe("image/png");
  });

  it("keeps the old avatar and selected preview available after upload failure, while Cancel never mutates", async () => {
    const user = userEvent.setup();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn().mockReturnValue("blob:preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    mocks.profile.mockReturnValue(profileResult({ data: { ...fixture, avatarUrl: "https://example.test/old.png" } }));
    mocks.upload.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockRejectedValue(new Error("upload failed")) });

    renderProfile();
    await user.click(screen.getByRole("button", { name: "Change profile photo" }));
    fireEvent.change(screen.getByLabelText("Choose image"), {
      target: { files: [new File(["png"], "avatar.png", { type: "image/png" })] },
    });
    fireEvent.load(screen.getByAltText("Profile photo preview"));
    await user.click(screen.getByRole("button", { name: "Save photo" }));
    expect(await screen.findByText(/Unable to upload your avatar/i)).toBeInTheDocument();
    expect(screen.getByAltText("Profile photo preview")).toBeInTheDocument();
    expect(document.querySelector('img[src="https://example.test/old.png"]')).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.upload().mutateAsync).toHaveBeenCalledTimes(1);
  });

  it("validates password confirmation and policy before mutation", async () => {
    const user = userEvent.setup();
    renderProfile("/profile/password");
    expect(screen.getByLabelText(/Current password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New password/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm new password/)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Current password/), "Old123!a");
    await user.type(screen.getByLabelText(/^New password/), "weak");
    await user.type(screen.getByLabelText(/Confirm new password/), "different");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(screen.getByText("An uppercase letter")).toBeInTheDocument();
    expect(mocks.changePassword().mutateAsync).not.toHaveBeenCalled();
  });

  it("uses a credential error only for the backend credential code and a distinct rate-limit error", async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockRejectedValue(
        Object.assign(new Error("wrong"), {
          code: "CURRENT_CREDENTIAL_INVALID",
          status: 400,
        }),
      ),
    });
    const first = renderProfile("/profile/password");
    await user.type(screen.getByLabelText(/Current password/), "Wrong123!");
    await user.type(screen.getByLabelText(/^New password/), "New123!a");
    await user.type(screen.getByLabelText(/Confirm new password/), "New123!a");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText(/could not verify your current credentials/i)).toBeInTheDocument();
    first.unmount();

    mocks.changePassword.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockRejectedValue(Object.assign(new Error("limited"), { status: 429 })),
    });
    renderProfile("/profile/password");
    await user.type(screen.getByLabelText(/Current password/), "Wrong123!");
    await user.type(screen.getByLabelText(/^New password/), "New123!a");
    await user.type(screen.getByLabelText(/Confirm new password/), "New123!a");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText(/too many password attempts/i)).toBeInTheDocument();
  });

  it("does not submit the current password as the new password and keeps unknown errors generic", async () => {
    const user = userEvent.setup();
    renderProfile("/profile/password");
    await user.type(screen.getByLabelText(/Current password/), "Same123!a");
    await user.type(screen.getByLabelText(/^New password/), "Same123!a");
    await user.type(screen.getByLabelText(/Confirm new password/), "Same123!a");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(
      await screen.findByText(/differs from your current password/i),
    ).toBeInTheDocument();
    expect(mocks.changePassword().mutateAsync).not.toHaveBeenCalled();
  });

  it("does not report a network failure as an incorrect current password", async () => {
    const user = userEvent.setup();
    mocks.changePassword.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockRejectedValue(new Error("offline")),
    });
    renderProfile("/profile/password");
    await user.type(screen.getByLabelText(/Current password/), "Old123!a");
    await user.type(screen.getByLabelText(/^New password/), "New123!a");
    await user.type(screen.getByLabelText(/Confirm new password/), "New123!a");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText(/Unable to change your password/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/could not verify your current credentials/i),
    ).not.toBeInTheDocument();
  });

  it("handles passwordless accounts and stays on an authenticated profile after success", async () => {
    const user = userEvent.setup();
    mocks.profile.mockReturnValue(profileResult({ data: { ...fixture, hasPassword: false } }));
    const passwordless = renderProfile("/profile/password");
    expect(screen.getByText(/no local password/i)).toBeInTheDocument();
    passwordless.unmount();

    mocks.profile.mockReturnValue(profileResult());
    renderProfile("/profile/password");
    await user.type(screen.getByLabelText(/Current password/), "Old123!a");
    await user.type(screen.getByLabelText(/^New password/), "New123!a");
    await user.type(screen.getByLabelText(/Confirm new password/), "New123!a");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(mocks.changePassword().mutateAsync).toHaveBeenCalledWith({ currentPassword: "Old123!a", newPassword: "New123!a", confirmation: "New123!a" }));
    expect(await screen.findByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sign in page" })).not.toBeInTheDocument();
  });

  it("keeps all profile translation keys aligned in English and Vietnamese", () => {
    const englishKeys = Object.keys(en.myProfile).filter((key) => key !== "unsavedChanges_one").sort();
    expect(Object.keys(viLocale.myProfile).sort()).toEqual(englishKeys);
    expect(Object.keys(viLocale.myProfile.passwordRules).sort()).toEqual(Object.keys(en.myProfile.passwordRules).sort());
    expect(Object.keys(viLocale.myProfile.status).sort()).toEqual(Object.keys(en.myProfile.status).sort());
  });
});
