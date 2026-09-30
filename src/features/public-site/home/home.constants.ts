import {
  BarChart3,
  CheckCircle2,
  Cloud,
  Monitor,
  PenTool,
  Smartphone,
  type LucideIcon,
  Briefcase,
} from "lucide-react";

export const CAREER_PATH = "/career";
export const ENTERPRISES_PATH = "/enterprises";
export const REGISTER_PATH = "/register";
export const LOGIN_PATH = "/login";
/** Section id the header/footer "For employers" links scroll to. */
export const EMPLOYERS_ANCHOR = "employers";

/** Query-param keys the Jobs page (career-page) reads from the URL. */
export const SEARCH_PARAM = "search";
export const LOCATION_PARAM = "location";

export const HOME_JOBS_LIMIT = 100;
export const HOME_ENTERPRISES_LIMIT = 100;
export const LATEST_JOBS_COUNT = 6;
export const HERO_FLOATER_COUNT = 3;
export const TOP_COMPANIES_COUNT = 6;
export const SEARCH_KEYWORD_MAX = 100;
export const NEW_JOB_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export const HOME_STALE_TIME_MS = 60_000;
export const FIELD_COUNT_STALE_TIME_MS = 5 * 60_000;
export const SKELETON_CARD_COUNT = 6;

/** Quick searches under the hero search box. */
export const POPULAR_SEARCHES = [
  "React",
  "Java",
  "DevOps",
  "QA Automation",
  "Data Engineer",
  "Remote",
] as const;

export type Tone = "peach" | "blue" | "violet" | "green" | "amber";

/** Static class strings so Tailwind can see them. */
export const TONE_CLASSES: Record<
  Tone,
  { card: string; text: string; soft: string }
> = {
  peach: {
    card: "border-mkt-accent-border bg-mkt-accent-soft",
    text: "text-mkt-accent-hover",
    soft: "bg-mkt-accent-soft",
  },
  blue: {
    card: "border-mkt-blue-border bg-mkt-blue-bg",
    text: "text-mkt-blue-fg",
    soft: "bg-mkt-blue-bg",
  },
  violet: {
    card: "border-mkt-violet-border bg-mkt-violet-bg",
    text: "text-mkt-violet-fg",
    soft: "bg-mkt-violet-bg",
  },
  green: {
    card: "border-mkt-green-border bg-mkt-green-bg",
    text: "text-mkt-green-fg",
    soft: "bg-mkt-green-bg",
  },
  amber: {
    card: "border-mkt-amber-border bg-mkt-amber-bg",
    text: "text-mkt-amber-fg",
    soft: "bg-mkt-amber-bg",
  },
};

export const TONES = Object.keys(TONE_CLASSES) as Tone[];

export type FieldId =
  "frontend" | "mobile" | "devops" | "qa" | "data" | "design" | "product";

/** Tiles next to the large Backend tile; names, hints and search keywords live in `home.fields.<id>`. */
export const FIELDS: {
  id: FieldId;
  icon: LucideIcon;
  tone: Tone;
  wide?: boolean;
}[] = [
  { id: "frontend", icon: Monitor, tone: "blue" },
  { id: "mobile", icon: Smartphone, tone: "violet" },
  { id: "devops", icon: Cloud, tone: "green" },
  { id: "qa", icon: CheckCircle2, tone: "amber" },
  { id: "data", icon: BarChart3, tone: "peach", wide: true },
  { id: "design", icon: PenTool, tone: "blue" },
  { id: "product", icon: Briefcase, tone: "violet" },
];

export const BACKEND_TECH = ["Java", "Go", ".NET", "Node.js"] as const;

export const HERO_TAGS = [
  { label: "React", position: "right-[150px] top-0", tone: "blue" },
  { label: "Go", position: "right-5 top-[118px]", tone: "green" },
  { label: "DevOps", position: "bottom-[30px] right-0", tone: "violet" },
  {
    label: "QA Automation",
    position: "bottom-[150px] left-[30px]",
    tone: "amber",
  },
] as const satisfies readonly { label: string; position: string; tone: Tone }[];

export const HERO_FLOATER_POSITIONS = [
  "left-0 top-9",
  "right-0 top-[168px]",
  "bottom-[60px] left-3.5",
] as const;

export const STEP_NUMBERS = [1, 2, 3] as const;
