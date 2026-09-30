import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router";

import { ProtectedRoute } from "@/auth/protected-route";
import { AppLayout } from "@/components/layout/admin-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { CandidateLayout } from "@/components/layout/candidate-layout";
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
const EnterprisesPage = lazy(() =>
  import("@/features/admin/enterprises/enterprises-page").then((m) => ({ default: m.EnterprisesPage })),
);
const AdminEnterpriseDetailPage = lazy(() =>
  import("@/features/admin/enterprises/enterprise-detail-page").then((m) => ({
    default: m.AdminEnterpriseDetailPage,
  })),
);
const EnterpriseFormPage = lazy(() =>
  import("@/features/admin/enterprises/enterprise-form-page").then((m) => ({
    default: m.EnterpriseFormPage,
  })),
);
const ApplicationsPage = lazy(() =>
  import("@/features/applicant/applications/applications-page").then((m) => ({ default: m.ApplicationsPage })),
);
const ApplicationDetailPage = lazy(() =>
  import("@/features/applicant/applications/application-detail-page").then((m) => ({
    default: m.ApplicationDetailPage,
  })),
);

export const appRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/verify-email", element: <EmailVerificationPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute requiredRole="user" />,
    children: [{ element: <CandidateLayout />, children: [
      { path: "/my-applications", element: <ApplicationsPage /> },
      { path: "/my-applications/:id", element: <ApplicationDetailPage /> },
    ] }],
  },
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
          { path: "enterprises", element: <EnterprisesPage /> },
          { path: "enterprises/new", element: <EnterpriseFormPage /> },
          { path: "enterprises/:enterpriseId", element: <AdminEnterpriseDetailPage /> },
          { path: "enterprises/:enterpriseId/edit", element: <EnterpriseFormPage /> },
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
