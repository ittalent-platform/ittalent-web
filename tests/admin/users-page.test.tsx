import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { patchApiV1UsersById } from "@/api/generated";
import { authKeys } from "@/auth/use-session";
import { ToastProvider } from "@/components/toast/toast-provider";

import { AdminUserDetailPage } from "@/features/admin/users/user-detail-page";
import { UsersPage } from "@/features/admin/users/users-page";
import * as usersQueries from "@/features/admin/users/users.queries";

vi.mock("@/api/generated", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/generated")>()),
  patchApiV1UsersById: vi.fn(),
}));
const mockedPatch = vi.mocked(patchApiV1UsersById);

const user = {
  createdAt: "2026-01-01T00:00:00.000Z",
  email: "dev@example.com",
  emailVerified: true,
  enterpriseId: null,
  fullName: "John Doe",
  id: "6a4a5424c8097df77a6ed9be",
  phone: "0901122334",
  role: "user",
  status: "active",
  username: "johndoe",
};

function mockList(items: unknown[], total = items.length) {
  vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
    data: { items, limit: 10, page: 1, total, totalPages: total ? 1 : 0 },
    isLoading: false,
  } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

/** The pages read the session and show toasts, so they render inside the same providers as the app. */
function renderApp(ui: React.ReactElement, queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
  return queryClient;
}

function renderList(path = "/admin/users", queryClient?: QueryClient) {
  return renderApp(
    <MemoryRouter initialEntries={[path]}>
      <UsersPage />
      <LocationProbe />
    </MemoryRouter>,
    queryClient,
  );
}

beforeEach(() => {
  localStorage.clear();
  mockedPatch.mockReset();
});

const lastListParams = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.at(-1)?.[0] as Record<string, unknown>;

afterEach(() => vi.restoreAllMocks());

