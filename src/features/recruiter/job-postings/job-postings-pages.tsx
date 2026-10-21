import { useSession } from "@/auth/use-session";
import { JobPostingDetailPage } from "@/features/job-postings/job-posting-detail-page";
import { JobPostingCreatePage, JobPostingEditPage } from "@/features/job-postings/job-posting-editor-pages";
import { JobPostingListPage } from "@/features/job-postings/job-posting-list-page";

// Enterprise administrators share the recruiter screens but only read them (UC-JOB-04 / UC-S2-JOB-04, Ent Admin variant).
function useIsEnterpriseAdmin() {
  return useSession().data?.user.role === "enterprise_admin";
}

export function RecruiterCreateJobPostingPage() {
  return <JobPostingCreatePage />;
}

export function RecruiterEditJobPostingPage() {
  return <JobPostingEditPage />;
}

export function RecruiterJobPostingDetailPage() {
  return <JobPostingDetailPage actor="recruiter" readOnly={useIsEnterpriseAdmin()} />;
}

export function RecruiterJobPostingsPage() {
  return <JobPostingListPage actor="recruiter" readOnly={useIsEnterpriseAdmin()} />;
}
