import { FilterSelect } from "@/components/ui/filter-select";
import { ListToolbar } from "@/components/common/list-toolbar";

type RoleFilter = "user" | "admin" | "all";
type StatusFilter = "active" | "inactive" | "suspended" | "all";

type UsersToolbarProps = {
  onRoleChange: (role: RoleFilter) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  role: RoleFilter;
  search: string;
  status: StatusFilter;
};

export function UsersToolbar({
  onRoleChange,
  onSearchChange,
  onStatusChange,
  role,
  search,
  status,
}: UsersToolbarProps) {
  return (
    <ListToolbar
      onSearchChange={onSearchChange}
      search={search}
      searchPlaceholder="Search by username or email..."
    >
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          onChange={(val) => onRoleChange(val as RoleFilter)}
          options={[
            { label: "All Roles", value: "all" },
            { label: "Admin", value: "admin" },
            { label: "User", value: "user" },
          ]}
          placeholder="Role"
          value={role}
        />

        <FilterSelect
          onChange={(val) => onStatusChange(val as StatusFilter)}
          options={[
            { label: "All Statuses", value: "all" },
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
            { label: "Suspended", value: "suspended" },
          ]}
          placeholder="Status"
          value={status}
        />
      </div>
    </ListToolbar>
  );
}
