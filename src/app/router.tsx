import { CandidateAccountLayout } from "@/components/layout/candidate-account-layout";
import { CertificatesPage } from "@/features/certificates/certificates-page";
import { lazy, Suspense } from "react";
import { Navigate, createBrowserRouter, RouterProvider, useLocation } from "react-router";

import { ProtectedRoute } from "@/auth/protected-route";
import { JOB_POSTING_MANAGER_ROLES, JOB_POSTING_WRITER_ROLES } from "@/auth/roles";
import { AppLayout } from "@/components/layout/admin-layout";
import { MarketplaceLayout } from "@/components/layout/marketplace-layout";
import { CandidateLayout } from "@/components/layout/candidate-layout";
import { LoadingScreen } from "@/components/common/loading-screen";
import { EMAIL_VERIFICATION_PATH } from "@/config/routes";
import { HomePage } from "@/features/public-site/home/home-page";

const LoginPage = lazy(() =>
  import("@/features/auth/login-page").then((m) => ({ default: m.LoginPage })),
);
const ProfilePage = lazy(() => import("@/features/profile/profile-page").then((m) => ({ default: m.ProfilePage })));
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
const RegisterCompanyPage = lazy(() =>
  import("@/features/enterprise-registration/pages/register-company-page").then(
    (m) => ({
      default: m.RegisterCompanyPage,
    }),
  ),
);
const AcceptRegistrationInvitationPage = lazy(() =>
  import("@/features/enterprise-registration/pages/accept-registration-invitation-page").then(
    (m) => ({
      default: m.AcceptRegistrationInvitationPage,
    }),
  ),
);
const AcceptInvitationPage = lazy(() =>
  import("@/features/auth/accept-invitation-page").then((m) => ({ default: m.AcceptInvitationPage })),
);
const ConfirmEmailChangePage = lazy(() =>
  import("@/features/auth/confirm-email-change-page").then((m) => ({ default: m.ConfirmEmailChangePage })),
);
const AdminDashboardPage = lazy(() =>
  import("@/features/admin/dashboard/admin-dashboard-page").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);
