import { Navigate, Outlet } from "react-router";
import { LoadingScreen } from "@/components/common/loading-screen";
import { useSession } from "./use-session";

type ProtectedRouteProps = {
  requiredRole?: "admin" | "user";
};

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (requiredRole && session.user.role !== requiredRole) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
