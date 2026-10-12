import {
  Briefcase,
  Building2,
  Clock,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { TONE_CLASSES, type Tone } from "./home.constants";
import { useHomeData } from "./home.queries";

export function HomeStats() {
  const { t } = useTranslation();
  const { data } = useHomeData();
  const stats: {
    key: string;
    value: number | undefined;
    icon: LucideIcon;
    tone: Tone;
  }[] = [
    { key: "openJobs", value: data?.totalJobs, icon: Briefcase, tone: "peach" },
    {
      key: "companies",
      value: data?.hiringCompanies,
      icon: Building2,
      tone: "blue",
    },
    {
      key: "newThisWeek",
      value: data?.newThisWeek,
      icon: Clock,
      tone: "green",
    },
    { key: "cities", value: data?.cities.length, icon: MapPin, tone: "violet" },
  ];

  return (
    <section
      aria-label={t("home.stats.label")}
      className="relative z-[2] mx-4 -mt-[60px] grid grid-cols-2 gap-y-6 rounded-[20px] border border-mkt-line bg-white px-2 py-[26px] shadow-[0_10px_24px_rgba(25,25,28,0.1)] md:mx-12 lg:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <div
          className={cn(
            "flex items-center gap-4 px-4 md:px-7",
            index > 0 && "lg:border-l lg:border-mkt-line-soft",
          )}
          key={stat.key}
        >
          <span
            className={cn(
              "flex size-[52px] shrink-0 items-center justify-center rounded-2xl",
              TONE_CLASSES[stat.tone].soft,
              TONE_CLASSES[stat.tone].text,
            )}
          >
            <stat.icon aria-hidden className="size-6" />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="itt-display text-[28px] font-bold leading-[1.1]">
              {stat.value ?? "–"}
            </span>
            <span className="text-[13px] text-mkt-ink-2">
              {t(`home.stats.${stat.key}`)}
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
