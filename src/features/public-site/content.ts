import {
  BadgeCheck,
  Code2,
  Globe2,
  Heart,
  Layers3,
  MonitorSmartphone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export type NewsCategory = "All" | "Company Blog" | "Press Releases" | "Industry Insights";
export type Department = "Engineering" | "Quality" | "Infrastructure" | "Design" | "Operations";

export type NewsArticle = {
  slug: string;
  cat: "Industry Insight" | "Company Blog" | "Press Release";
  title: string;
  excerpt: string;
  author: string;
  date: string;
  read: string;
  body: string[];
};

export type JobOpening = {
  slug: string;
  title: string;
  dept: Department;
  loc: string;
  type: string;
  level: string;
  salary: string;
  posted: string;
  headcount: number;
  deadline: string;
  address: string;
  overview: string;
  groups: { h: string; items: string[] }[];
  requirements: string[];
};

export const serviceCards = [
  {
    no: "01",
    icon: Code2,
    title: "Website",
    desc: "High-performance marketing sites, landing pages and corporate websites — built for conversion and speed.",
    list: ["React, Next.js, Tailwind CSS", "SEO & speed optimized", "Pixel-perfect responsive UI"],
    tags: ["Next.js", "React", "Tailwind CSS", "SEO", "Responsive"],
  },
  {
    no: "02",
    icon: MonitorSmartphone,
    title: "Application",
    desc: "Robust and secure custom web platforms, e-commerce architectures, and enterprise portals.",
    list: ["React, Node.js, PostgreSQL", "RESTful & GraphQL APIs", "Secure user authentication"],
    tags: ["Node.js", "Express", "GraphQL", "Postgres", "OAuth2"],
  },
  {
    no: "03",
    icon: Layers3,
    title: "Cloud & DevOps",
    desc: "Automated scaling, high-availability deployments, serverless functions, and continuous delivery.",
    list: ["AWS, Docker, Kubernetes", "CI/CD pipeline setup", "Monitoring & logging"],
    tags: ["AWS", "Docker", "Kubernetes", "CI/CD", "Prometheus"],
  },
  {
    no: "04",
    icon: ShieldCheck,
    title: "QA & Testing",
    desc: "Comprehensive manual and automated software testing suites ensuring bug-free releases.",
    list: ["Playwright, Cypress, Jest", "Integration & unit testing", "Continuous quality checks"],
    tags: ["Playwright", "Cypress", "Jest", "TDD", "QA Automation"],
  },
];

export const processSteps = [
  {
    no: "01/04",
    title: "Strategy",
    desc: "We get to know you and your brand. Goals, audience, competition. Out of that comes the roadmap everything else stands on.",
    bullets: ["Stakeholder workshops", "Competitor gap analysis", "Tech feasibility study", "Project scope blueprint"],
  },
  {
    no: "02/04",
    title: "Design",
    desc: "Identity, interface, prototype. This is where the brand becomes visible — from logo to the last pixel of the site.",
    bullets: ["Interactive Figma prototypes", "UX wireframing", "Design system mapping", "Responsive components"],
  },
  {
    no: "03/04",
    title: "Build",
    desc: "Engineering on a modern stack: Next.js, React, performance-first. Clean code that scales and still runs in five years.",
    bullets: ["Type-safe React & Next.js", "REST & GraphQL APIs", "Automated QA coverage", "Optimized asset loading"],
  },
  {
    no: "04/04",
    title: "Launch & Care",
    desc: "Deployment, monitoring, continuous optimization. We stay on it — your brand grows, and we grow with it.",
    bullets: ["CI/CD deployment", "AWS cloud scaling", "24/7 monitoring", "Monthly optimization"],
  },
];

export const brands = ["Webflow", "Relume", "Stripe", "Vercel", "Slack", "Shopify"];

export const faqItems = [
  {
    q: "Who owns the software intellectual property (IP)?",
    a: "You do. Under our standard Master Services Agreement (MSA), 100% of the intellectual property, code repositories, documentation, and cloud architecture assets are owned by and transferred to your business immediately upon invoice clearance.",
  },
  {
    q: "How does day-to-day communication work?",
    a: "We integrate directly into your workflow with shared Slack or Teams channels, sprint demos, and Jira / Trello / Linear. Our developers and project managers communicate fluently in English.",
  },
  {
    q: "Can I scale the team up or down based on load?",
    a: "Absolutely. We require only 30 days notice to scale your dedicated engineering team up or down depending on launch milestones and workload.",
  },
  {
    q: "What is your quality assurance and compliance policy?",
    a: "We embed manual and automated QA into every squad, with CI/CD, linting, unit tests, end-to-end integration tests, and security-conscious delivery practices.",
  },
];

export const newsArticles: NewsArticle[] = [
  {
    slug: "the-2026-stack-what-hiring-managers-actually-screen-for",
    cat: "Industry Insight",
    title: "The 2026 stack: what hiring managers actually screen for",
    excerpt: "A breakdown of the skills, signals, and take-home patterns that move candidates forward this year.",
    author: "Mai Tran",
    date: "2026.06.20",
    read: "6 min",
    body: [
      "For the past two quarters, our delivery squads have been measured against the metrics that matter most to clients — on-time delivery, defect escape rate, and retention.",
      "The numbers tell a clear story about how a transparent, ownership-driven culture compounds into results.",
      "This piece breaks down what changed, the practices behind it, and what it means for teams planning their next phase of growth across the region.",
    ],
  },
  {
    slug: "inside-our-qa-automation-guild-from-flaky-to-ironclad",
    cat: "Company Blog",
    title: "Inside our QA automation guild: from flaky to ironclad",
    excerpt: "How we cut flaky test rates by 80% and made green builds something the whole team trusts again.",
    author: "Khoa Le",
    date: "2026.06.18",
    read: "5 min",
    body: [
      "The QA guild focused on deterministic test data, shorter feedback loops, and simpler ownership boundaries.",
      "The result was less time spent firefighting and more time spent shipping with confidence.",
    ],
  },
  {
    slug: "ittalent-opens-a-new-delivery-hub-in-da-nang",
    cat: "Press Release",
    title: "ITTalent opens a new delivery hub in Da Nang",
    excerpt: "Our third engineering site adds capacity for cloud and mobile squads across the central region.",
    author: "Newsroom",
    date: "2026.06.15",
    read: "3 min",
    body: [
      "The new hub expands coverage for cloud and mobile delivery while keeping the same quality standards across every team.",
      "It also adds more capacity for APAC-aligned support windows.",
    ],
  },
  {
    slug: "react-vs-react-native-talent-where-the-gap-is-widening",
    cat: "Industry Insight",
    title: "React vs React Native talent: where the gap is widening",
    excerpt: "Demand data from the last two quarters and what it means for teams planning 2027 headcount.",
    author: "Mai Tran",
    date: "2026.06.11",
    read: "7 min",
    body: [
      "Hiring demand is widening between web-only and mobile-capable engineers.",
      "Teams increasingly want people who can think in systems, not isolated stacks.",
    ],
  },
  {
    slug: "how-we-onboard-an-engineer-in-14-days",
    cat: "Company Blog",
    title: "How we onboard an engineer in 14 days",
    excerpt: "The exact playbook — environment, pairing cadence, and first-feature milestones we use every time.",
    author: "Linh Pham",
    date: "2026.06.07",
    read: "4 min",
    body: [
      "A focused two-week ramp gives new engineers real context, faster ownership, and clearer expectations.",
      "We use pairing, quick documentation, and one small production feature to anchor the process.",
    ],
  },
  {
    slug: "partnership-with-apac-fintech-leader-announced",
    cat: "Press Release",
    title: "Partnership with APAC fintech leader announced",
    excerpt: "A multi-year engagement to build and scale a regional payments platform from the ground up.",
    author: "Newsroom",
    date: "2026.06.02",
    read: "2 min",
    body: [
      "The engagement spans web, mobile, and cloud delivery for a regional payments platform.",
      "It expands the footprint of the ITTalent delivery model across APAC.",
    ],
  },
];

const detailMap: Record<string, JobOpening> = {
  "senior-react-engineer": {
    slug: "senior-react-engineer",
    title: "Senior React Engineer",
    dept: "Engineering",
    loc: "Remote · Vietnam",
    type: "Full-time",
    level: "Senior",
    salary: "$3,500–5,000",
    posted: "2d ago",
    headcount: 2,
    deadline: "2026-07-31",
    address: "Remote-first · ITTalent HQ, 600 Nguyen Van Cu noi dai, Ninh Kieu, Can Tho",
    overview:
      "As a Senior React Engineer you will lead front-end delivery for international product squads — owning architecture, mentoring mid-level engineers, and setting the quality bar for everything we ship.",
    groups: [
      {
        h: "Engineering & delivery",
        items: [
          "Design, build, and ship production React applications end-to-end for international clients.",
          "Own front-end architecture decisions and document them clearly for the squad.",
          "Drive performance, accessibility, and testing standards across the codebase.",
          "Review code and pair across guilds to keep quality high and knowledge shared.",
        ],
      },
      {
        h: "Collaboration & ownership",
        items: [
          "Work directly with clients and PMs on scope, estimates, and trade-offs.",
          "Mentor mid and junior engineers through pairing and structured feedback.",
          "Contribute to our shared component library and internal engineering playbook.",
        ],
      },
    ],
    requirements: [
      "5+ years building production web applications, 3+ with React and TypeScript.",
      "Deep understanding of state management, performance, and modern build tooling.",
      "Strong testing discipline (unit, integration, e2e) and CI/CD familiarity.",
      "Comfortable with ambiguity and direct, written English client communication.",
      "Experience mentoring engineers or leading a small squad is a strong plus.",
    ],
  },
  "react-native-developer": {
    slug: "react-native-developer",
    title: "React Native Developer",
    dept: "Engineering",
    loc: "Can Tho · Hybrid",
    type: "Full-time",
    level: "Mid",
    salary: "$2,200–3,400",
    posted: "3d ago",
    headcount: 3,
    deadline: "2026-07-24",
    address: "ITTalent HQ, 600 Nguyen Van Cu noi dai, Ninh Kieu, Can Tho",
    overview:
      "Join our mobile guild building cross-platform React Native apps for clients across APAC, working hybrid from our Can Tho HQ with a focus on smooth, reliable mobile experiences.",
    groups: [
      {
        h: "Mobile development",
        items: [
          "Build and ship cross-platform mobile features with React Native and TypeScript.",
          "Integrate native modules and third-party SDKs (payments, maps, notifications).",
          "Optimize app performance, startup time, and offline behavior.",
          "Maintain release pipelines for the App Store and Google Play.",
        ],
      },
      {
        h: "Quality & teamwork",
        items: [
          "Write tests and participate in code reviews across the mobile guild.",
          "Collaborate with designers to translate Figma flows into polished UI.",
          "Support QA on reproducing and fixing production issues.",
        ],
      },
    ],
    requirements: [
      "2+ years shipping React Native apps to production (iOS and Android).",
      "Solid JavaScript/TypeScript fundamentals and React mental model.",
      "Experience with native build tooling, debugging, and store submissions.",
      "Good command of English and a collaborative, proactive attitude.",
    ],
  },
  "qa-automation-engineer": {
    slug: "qa-automation-engineer",
    title: "QA Automation Engineer",
    dept: "Quality",
    loc: "Remote",
    type: "Full-time",
    level: "Mid",
    salary: "$1,800–2,800",
    posted: "5d ago",
    headcount: 2,
    deadline: "2026-07-20",
    address: "Remote-first · ITTalent HQ, Can Tho",
    overview:
      "Own the automated quality story across our delivery squads — turning flaky, manual checks into a fast, trustworthy suite that the whole team relies on every day.",
    groups: [
      {
        h: "Test automation",
        items: [
          "Design and maintain automated test suites (UI, API, and integration).",
          "Build and improve CI pipelines so green builds are fast and trustworthy.",
          "Identify flaky tests and drive them to reliable, deterministic outcomes.",
          "Define test strategy alongside engineers from the start of each feature.",
        ],
      },
      {
        h: "Quality partnership",
        items: [
          "Partner with squads on test coverage, risk areas, and release readiness.",
          "Report quality metrics and trends to engineering leads and clients.",
          "Coach engineers on testing best practices and tooling.",
        ],
      },
    ],
    requirements: [
      "2+ years in QA automation with tools like Playwright, Cypress, or Selenium.",
      "Strong scripting skills (JavaScript/TypeScript or Python) and API testing.",
      "Hands-on CI/CD experience and a sharp eye for edge cases.",
      "Clear written English for documenting issues and test reports.",
    ],
  },
  "devops-cloud-engineer": {
    slug: "devops-cloud-engineer",
    title: "DevOps / Cloud Engineer",
    dept: "Infrastructure",
    loc: "Da Nang · On-site",
    type: "Full-time",
    level: "Senior",
    salary: "$3,000–4,500",
    posted: "1w ago",
    headcount: 1,
    deadline: "2026-07-18",
    address: "ITTalent Hub, Hai Chau District, Da Nang",
    overview:
      "Lead the cloud and infrastructure foundation for our client projects from our Da Nang hub — building secure, scalable, and observable platforms our engineers can ship on with confidence.",
    groups: [
      {
        h: "Infrastructure & platform",
        items: [
          "Design and operate cloud infrastructure (AWS/GCP) using Infrastructure as Code.",
          "Build and harden CI/CD pipelines, container orchestration, and deployments.",
          "Own observability — logging, metrics, alerting, and incident response.",
          "Drive security, cost optimization, and reliability best practices.",
        ],
      },
      {
        h: "Enablement",
        items: [
          "Partner with squads to streamline their build, test, and release workflows.",
          "Document runbooks and mentor engineers on platform tooling.",
          "Lead post-incident reviews and continuous improvement.",
        ],
      },
    ],
    requirements: [
      "4+ years in DevOps/SRE/Cloud roles running production workloads.",
      "Strong with Terraform, Docker, Kubernetes, and at least one major cloud.",
      "Scripting fluency and a security-first, automation-first mindset.",
      "On-site availability in Da Nang and good English communication.",
    ],
  },
  "product-designer": {
    slug: "product-designer",
    title: "Product Designer",
    dept: "Design",
    loc: "Remote · APAC",
    type: "Full-time",
    level: "Mid",
    salary: "$2,400–3,600",
    posted: "1w ago",
    headcount: 1,
    deadline: "2026-07-28",
    address: "Remote-first · APAC timezones",
    overview:
      "Shape the end-to-end product experience for our client work — from research and flows to polished, accessible interfaces — as a remote-first member of our design guild.",
    groups: [
      {
        h: "Product design",
        items: [
          "Design user flows, wireframes, and high-fidelity UI for web and mobile.",
          "Run lightweight research and usability testing to validate decisions.",
          "Contribute to and evolve our shared design system and component library.",
          "Partner closely with engineers to ensure faithful, accessible implementation.",
        ],
      },
      {
        h: "Collaboration",
        items: [
          "Present and defend design decisions to clients and stakeholders.",
          "Collaborate with PMs to balance user needs, scope, and timelines.",
          "Maintain clear, well-organized design files and handoff specs.",
        ],
      },
    ],
    requirements: [
      "3+ years in product/UX design with a strong portfolio of shipped work.",
      "Fluent in Figma and modern design-system practices.",
      "Solid grasp of interaction, accessibility, and responsive design.",
      "Good English and the ability to work async across APAC timezones.",
    ],
  },
  "engineering-intern": {
    slug: "engineering-intern",
    title: "Engineering Intern",
    dept: "Engineering",
    loc: "Can Tho · On-site",
    type: "Internship",
    level: "Entry",
    salary: "$500–800",
    posted: "2w ago",
    headcount: 4,
    deadline: "2026-07-16",
    address: "ITTalent HQ, 600 Nguyen Van Cu noi dai, Ninh Kieu, Can Tho",
    overview:
      "A hands-on internship for final-year students who want to learn how real software gets built and shipped — with mentorship, real project work, and a clear path to a full-time offer.",
    groups: [
      {
        h: "Learn by doing",
        items: [
          "Pair with senior engineers on real features for client projects.",
          "Write code, tests, and documentation under structured mentorship.",
          "Participate in stand-ups, code reviews, and squad ceremonies.",
          "Complete a capstone project presented to the engineering team.",
        ],
      },
      {
        h: "Grow",
        items: [
          "Receive regular feedback and a personalized learning plan.",
          "Attend internal training on engineering fundamentals and tooling.",
          "Build a portfolio of real, production-adjacent work.",
        ],
      },
    ],
    requirements: [
      "Third- or fourth-year students in Computer Science or related fields.",
      "Solid programming fundamentals and genuine curiosity to learn.",
      "Familiarity with one modern language and basic web/git concepts.",
      "Able to commit 3–4 days per week (Mon–Fri); good English is a plus.",
    ],
  },
};

export const jobsData = [
  detailMap["senior-react-engineer"],
  detailMap["react-native-developer"],
  detailMap["qa-automation-engineer"],
  detailMap["devops-cloud-engineer"],
  detailMap["product-designer"],
  detailMap["engineering-intern"],
];

export const perks = [
  {
    n: "01",
    icon: BadgeCheck,
    title: "Transparent pay bands",
    desc: "Published ranges on every role — no negotiation games, no surprises. You always know exactly where you stand.",
    variant: "orange" as const,
    span: true,
  },
  { n: "02", icon: Sparkles, title: "Real ownership, fast", desc: "Ship features end-to-end and talk to clients directly from week one.", variant: "dark" as const },
  { n: "03", icon: Globe2, title: "Remote-first, APAC hours", desc: "Work from anywhere in the region with sane, overlapping core hours.", variant: "plain" as const },
  { n: "04", icon: MonitorSmartphone, title: "Paid learning budget", desc: "Annual stipend for courses, certs, and conferences — your call.", variant: "plain" as const },
  { n: "05", icon: Heart, title: "Full health coverage", desc: "Comprehensive medical for you and your immediate family.", variant: "plain" as const },
  { n: "06", icon: Users, title: "Mentorship guilds", desc: "Cross-team pairing and a senior mentor matched to your growth path.", variant: "plain" as const },
];

export const team = [
  { name: "Mai Tran", role: "Engineering Lead" },
  { name: "Khoa Le", role: "QA Guild Master" },
  { name: "Linh Pham", role: "People & Culture" },
  { name: "Duc Nguyen", role: "Cloud Architect" },
  { name: "Anh Vo", role: "Mobile Lead" },
  { name: "Thu Hoang", role: "Product Designer" },
];

export const newsFilters: NewsCategory[] = ["All", "Company Blog", "Press Releases", "Industry Insights"];
export const departmentFilters: Department[] = ["Engineering", "Quality", "Infrastructure", "Design", "Operations"];

export function getArticleBySlug(slug?: string) {
  if (!slug) return newsArticles[0];
  return newsArticles.find((item) => item.slug === slug) ?? newsArticles[0];
}

export function getJobBySlug(slug?: string) {
  if (!slug) return jobsData[0];
  return jobsData.find((item) => item.slug === slug) ?? jobsData[0];
}

