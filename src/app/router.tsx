import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router";

import { ProtectedRoute } from "@/auth/protected-route";
import { AppLayout } from "@/components/layout/admin-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { LoadingScreen } from "@/components/common/loading-screen";
import { LandingPage } from "@/features/public-site/landing-page";

const LoginPage = lazy(() =>
  import("@/features/auth/login-page").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/features/auth/register-page").then((m) => ({
    default: m.RegisterPage,
  })),
);
const UsersPage = lazy(() =>
  import("@/features/admin/users/users-page").then((m) => ({
    default: m.UsersPage,
  })),
);
const AdminUserDetailPage = lazy(() =>
  import("@/features/admin/users/user-detail-page").then((m) => ({
    default: m.AdminUserDetailPage,
  })),
);
const JobPostingsPage = lazy(() =>
  import("@/features/admin/job-postings/job-postings-pages").then((m) => ({
    default: m.JobPostingsPage,
  })),
);
const CreateJobPostingPage = lazy(() =>
  import("@/features/admin/job-postings/job-postings-pages").then((m) => ({
    default: m.CreateJobPostingPage,
  })),
);
const EditJobPostingPage = lazy(() =>
  import("@/features/admin/job-postings/job-postings-pages").then((m) => ({
    default: m.EditJobPostingPage,
  })),
);
const JobsPage = lazy(() =>
  import("@/features/public-site/jobs-page").then((m) => ({
    default: m.JobsPage,
  })),
);
const DocumentsPage = lazy(() =>
  import("@/features/documents/documents-page").then((m) => ({
    default: m.DocumentsPage,
  })),
);

export const appRoutes = [
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/jobs", element: <JobsPage /> },
      {
        path: "/documents",
        element: <ProtectedRoute requiredRole="user" />,
        children: [{ index: true, element: <DocumentsPage /> }],
      },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
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
          { path: "job-postings", element: <JobPostingsPage /> },
          { path: "job-postings/create", element: <CreateJobPostingPage /> },
          {
            path: "job-postings/:jobPostingId/edit",
            element: <EditJobPostingPage />,
          },
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
