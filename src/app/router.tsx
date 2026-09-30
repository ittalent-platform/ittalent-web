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
const AdminJobPostingDetailPage = lazy(() =>
  import("@/features/admin/job-postings/job-postings-pages").then((m) => ({ default: m.JobPostingDetailPage })),
);
const RecruiterJobPostingsPage = lazy(() =>
  import("@/features/recruiter/job-postings/job-postings-pages").then((m) => ({ default: m.RecruiterJobPostingsPage })),
);
const RecruiterCreateJobPostingPage = lazy(() =>
  import("@/features/recruiter/job-postings/job-postings-pages").then((m) => ({ default: m.RecruiterCreateJobPostingPage })),
);
const RecruiterJobPostingDetailPage = lazy(() =>
  import("@/features/recruiter/job-postings/job-postings-pages").then((m) => ({ default: m.RecruiterJobPostingDetailPage })),
);
const RecruiterEditJobPostingPage = lazy(() =>
  import("@/features/recruiter/job-postings/job-postings-pages").then((m) => ({ default: m.RecruiterEditJobPostingPage })),
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
const ApplicationsPage = lazy(() => import("@/features/applicant/applications/applications-page").then((m) => ({ default: m.ApplicationsPage })));
const ApplicationDetailPage = lazy(() => import("@/features/applicant/applications/application-detail-page").then((m) => ({ default: m.ApplicationDetailPage })));

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
          { path: "job-postings", element: <JobPostingsPage /> },
          { path: "job-postings/create", element: <CreateJobPostingPage /> },
          { path: "job-postings/:jobPostingId", element: <AdminJobPostingDetailPage /> },
          {
            path: "job-postings/:jobPostingId/edit",
            element: <EditJobPostingPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/recruiter",
    element: <ProtectedRoute requiredRole="recruiter" />,
    children: [
      {
        element: <AppLayout actor="recruiter" />,
        children: [
          { index: true, element: <Navigate replace to="/recruiter/job-postings" /> },
          { path: "job-postings", element: <RecruiterJobPostingsPage /> },
          { path: "job-postings/create", element: <RecruiterCreateJobPostingPage /> },
          { path: "job-postings/:jobPostingId", element: <RecruiterJobPostingDetailPage /> },
          { path: "job-postings/:jobPostingId/edit", element: <RecruiterEditJobPostingPage /> },
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
