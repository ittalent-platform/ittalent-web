import {
  JobPostingCreatePage,
  JobPostingDetailPage,
  JobPostingEditPage,
  JobPostingListPage,
} from "@/features/job-postings/job-posting-management-pages";

export function RecruiterCreateJobPostingPage() {
  return <JobPostingCreatePage actor="recruiter" />;
}

export function RecruiterEditJobPostingPage() {
  return <JobPostingEditPage actor="recruiter" />;
}

export function RecruiterJobPostingDetailPage() {
  return <JobPostingDetailPage actor="recruiter" />;
}

export function RecruiterJobPostingsPage() {
  return <JobPostingListPage actor="recruiter" />;
}
