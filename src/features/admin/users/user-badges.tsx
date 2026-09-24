import { Badge } from "@/components/ui/badge";

export function RoleBadge({ role }: { role?: string }) {
  if (role === "admin") {
    return (
      <Badge className="bg-(--primary-50) text-(--primary-700) border-(--primary-200)">
        Admin
      </Badge>
    );
  }

  return (
    <Badge className="bg-secondary text-secondary-foreground">
      User
    </Badge>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  if (status === "active") {
    return (
      <Badge className="bg-(--status-success-bg) text-(--status-success-fg) border-(--status-success-border)">
        Active
      </Badge>
    );
  }

  if (status === "suspended") {
    return (
      <Badge className="bg-(--danger-bg) text-(--danger-fg) border-(--danger-border)">
        Suspended
      </Badge>
    );
  }

  return (
    <Badge className="bg-muted text-muted-foreground">
      {status ?? "Inactive"}
    </Badge>
  );
}
