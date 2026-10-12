import { Navigate, Outlet } from "react-router";
import { LoadingScreen } from "@/components/common/loading-screen";
import { dashboardPathForRole, type ProtectedRole } from "./roles";
import { useSession } from "./use-session";

type ProtectedRouteProps = {
  requiredRole?: ProtectedRole;
  allowedRoles?: readonly ProtectedRole[];
};

export function ProtectedRoute({
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  const permittedRoles = allowedRoles ?? (requiredRole ? [requiredRole] : null);
  if (
    permittedRoles &&
    !permittedRoles.some((role) => role === session.user.role)
  ) {
    return <Navigate replace to={dashboardPathForRole(session.user.role)} />;
  }

  return <Outlet />;
}
