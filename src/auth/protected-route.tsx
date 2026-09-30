import { Navigate, Outlet } from "react-router";
import { LoadingScreen } from "@/components/common/loading-screen";
import { useSession } from "./use-session";

type ProtectedRouteProps = {
  requiredRole?: "admin" | "recruiter" | "user";
};

function dashboardPathForRole(role: string) {
  if (role === "admin") return "/admin/users";
  if (role === "recruiter") return "/recruiter/job-postings";
  return "/";
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return <Navigate replace to={dashboardPathForRole(session.user.role)} />;
  }

  return <Outlet />;
}
