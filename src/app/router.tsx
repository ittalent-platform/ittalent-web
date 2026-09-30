import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router";

import { ProtectedRoute } from "@/auth/protected-route";
import { AppLayout } from "@/components/layout/admin-layout";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { LoadingScreen } from "@/components/common/loading-screen";
import { LandingPage } from "@/features/public-site/landing-page";

const LoginPage = lazy(() => import("@/features/auth/login-page").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/features/auth/register-page").then((m) => ({ default: m.RegisterPage })));
const EmailVerificationPage = lazy(() =>
  import("@/features/auth/email-verification-page").then((m) => ({ default: m.EmailVerificationPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/forgot-password-page").then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/reset-password-page").then((m) => ({ default: m.ResetPasswordPage })),
);
const UsersPage = lazy(() => import("@/features/admin/users/users-page").then((m) => ({ default: m.UsersPage })));
const AdminUserDetailPage = lazy(() =>
  import("@/features/admin/users/user-detail-page").then((m) => ({ default: m.AdminUserDetailPage })),
);

const CareerPage = lazy(() =>
  import("@/features/public-site/career/career-page").then((m) => ({
    default: m.CareerPage,
  })),
);
const CareerJobPage = lazy(() =>
  import("@/features/public-site/career/career-job-page").then((m) => ({
    default: m.CareerJobPage,
  })),
);
const EnterprisePage = lazy(() =>
  import("@/features/public-site/enterprise/enterprise-page").then((m) => ({
    default: m.EnterprisePage,
  })),
);
const EnterpriseDetailPage = lazy(() =>
  import("@/features/public-site/enterprise/enterprise-detail-page").then((m) => ({
    default: m.EnterpriseDetailPage,
  })),
);

export const appRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
    ],
  },
  {
    element: <MarketplaceLayout />,
    children: [
      { path: "/career", element: <CareerPage /> },
      { path: "/career/:slug", element: <CareerJobPage /> },
      { path: "/enterprises", element: <EnterprisePage /> },
      { path: "/enterprises/:id", element: <EnterpriseDetailPage /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/verify-email", element: <EmailVerificationPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    path: "/admin",
    element: <ProtectedRoute requiredRole="admin" />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate replace to="/admin/users" /> },
          { path: "users", element: <UsersPage /> },
          { path: "users/:userId", element: <AdminUserDetailPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate replace to="/" />,
  },
];

const router = createBrowserRouter(appRoutes);

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
