import { useTranslation } from "react-i18next";

export function NotificationCenterPage() {
  const { t } = useTranslation();
  return (
    <div data-testid="notification-center-page">
      <h1 className="font-['Space_Grotesk'] text-[24px] sm:text-[26px] font-semibold text-foreground">
        {t("notifications.title", { defaultValue: "Notifications" })}
      </h1>
    </div>
  );
}
