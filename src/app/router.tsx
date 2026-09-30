import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router";

import { ProtectedRoute } from "@/auth/protected-route";
import { AppLayout } from "@/components/layout/admin-layout";
import { PublicLayout } from "@/components/layout/public-layout";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";
import { CandidateLayout } from "@/components/layout/candidate-layout";
import { LoadingScreen } from "@/components/common/loading-screen";
import { HomePage } from "@/features/public-site/home/home-page";

const LoginPage = lazy(() =>
  import("@/features/auth/login-page").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/features/auth/register-page").then((m) => ({
    default: m.RegisterPage,
  })),
);
const EmailVerificationPage = lazy(() =>
  import("@/features/auth/email-verification-page").then((m) => ({
    default: m.EmailVerificationPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/forgot-password-page").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/reset-password-page").then((m) => ({
    default: m.ResetPasswordPage,
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
const AdminJobPostingDetailPage = lazy(() =>
  import("@/features/admin/job-postings/job-postings-pages").then((m) => ({
    default: m.JobPostingDetailPage,
  })),
);
const RecruiterJobPostingsPage = lazy(() =>
  import("@/features/recruiter/job-postings/job-postings-pages").then((m) => ({
    default: m.RecruiterJobPostingsPage,
  })),
);
const RecruiterCreateJobPostingPage = lazy(() =>
  import("@/features/recruiter/job-postings/job-postings-pages").then((m) => ({
    default: m.RecruiterCreateJobPostingPage,
  })),
);
const RecruiterJobPostingDetailPage = lazy(() =>
  import("@/features/recruiter/job-postings/job-postings-pages").then((m) => ({
    default: m.RecruiterJobPostingDetailPage,
  })),
);
const RecruiterEditJobPostingPage = lazy(() =>
  import("@/features/recruiter/job-postings/job-postings-pages").then((m) => ({
    default: m.RecruiterEditJobPostingPage,
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
const ApplicationsPage = lazy(() =>
  import("@/features/applicant/applications/applications-page").then((m) => ({
    default: m.ApplicationsPage,
  })),
);
const ApplicationDetailPage = lazy(() =>
  import("@/features/applicant/applications/application-detail-page").then(
    (m) => ({ default: m.ApplicationDetailPage }),
  ),
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
      { path: "/jobs", element: <JobsPage /> },
      {
        path: "/documents",
        element: <ProtectedRoute requiredRole="user" />,
        children: [{ index: true, element: <DocumentsPage /> }],
      },
    ],
  },
  {
    element: <MarketplaceLayout />,
    children: [
      { path: "/", element: <HomePage /> },
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
    element: <ProtectedRoute requiredRole="user" />,
    children: [
      {
        element: <CandidateLayout />,
        children: [
          { path: "/my-applications", element: <ApplicationsPage /> },
          { path: "/my-applications/:id", element: <ApplicationDetailPage /> },
        ],
      },
    ],
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
          { path: "job-postings", element: <JobPostingsPage /> },
          {
            path: "job-postings/:jobPostingId",
            element: <AdminJobPostingDetailPage />,
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
          {
            index: true,
            element: <Navigate replace to="/recruiter/job-postings" />,
          },
          { path: "job-postings", element: <RecruiterJobPostingsPage /> },
          {
            path: "job-postings/create",
            element: <RecruiterCreateJobPostingPage />,
          },
          {
            path: "job-postings/:jobPostingId",
            element: <RecruiterJobPostingDetailPage />,
          },
          {
            path: "job-postings/:jobPostingId/edit",
            element: <RecruiterEditJobPostingPage />,
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
