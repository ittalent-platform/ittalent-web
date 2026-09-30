import { JobPostingDetailPage } from "@/features/job-postings/job-posting-detail-page";
import { JobPostingCreatePage, JobPostingEditPage } from "@/features/job-postings/job-posting-editor-pages";
import { JobPostingListPage } from "@/features/job-postings/job-posting-list-page";

export function RecruiterCreateJobPostingPage() {
  return <JobPostingCreatePage />;
}

export function RecruiterEditJobPostingPage() {
  return <JobPostingEditPage />;
}

export function RecruiterJobPostingDetailPage() {
  return <JobPostingDetailPage actor="recruiter" />;
}

export function RecruiterJobPostingsPage() {
  return <JobPostingListPage actor="recruiter" />;
}
