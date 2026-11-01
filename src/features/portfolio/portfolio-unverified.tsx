import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Callout } from "@/components/common/callout";
import { ResendBanners } from "@/components/common/resend-banners";
import { Button } from "@/components/ui/button";
import { useResendVerification } from "@/hooks/use-resend-verification";

/**
 * What an account whose email isn't verified yet sees instead of the list: managing links needs a verified account
 * (UC-S4-PORT-01 precondition), so it says so and offers the link again rather than a form the server would refuse.
 */
export function PortfolioUnverified({ email }: { email: string }) {
  const { t } = useTranslation();
  const resend = useResendVerification();
  return (
    <div className="flex flex-col gap-3">
      <Callout
        action={
          <Button className="h-[34px] px-[18px] text-sm font-semibold" disabled={resend.cooling || resend.loading} onClick={() => void resend.resend(email)} shape="pill" type="button" variant="outline">
            {resend.label(t("portfolio.unverified.resend"))}
          </Button>
        }
        icon={Mail}
        role="status"
        title={t("portfolio.unverified.title")}
        tone="warning"
      >
        {t("portfolio.unverified.description", { email })}
      </Callout>
      <ResendBanners resend={resend} />
    </div>
  );
}
