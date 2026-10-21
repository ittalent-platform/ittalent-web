import { useSession } from "@/auth/use-session";
import { JobPostingDetailPage } from "@/features/job-postings/job-posting-detail-page";
import { JobPostingCreatePage, JobPostingEditPage } from "@/features/job-postings/job-posting-editor-pages";
import { JobPostingListPage } from "@/features/job-postings/job-posting-list-page";
import { JobPostingReadOnlyDetailPage } from "@/features/job-postings/job-posting-read-only-detail-page";
import { JobPostingReadOnlyListPage } from "@/features/job-postings/job-posting-read-only-list-page";

// Enterprise administrators only read their company's job postings (UC-JOB-04 / UC-S2-JOB-04, Ent Admin variant).
function useSessionUser() {
  return useSession().data?.user;
}

export function RecruiterCreateJobPostingPage() {
  return <JobPostingCreatePage />;
}

export function RecruiterEditJobPostingPage() {
  return <JobPostingEditPage />;
}

export function RecruiterJobPostingDetailPage() {
  return useSessionUser()?.role === "enterprise_admin" ? (
    <JobPostingReadOnlyDetailPage />
  ) : (
    <JobPostingDetailPage actor="recruiter" />
  );
}

export function RecruiterJobPostingsPage() {
  const user = useSessionUser();
  return user?.role === "enterprise_admin" ? (
    <JobPostingReadOnlyListPage companyName={user.enterpriseName} />
  ) : (
    <JobPostingListPage actor="recruiter" />
  );
}
