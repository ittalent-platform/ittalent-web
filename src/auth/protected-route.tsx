import { Navigate, Outlet } from "react-router";
import { LoadingScreen } from "@/components/common/loading-screen";
// import { dashboardPathForRole, type ProtectedRole } from "./roles";
import { useSession } from "./use-session";

type ProtectedRouteProps = {
  requiredRole?: "admin" | "recruiter" | "enterprise_admin" | "user";
  requiredRoles?: readonly string[];
};

function dashboardPathForRole(role: string) {
  if (role === "admin") return "/admin/users";
  if (role === "recruiter" || role === "enterprise_admin") return "/recruiter/job-postings";
  return "/";
}

export function ProtectedRoute({ requiredRole, requiredRoles }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if ((requiredRole && session.user.role !== requiredRole) || (requiredRoles && !requiredRoles.includes(session.user.role))) {
    return <Navigate replace to={dashboardPathForRole(session.user.role)} />;
  }

  return <Outlet />;
}