describe("UsersPage", () => {
  it("renders the header, filters and one row per user with backed columns only", () => {
    mockList([user, { ...user, email: "admin@example.com", fullName: "Admin Boss", id: "7b4a5424c8097df77a6ed9bf", role: "admin", username: "adminboss" }]);
    renderList();

    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByText("2 accounts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create user/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Role: All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account: All" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /John Doe/ })).toHaveAttribute("href", "/admin/users/6a4a5424c8097df77a6ed9be");
    expect(screen.getByText("dev@example.com")).toBeInTheDocument();
    expect(screen.getByText("Applicant")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Email: All" })).toBeInTheDocument();
  });

  it("shows the full name (or the username when there is none) with the email under it", () => {
    mockList([user, { ...user, fullName: null, id: "7b4a5424c8097df77a6ed9bf", phone: null, username: "nameless" }]);
    renderList();

    expect(screen.getByRole("link", { name: /John Doe/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nameless/ })).toBeInTheDocument();
    expect(screen.getAllByText("dev@example.com")).toHaveLength(2);
  });

  it("shows each account's email status", () => {
    mockList([user, { ...user, emailVerified: false, id: "7b4a5424c8097df77a6ed9bf", username: "newcomer" }]);
    renderList();

    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Unverified")).toBeInTheDocument();
  });

  it("flags an overdue verification and a failed invitation", () => {
    const old = "2020-01-01T00:00:00.000Z";
    mockList([
      { ...user, createdAt: old, emailVerified: false, id: "7b4a5424c8097df77a6ed9bf", status: "inactive", username: "late" },
      { ...user, emailVerified: false, id: "8c4a5424c8097df77a6ed9c0", invitation: { deliveryStatus: "failed", expiresAt: old, status: "pending" }, status: "invited", username: "undelivered" },
    ]);
    renderList();

    expect(screen.getByText("Unverified · overdue")).toBeInTheDocument();
    expect(screen.getByText("Invite not delivered")).toBeInTheDocument();
  });

  it("keeps every typed character and puts the term in the URL once typing pauses", () => {
    vi.useFakeTimers();
    try {
      mockList([user]);
      renderList("/admin/users?page=3");
      const box = screen.getByRole("searchbox");

      // Several changes before the router could answer: none may be lost.
      fireEvent.change(box, { target: { value: "f" } });
      fireEvent.change(box, { target: { value: "fl" } });
      fireEvent.change(box, { target: { value: "flakeian" } });
      expect(box).toHaveValue("flakeian");
      expect(screen.getByTestId("location")).toHaveTextContent("?page=3");

      act(() => vi.advanceTimersByTime(300));

      expect(screen.getByTestId("location")).toHaveTextContent("?search=flakeian");
      expect(screen.getByTestId("location")).not.toHaveTextContent("page=3");
      expect(box).toHaveValue("flakeian");
      expect(box).toHaveAttribute("placeholder", "Search by name, email or phone");
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the search term from the URL and clears it back to all accounts", () => {
    vi.useFakeTimers();
    try {
      const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
        data: { items: [user], limit: 10, page: 1, total: 1, totalPages: 1 },
        isLoading: false,
      } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
      renderList("/admin/users?search=johndoe");

      expect(screen.getByRole("searchbox")).toHaveValue("johndoe");
      expect(lastListParams(spy)).toMatchObject({ search: "johndoe" });

      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
      act(() => vi.advanceTimersByTime(300));

      expect(screen.getByTestId("location")).toHaveTextContent(/^$/);
      expect(lastListParams(spy)).not.toHaveProperty("search");
    } finally {
      vi.useRealTimers();
    }
  });

  it("asks for the newest accounts first by default", () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 1, totalPages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList();

    expect(lastListParams(spy)).toMatchObject({ sortBy: "createdAt", sortOrder: "desc" });
  });

  it("sorts by a column header, flips the direction on a second click and returns to the first page", () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 30, totalPages: 3 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList("/admin/users?page=2");

    fireEvent.click(within(screen.getByRole("columnheader", { name: /^name$/i })).getByRole("button"));
    expect(lastListParams(spy)).toMatchObject({ page: 1, sortBy: "name", sortOrder: "asc" });
    expect(screen.getByTestId("location")).toHaveTextContent("sortBy=name");

    fireEvent.click(within(screen.getByRole("columnheader", { name: /^name$/i })).getByRole("button"));
    expect(lastListParams(spy)).toMatchObject({ sortBy: "name", sortOrder: "desc" });

    fireEvent.click(within(screen.getByRole("columnheader", { name: /^created$/i })).getByRole("button"));
    expect(lastListParams(spy)).toMatchObject({ sortBy: "createdAt", sortOrder: "desc" });
  });

  it("filters by email status and returns to the first page", async () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 30, totalPages: 3 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList("/admin/users?page=2");
    const userEvents = userEvent.setup();

    await userEvents.click(screen.getByRole("button", { name: /email:/i }));
    // The only "Unverified" on screen is the filter option (the fixture account is verified).
    await userEvents.click(await screen.findByText("Unverified"));

    expect(lastListParams(spy)).toMatchObject({ emailVerified: false });
    expect(screen.getByTestId("location")).not.toHaveTextContent("page=2");
    expect(screen.getByTestId("location")).toHaveTextContent("email=unverified");
  });

  it("filters by several roles, shows a count and removable chips, and clears them all", async () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 1, totalPages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList("/admin/users?role=recruiter,enterprise_admin&status=active");
    const userEvents = userEvent.setup();

    expect(lastListParams(spy)).toMatchObject({ role: ["recruiter", "enterprise_admin"], status: ["active"] });
    expect(screen.getByRole("button", { name: /role: 2/i })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Active filters" })).getByText("Role: HR, Enterprise admin")).toBeInTheDocument();

    await userEvents.click(screen.getByRole("button", { name: "Remove Account filter" }));
    expect(screen.getByTestId("location")).not.toHaveTextContent("status=");
    await userEvents.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.getByTestId("location")).toBeEmptyDOMElement();
  });

  it("drops invalid filters from the link and says so", async () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 1, totalPages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList("/admin/users?role=hacker,admin&company=nope");

    expect(lastListParams(spy)).toMatchObject({ role: ["admin"] });
    expect(lastListParams(spy)).not.toHaveProperty("enterpriseId");
    expect(screen.getByText(/weren't valid and were removed/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(/weren't valid/)).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("role=admin");
    expect(screen.getByTestId("location")).not.toHaveTextContent("company");
  });

  it("hints at a too-short search and keeps querying the last valid term", () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 1, totalPages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList("/admin/users?search=a");

    expect(screen.getByText("Enter at least 2 characters (up to 100)")).toBeInTheDocument();
    expect(lastListParams(spy)).not.toHaveProperty("search");
  });

  it("explains an empty filtered result and offers to clear the filters", async () => {
    mockList([]);
    renderList("/admin/users?role=admin");

    expect(screen.getByText("No accounts match these filters")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(screen.getByTestId("location")).toBeEmptyDOMElement();
  });

  it("offers a retry when the list fails and a dashboard link on 403", async () => {
    const refetch = vi.fn();
    const failure = (status: number) => vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: undefined,
      error: Object.assign(new Error("boom"), { status }),
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    failure(503);
    renderList();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows the no-access state when the API answers 403", () => {
    vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: undefined,
      error: Object.assign(new Error("forbidden"), { status: 403 }),
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList();

    expect(screen.getByText("You don't have access to user accounts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to my dashboard" })).toBeInTheDocument();
  });

  it("only offers sorting for the columns the API can sort by", () => {
    mockList([user]);
    renderList();

    for (const name of [/^name$/i, /^created$/i]) {
      expect(within(screen.getByRole("columnheader", { name })).getByRole("button")).toBeInTheDocument();
    }
    for (const name of [/^role$/i, /^company$/i, /^email$/i, /^account$/i]) {
      expect(within(screen.getByRole("columnheader", { name })).queryByRole("button")).not.toBeInTheDocument();
    }
  });

  it("ignores an unsupported sort column in the URL", () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 1, totalPages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList("/admin/users?sortBy=password_hash&sortOrder=sideways");

    expect(lastListParams(spy)).toMatchObject({ sortBy: "createdAt", sortOrder: "desc" });
  });

  it("shows the table header and an empty message without a count when the API has no users", () => {
    mockList([]);
    renderList();

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByText("No users found.")).toBeInTheDocument();
    expect(screen.queryByText(/ of \d+ accounts?/)).not.toBeInTheDocument();
  });

  it("opens the create dialog with role cards, username, email and mobile fields", () => {
    mockList([]);
    renderList();

    fireEvent.click(screen.getByRole("button", { name: /create user/i }));

    expect(screen.getByRole("dialog", { name: "Create user account" })).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual(["user", "recruiter", "enterprise_admin"]);
    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create and send invitation" })).toBeDisabled();
  });
});

