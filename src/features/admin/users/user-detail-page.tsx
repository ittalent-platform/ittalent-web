import { ArrowLeft, Mail, Shield, User } from "lucide-react";
import { Link, useParams } from "react-router";

import { ErrorState } from "@/components/common/error-state";
import { LoadingScreen } from "@/components/common/loading-screen";
import { PersonAvatar } from "@/components/common/person-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { userDisplayId } from "@/lib/display-id";

import { RoleBadge, StatusBadge } from "./user-badges";
import { useUserDetailQuery } from "./users.queries";

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: user, error, isLoading } = useUserDetailQuery(userId);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !user) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Button asChild size="sm" variant="ghost">
            <Link to="/admin/users">
              <ArrowLeft className="size-4" />
              Back to users
            </Link>
          </Button>
        </div>
        <ErrorState
          description="The requested user profile could not be loaded."
          title="User not found"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <Button asChild size="sm" variant="ghost">
          <Link to="/admin/users">
            <ArrowLeft className="size-4" />
            Back to users
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <PersonAvatar className="size-12 text-base font-bold" name={user.username} />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="itt-display text-2xl font-bold text-foreground">
                {user.username}
              </h1>
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="size-3.5" />
              {user.email}
              <span>·</span>
              <span className="itt-mono text-xs text-muted-foreground">
                ID: {userDisplayId(user.id)}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="text-sm font-semibold text-muted-foreground pb-2 flex flex-row items-center gap-2">
            <User className="size-4" /> Account Details
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{user.username}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Full ID</p>
              <p className="text-xs itt-mono text-foreground mt-0.5 break-all">{user.id}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-sm font-semibold text-muted-foreground pb-2 flex flex-row items-center gap-2">
            <Shield className="size-4" /> Permissions & Lifecycle
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Assigned Role</p>
              <div className="mt-1">
                <RoleBadge role={user.role} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Account Status</p>
              <div className="mt-1">
                <StatusBadge status={user.status} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {user.createdAt ? formatDate(user.createdAt) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