const RecruiterDashboardPage = lazy(() =>
  import("@/features/recruiter/dashboard/dashboard-page").then((m) => ({
    default: m.DashboardPage,
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
const AdminUserHistoryPage = lazy(() =>
  import("@/features/admin/users/user-history-page").then((m) => ({ default: m.AdminUserHistoryPage })),
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
const BroadcastNotificationsPage = lazy(() =>
  import("@/features/admin/broadcast-notifications").then((m) => ({
    default: m.BroadcastNotificationsPage,
  })),
);
const MyReportsPage = lazy(() =>
  import("@/features/reports").then((m) => ({
    default: m.MyReportsPage,
  })),
);
const AdminReportsPage = lazy(() =>
  import("@/features/reports").then((m) => ({
    default: m.AdminReportsPage,
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
const RecruiterInterviewsPage = lazy(() =>
  import("@/features/recruiter/interviews/interviews-page").then((m) => ({
    default: m.InterviewsPage,
  })),
);
const RecruiterInterviewDetailPage = lazy(() =>
  import("@/features/recruiter/interviews/interview-detail-page").then((m) => ({
    default: m.InterviewDetailPage,
  })),
);
const RecruiterApplicationsPage = lazy(() =>
  import("@/features/recruiter/applications/applications-page").then((m) => ({
    default: m.ApplicationsPage,
  })),
);
const RecruiterApplicationDetailPage = lazy(() =>
  import(
    "@/features/recruiter/applications/detail/recruiter-application-detail-page"
  ).then((m) => ({
    default: m.RecruiterApplicationDetailPage,
  })),
);
const RecruiterEmployeesPage = lazy(() =>
  import("@/features/recruiter/employees/employees-page").then((m) => ({
    default: m.RecruiterEmployeesPage,
  })),
);
const RecruiterEmployeeDetailPage = lazy(() =>
  import("@/features/recruiter/employees/employee-detail-page").then((m) => ({
    default: m.RecruiterEmployeeDetailPage,
  })),
);
const RecruiterCompanyProfilePage = lazy(() =>
  import("@/features/recruiter/company-profile/company-profile-page").then(
    (m) => ({
      default: m.RecruiterCompanyProfilePage,
    }),
  ),
);
const RecruiterEditCompanyProfilePage = lazy(() =>
  import("@/features/recruiter/company-profile/edit-company-profile-page").then(
    (m) => ({
      default: m.RecruiterEditCompanyProfilePage,
    }),
  ),
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
const NotificationCenterPage = lazy(() =>
  import("@/features/notifications/pages/notification-center-page").then(
    (m) => ({ default: m.NotificationCenterPage }),
  ),
);
const SavedJobsPage = lazy(() =>
  import("@/features/applicant/saved-jobs/saved-jobs-page").then((m) => ({
    default: m.SavedJobsPage,
  })),
);
const EnterprisesPage = lazy(() =>
  import("@/features/admin/enterprises/enterprises-page").then((m) => ({
    default: m.EnterprisesPage,
  })),
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
const AdminRegistrationsPage = lazy(() =>
  import("@/features/admin/registrations").then((m) => ({
    default: m.RegistrationsPage,
  })),
);
const AdminRegistrationDetailPage = lazy(() =>
  import("@/features/admin/registrations").then((m) => ({
    default: m.RegistrationDetailPage,
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
  { path: "/register-company", element: <RegisterCompanyPage /> },
  // The confirmation email links here (APP_BASE_URL/enterprise-registration/verify?token=...).
  { path: "/enterprise-registration/verify", element: <RedirectKeepingSearch to="/register-company" /> },
  { path: "/enterprise-registration/invitation", element: <AcceptRegistrationInvitationPage /> },
  { path: EMAIL_VERIFICATION_PATH, element: <EmailVerificationPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/accept-invitation", element: <AcceptInvitationPage /> },
  { path: "/confirm-email-change", element: <ConfirmEmailChangePage /> },
  {
    element: <ProtectedRoute requiredRole="user" />,
    children: [
      {
        element: <CandidateLayout />,
        children: [
          {
            element: <CandidateAccountLayout />,
            handle: { hideFooter: true },
            children: [
              { path: "documents", element: <DocumentsPage /> },
              { path: "profile", element: <ProfilePage /> },
              { path: "profile/password", element: <ProfilePage /> },
              { path: "my-applications", element: <ApplicationsPage /> },
              {
                path: "my-applications/:id",
                element: <ApplicationDetailPage />,
              },
              { path: "saved-jobs", element: <SavedJobsPage /> },
              { path: "certificates", element: <CertificatesPage /> },
              { path: "my-reports", element: <MyReportsPage /> },
              { path: "notifications", element: <NotificationCenterPage /> },
              { path: "account/notifications", element: <Navigate replace to="/notifications" /> },
            ],
          },
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
          { path: "dashboard", element: <AdminDashboardPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "profile/password", element: <ProfilePage /> },
          { path: "users/:userId", element: <AdminUserDetailPage /> },
          { path: "users/:userId/history", element: <AdminUserHistoryPage /> },
          { path: "enterprises", element: <EnterprisesPage /> },
          { path: "enterprises/new", element: <EnterpriseFormPage /> },
          { path: "registrations", element: <AdminRegistrationsPage /> },
          {
            path: "registrations/:registrationId",
            element: <AdminRegistrationDetailPage />,
          },
          {
            path: "enterprises/:enterpriseId",
            element: <AdminEnterpriseDetailPage />,
          },
          {
            path: "enterprises/:enterpriseId/edit",
            element: <EnterpriseFormPage />,
          },
          { path: "job-postings", element: <JobPostingsPage /> },
          {
            path: "job-postings/:jobPostingId",
            element: <AdminJobPostingDetailPage />,
          },
          {
            path: "broadcast-notifications",
            element: <BroadcastNotificationsPage />,
          },
          {
            path: "reports",
            element: <AdminReportsPage />,
          },
        ],
      },
    ],
  },
  {
    path: "/recruiter",
    element: <ProtectedRoute requiredRoles={JOB_POSTING_MANAGER_ROLES} />,
    children: [
      {
        element: <AppLayout actor="recruiter" />,
        children: [
          {
            index: true,
            element: <Navigate replace to="/recruiter/job-postings" />,
          },
          { path: "dashboard", element: <RecruiterDashboardPage /> },
          { path: "job-postings", element: <RecruiterJobPostingsPage /> },
          { path: "my-profile", element: <ProfilePage /> },
          { path: "my-profile/password", element: <ProfilePage /> },
          {
            element: <ProtectedRoute requiredRoles={JOB_POSTING_WRITER_ROLES} />,
            children: [
              {
                path: "job-postings/create",
                element: <RecruiterCreateJobPostingPage />,
              },
              {
                path: "job-postings/:jobPostingId/edit",
                element: <RecruiterEditJobPostingPage />,
              },
            ],
          },
          {
            path: "job-postings/:jobPostingId",
            element: <RecruiterJobPostingDetailPage />,
          },
          { path: "applications", element: <RecruiterApplicationsPage /> },
          {
            path: "applications/:applicationId",
            element: <RecruiterApplicationDetailPage />,
          },
          { path: "interviews", element: <RecruiterInterviewsPage /> },
          {
            path: "interviews/:interviewId",
            element: <RecruiterInterviewDetailPage />,
          },
          { path: "employees", element: <RecruiterEmployeesPage /> },
          {
            path: "employees/:employeeId",
            element: <RecruiterEmployeeDetailPage />,
          },
          { path: "company-profile", element: <RecruiterCompanyProfilePage /> },
          {
            path: "company-profile/edit",
            element: <RecruiterEditCompanyProfilePage />,
          },
          {
            path: "profile/edit",
            element: <Navigate replace to="/recruiter/company-profile/edit" />,
          },
          {
            path: "profile",
            element: <Navigate replace to="/recruiter/company-profile" />,
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

/** Sends an old or emailed path to its current page, keeping the query string (e.g. the verification token). */
function RedirectKeepingSearch({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate replace to={{ pathname: to, search }} />;
}

const router = createBrowserRouter(appRoutes);

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
