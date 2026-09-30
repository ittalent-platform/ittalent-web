# AI Agent Directives (AGENTS.md)

All AI agents and human developers working in `ittalent-web` MUST follow the structure, reuse and design rules below. `DESIGN.md` (repo root) is the source of truth for tokens, components and layout; read it before writing any UI.

## 1. Commands

Use **npm** (`package-lock.json`), not pnpm/bun.

```bash
npm run dev                 # Vite dev server (http://localhost:5173), API from VITE_API_URL (default http://localhost:3001)
npm run typecheck           # tsc -b
npm run lint                # eslint . (fails on hardcoded hex in className, non-alias imports)
npm test                    # vitest run
npx vitest run tests/applicant                 # one folder / file
npx vitest run -t "withdraw"                   # one test by name
npm run test:e2e            # Playwright: boots the real backend (:3101) + web (:5174) on a dedicated DB, seeds, runs tests/e2e (needs `docker compose up -d` in ../ittalent-backend)
npm run generate:client     # regenerate src/api/generated from openapi.json (never edit generated files by hand)
```

Run `typecheck`, `lint` and `test` before declaring work done; run `test:e2e` when a change crosses the BE/FE contract or touches the applicant flows.

## 2. Architecture

React 19 + Vite + TypeScript, Tailwind v4, Radix/shadcn primitives, React Router 7, TanStack Query, react-i18next (`en`, `vi`).

```text
src/
├── api/            # client.ts (auth, refresh), generated/ (openapi-ts output, read-only)
├── app/            # router.tsx (routes, lazy pages), providers.tsx
├── auth/           # session, ProtectedRoute
├── components/
│   ├── ui/         # Primitives (button, input, table, dialog, filter-select, view-toggle...)
│   ├── common/     # Reusable, feature-agnostic composites (see §4)
│   ├── layout/     # App shells: candidate, admin, public (header, sidebar, user-menu...)
│   └── toast/
├── config/         # env.ts, routes.ts (shared route paths)
├── features/<area>/<feature>/   # Vertical slices: admin/users, applicant/applications, auth, public-site
├── hooks/          # Shared hooks (use-list-params, use-debounced-value...)
├── lib/            # Pure helpers (format, display-id, utils...)
├── locales/{en,vi}/common.json
└── styles/globals.css           # ALL design tokens (see §5)
tests/<area>/       # Vitest unit/component tests, mirrors features; no *.test.tsx inside src/
e2e/                # Playwright specs (*.e2e.ts) against the real BE + FE; numbered files run in order and the mutating suite runs last
```

### Feature slice layout

Each feature folder owns its pages and logic, and nothing else's:

```text
features/<area>/<feature>/
├── <feature>-page.tsx          # Route component; composes common components, owns no styling primitives
├── <feature>-<part>.tsx        # Feature-specific parts (table, board, dialog, toolbar)
├── <feature>.constants.ts      # Statuses, tone maps, limits, query-param keys, timings
├── <feature>.queries.ts        # TanStack Query hooks over src/api/generated; the only place that calls the API
└── use-<feature>-params.ts     # URL-backed list state (built on hooks/use-list-params)
```

- Pages are lazy-loaded in `app/router.tsx`; protected areas sit under `ProtectedRoute` inside their layout.
- URL is the source of truth for list state (page, limit, search, filters, view) so links and reloads keep it.
- Never import from another feature. Anything needed by two features moves to `components/common`, `hooks`, `lib` or `config`.
- `components/` must not import from `features/`; shared route paths live in `config/routes.ts`.

## 3. Coding rules

- **Strict typing:** no `any`; derive types from `@/api/generated/types.gen` instead of redeclaring DTOs.
- **Imports:** always the `@/` alias (enforced by ESLint).
- **No hardcoded text:** every user-facing string goes through `t()` with keys added to BOTH `locales/en` and `locales/vi`. Use i18next plurals (`_one`/`_other`; Vietnamese only `_other`).
- **No magic values:** numbers, timings, limits, status lists, query-param keys and HTTP codes live in `*.constants.ts` (or `config/`).
- **No hardcoded colors:** never hex/rgb in `className`; use tokens (`bg-card`, `text-muted-foreground`, `bg-(--status-info-bg)`). ESLint blocks hex in `className`.
- **Dynamic inline `style`** only for runtime-computed values, marked with `/* dynamic: runtime value */`.
- **API errors:** surface them through `InlineErrorAlert`/`Callout`/toasts with a message saying what happened and what to do next; keep the server's `409` (version conflict) distinct from generic failure.
- **Tests** go in `tests/<area>/`, mock the feature's `*.queries` module, and assert on roles/labels, not class names.

## 4. Reuse first

Before creating a component, look in `components/ui`, `components/common`, `components/layout` and `hooks`. Extend an existing one with a prop rather than forking it. Existing building blocks:

| Need | Use |
|---|---|
| Page title + description + actions | `PageHeader` (`common/admin-page-header`) |
| Search + filters row | `ListToolbar` + `FilterSelect` / `FilterMultiSelect` + `ViewToggle` |
| Table / pagination / skeleton | `ui/table`, `ui/pagination`, `TableSkeletonRows` |
| Empty, error, inline notice | `EmptyState`, `ErrorState`, `Callout`, `InlineBanner` |
| Confirm dialog (any tone, optional body) | `ActionConfirmDialog` |
| Label / value lines | `DetailRow` (`layout="grid"` on detail pages) |
| Side-rail card, history | `RailCard`, `Timeline` (includes "View all" and message dialogs) |
| Progress through a pipeline | `Stepper` |
| Breadcrumb | `Breadcrumb` |
| Company mark, documents | `LogoTile`, `DocumentChip`, `DocumentTypeBadge` |
| Status | Feature badge built on the tint pairs in `constants` (word + colour) |
| App shells | `CandidateLayout`, admin `AppLayout`, `PublicLayout`; header parts `BrandLogo`, `MainNav`, `NotificationBell`, `UserMenu` |

If you add a reusable component, put it in `components/common` (feature-agnostic) and add a row to this table.

## 5. Design system (from DESIGN.md)

- **Tokens** are CSS variables in `styles/globals.css` (`:root`, `.itt-root`, `.candidate-root`, dark variants) exposed to Tailwind via `@theme inline`. Add new tokens there, with a dark value, and never inline the hex elsewhere.
- **Ember** (`primary`) fills one primary action per view, the active nav item and the focus ring. Body-size text never uses `primary`; links use `text-fg-link`. Candidate scope uses the darker Ember (`#d73c03`) so white 14px/600 labels stay AA.
- **Fonts:** Space Grotesk (`itt-display`) for titles/numbers/wordmark, Instrument Sans for everything else, mono (`itt-mono`) for record IDs (`APP-1029`).
- **Shapes:** controls and buttons 12px; cards 16px; pills only for the one page-level CTA, badges, toggles and avatars.
- **Borders, not shadows**, separate static surfaces. Shadows are for menus, dialogs and toasts.
- **Status is a word inside a tint pair**, never colour alone; status-change buttons are coloured by the action (Withdraw/Suspend/Delete = red).
- One `h1` per page; sentence-case titles and buttons; buttons are verb + object ("Withdraw application"); no emoji or icon fonts (Lucide only).
- Every job is shown with its company (logo, name).
- Match the reference screens in `DESIGN.md` and the Design-Doc HTML before inventing layout; when a design element has no API/data yet (notifications count, interview card), omit it rather than fake data.
