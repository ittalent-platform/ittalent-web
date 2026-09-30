import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { requestErrorMessage, requestStatus } from "@/api/request-error";
import { ErrorState } from "@/components/common/error-state";

import { jobPostingErrorMessage } from "./job-posting-errors";

const OTHER_ENTERPRISE_MESSAGE = "Job posting belongs to another enterprise";
const HTTP_FORBIDDEN = 403;
const HTTP_NOT_FOUND = 404;

export function JobPostingErrorState({
  backTo,
  error,
}: {
  backTo: string;
  error: unknown;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = requestStatus(error);
  const description =
    status === HTTP_FORBIDDEN &&
    requestErrorMessage(error) === OTHER_ENTERPRISE_MESSAGE
      ? t("jobPostings.detail.otherEnterprise")
      : jobPostingErrorMessage(error, t);
  return (
    <ErrorState
      description={description}
      secondaryAction={{
        label: t("jobPostings.detail.back"),
        onClick: () => navigate(backTo),
      }}
      title={
        status === HTTP_NOT_FOUND
          ? t("jobPostings.detail.notFoundTitle")
          : status === HTTP_FORBIDDEN
            ? t("jobPostings.detail.accessDenied")
            : t("jobPostings.detail.loadFailedTitle")
      }
    />
  );
}
