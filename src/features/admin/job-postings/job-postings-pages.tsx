import {
  JobPostingCreatePage,
  JobPostingDetailPage as SharedJobPostingDetailPage,
  JobPostingEditPage,
  JobPostingListPage,
} from "@/features/job-postings/job-posting-management-pages";

export function CreateJobPostingPage() {
  return <JobPostingCreatePage actor="admin" />;
}

export function EditJobPostingPage() {
  return <JobPostingEditPage actor="admin" />;
}

export function JobPostingDetailPage() {
  return <SharedJobPostingDetailPage actor="admin" />;
}

export function JobPostingsPage() {
  return <JobPostingListPage actor="admin" />;
}