describe("AdminUserDetailPage", () => {
  function renderDetail() {
    vi.spyOn(usersQueries, "useUserDetailQuery").mockReturnValue({
      data: user,
      error: null,
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUserDetailQuery>);
    renderApp(
      <MemoryRouter initialEntries={["/admin/users/6a4a5424c8097df77a6ed9be"]}>
        <Routes>
          <Route element={<AdminUserDetailPage />} path="/admin/users/:userId" />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("shows personal and access cards with History, Edit information and Suspend actions", () => {
    renderDetail();

    expect(screen.getByRole("heading", { name: "John Doe" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByRole("heading", { name: "Personal information" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Account and access" })).toBeInTheDocument();
    expect(screen.getByText("Account ID")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Full name")).toBeInTheDocument();
    expect(screen.getByText("Mobile")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Account history" })).not.toBeInTheDocument();
    expect(screen.queryByText(/use Change role/)).not.toBeInTheDocument();
    expect(screen.getByText("0901 122 334")).toBeInTheDocument();
    expect(screen.queryByText("Activity")).not.toBeInTheDocument();
    expect(screen.queryByText(/audit history/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/last sign-in/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("opens the suspend confirmation but keeps the confirm action disabled", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent("Suspend John Doe?");
    expect(screen.getByRole("button", { name: "Suspend account" })).toBeDisabled();
  });

  it("edits without the Not editable block", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("dialog", { name: "Edit information" })).toBeInTheDocument();
    expect(screen.queryByText("Not editable here")).not.toBeInTheDocument();
    expect(screen.queryByText("Set by the user")).not.toBeInTheDocument();
  });
});

describe("Edit user form (UC-USER-03)", () => {
  const admin = { ...user, id: "7b4a5424c8097df77a6ed9bf", role: "admin", username: "boss", fullName: "Minh Admin", phone: null };

  function renderEdit(target = user, currentUserId = "someone-else") {
    localStorage.setItem("ittalent_access_token", "token");
    localStorage.setItem("ittalent_refresh_token", "refresh");
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.me(), { ...admin, id: currentUserId });
    mockList([target]);
    renderList("/admin/users", queryClient);
    return queryClient;
  }

  async function openEdit(name: string) {
    const events = userEvent.setup();
    await events.click(screen.getByRole("button", { name: `Actions for ${name}` }));
    await events.click(await screen.findByRole("menuitem", { name: /edit/i }));
    return { events, dialog: await screen.findByRole("dialog", { name: /edit information/i }) };
  }

  const saved = { ...user, fullName: "Mai Dương", phone: "0987654321" };

  it("fills the form from the account and locks the email, with Save off until something changes", async () => {
    renderEdit();
    const { dialog } = await openEdit("John Doe");

    expect(within(dialog).getByLabelText(/full name/i)).toHaveValue("John Doe");
    expect(within(dialog).getByLabelText(/mobile number/i)).toHaveValue("0901122334");
    expect(within(dialog).getByLabelText(/^email/i)).toHaveAttribute("readonly");
    expect(within(dialog).getByLabelText(/^email/i)).toHaveValue("dev@example.com");
    expect(within(dialog).queryByText(/Use Change email/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("sends only the fields that changed, then closes and refreshes the list", async () => {
    mockedPatch.mockResolvedValue({ data: saved, error: undefined, response: { status: 200 } } as never);
    const queryClient = renderEdit();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { events, dialog } = await openEdit("John Doe");

    await events.clear(within(dialog).getByLabelText(/full name/i));
    await events.type(within(dialog).getByLabelText(/full name/i), "  Mai Dương ");
    await events.clear(within(dialog).getByLabelText(/mobile number/i));
    await events.type(within(dialog).getByLabelText(/mobile number/i), "0987 654 321");
    expect(within(dialog).getByLabelText(/mobile number/i)).toHaveValue("0987654321");
    await events.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockedPatch).toHaveBeenCalledTimes(1));
    expect(mockedPatch).toHaveBeenCalledWith({ body: { fullName: "Mai Dương", phone: "0987654321", expectedVersion: 0 }, path: { id: user.id } });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /edit information/i })).not.toBeInTheDocument());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["admin-users", "list"] });
    expect(await screen.findByText("Mai Dương was updated.")).toBeInTheDocument();
  });

  it("clears the mobile number by sending null when the field is emptied", async () => {
    mockedPatch.mockResolvedValue({ data: { ...user, phone: null }, error: undefined, response: { status: 200 } } as never);
    renderEdit();
    const { events, dialog } = await openEdit("John Doe");

    await events.clear(within(dialog).getByLabelText(/mobile number/i));
    await events.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockedPatch).toHaveBeenCalledWith({ body: { phone: null, expectedVersion: 0 }, path: { id: user.id } }));
  });

  it("offers no role control and cannot submit without a change", async () => {
    renderEdit();
    const { dialog } = await openEdit("John Doe");
    expect(within(dialog).queryByRole("radio")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Use Change role")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(mockedPatch).not.toHaveBeenCalled();
  });

  it("does not send the role when it was not touched, even for a role the form cannot show", async () => {
    mockedPatch.mockResolvedValue({ data: { ...user, role: "recruiter", fullName: "New Name" }, error: undefined, response: { status: 200 } } as never);
    renderEdit({ ...user, role: "recruiter" });
    const { events, dialog } = await openEdit("John Doe");

    await events.clear(within(dialog).getByLabelText(/full name/i));
    await events.type(within(dialog).getByLabelText(/full name/i), "New Name");
    await events.click(within(dialog).getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(mockedPatch).toHaveBeenCalledWith({ body: { fullName: "New Name", expectedVersion: 0 }, path: { id: user.id } }));
  });

  it("locks the role of the signed-in administrator's own account", async () => {
    renderEdit(admin, admin.id);
    const { dialog } = await openEdit("Minh Admin");

    expect(within(dialog).queryByText("Use Change role")).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("radio")).not.toBeInTheDocument();
  });

  it("explains an invalid name or number and does not call the API", async () => {
    renderEdit();
    const { events, dialog } = await openEdit("John Doe");

    await events.clear(within(dialog).getByLabelText(/full name/i));
    await events.type(within(dialog).getByLabelText(/full name/i), "A");
    await events.clear(within(dialog).getByLabelText(/mobile number/i));
    await events.type(within(dialog).getByLabelText(/mobile number/i), "0212345678");
    await events.click(within(dialog).getByRole("button", { name: "Save changes" }));

    expect(await within(dialog).findByText("Enter a name of 2–100 characters.")).toBeInTheDocument();
    expect(within(dialog).getByText(/enter a 10-digit mobile number starting with 0/i)).toBeInTheDocument();
    expect(mockedPatch).not.toHaveBeenCalled();
  });

  it("shows the API's reason when it rejects the edit and keeps the dialog open", async () => {
    mockedPatch.mockResolvedValue({ data: undefined, error: { message: "You can't change your own role" }, response: { status: 403 } } as never);
    renderEdit();
    const { events, dialog } = await openEdit("John Doe");

    await events.clear(within(dialog).getByLabelText(/full name/i));
    await events.type(within(dialog).getByLabelText(/full name/i), "Someone Else");
    await events.click(within(dialog).getByRole("button", { name: "Save changes" }));

    expect(await within(dialog).findByText("You can't change your own role")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /edit information/i })).toBeInTheDocument();
  });

  it("shows a generic message when the server fails", async () => {
    mockedPatch.mockResolvedValue({ data: undefined, error: { message: "Unable to load user accounts right now." }, response: { status: 503 } } as never);
    renderEdit();
    const { events, dialog } = await openEdit("John Doe");

    await events.clear(within(dialog).getByLabelText(/full name/i));
    await events.type(within(dialog).getByLabelText(/full name/i), "Someone Else");
    await events.click(within(dialog).getByRole("button", { name: "Save changes" }));

    expect(await within(dialog).findByText("Couldn't save the changes. Try again in a moment.")).toBeInTheDocument();
  });

  it("sends the loaded account version and preserves input when the server reports a conflict", async () => {
    mockedPatch.mockResolvedValue({ data: undefined, error: { message: "The account changed. Reload and try again." }, response: { status: 409 } } as never);
    renderEdit({ ...user, version: 7 });
    const { events, dialog } = await openEdit("John Doe");
    await events.clear(within(dialog).getByLabelText(/full name/i));
    await events.type(within(dialog).getByLabelText(/full name/i), "Unsaved Name");
    await events.click(within(dialog).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(mockedPatch).toHaveBeenCalledWith({ body: { fullName: "Unsaved Name", expectedVersion: 7 }, path: { id: user.id } }));
    expect(await within(dialog).findByText("This account changed while you were editing")).toBeInTheDocument();
    expect(within(dialog).getByRole("columnheader", { name: "Saved now" })).toBeInTheDocument();
    expect(within(dialog).getByText("Unsaved Name", { selector: "td" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/full name/i)).toHaveValue("Unsaved Name");
    expect(screen.getByRole("dialog", { name: /edit information/i })).toBeInTheDocument();
  });
});
