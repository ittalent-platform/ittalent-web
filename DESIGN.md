---
name: ITTalent
description: Warm, plain and exact design system for a multi-company IT recruitment marketplace in Vietnam, with dense admin and employer workspaces and a public candidate site.
colors:
  ember: "#f2470c"
  ember-hover: "#d73c03"
  ember-panel: "#cf3a05"
  ember-wash: "#fde8e0"
  ember-tint: "#fef3ee"
  ember-border: "#f0b4a0"
  ember-link: "#b33305"
  on-ember: "#ffffff"
  canvas: "#fafaf8"
  paper: "#ffffff"
  sand: "#f1efea"
  sand-hover: "#f7f5f1"
  sand-subtle: "#fbfaf8"
  sand-readonly: "#f6f5f1"
  ink: "#19191c"
  ink-sidebar: "#111114"
  on-ink-muted: "#c9cacf"
  on-ink-supporting: "#b9b9be"
  slate: "#4a4a50"
  slate-muted: "#64646b"
  slate-faint: "#6f6f76"
  slate-subtle: "#737379"
  slate-disabled: "#c2c2c6"
  line: "#e6e4df"
  line-strong: "#dedcd6"
  line-muted: "#efede8"
  line-dashed: "#c9c7c1"
  success-bg: "#e8f5ee"
  success-fg: "#12764a"
  warning-bg: "#fcf3e3"
  warning-fg: "#b45309"
  info-bg: "#e4ecfb"
  info-fg: "#2a55a8"
  blocked-bg: "#efe9fb"
  blocked-fg: "#6941c6"
  error-bg: "#fbe9e7"
  error-fg: "#b42318"
  error-border: "#f2c4bc"
  destructive: "#b42318"
  destructive-solid: "#c62a1c"
  notification-badge: "#d92d20"
  dark-canvas: "#19191c"
  dark-card: "#222226"
  dark-muted: "#2e2e32"
  dark-foreground: "#f4f2ee"
typography:
  auth-hero:
    fontFamily: "Space Grotesk, Instrument Sans, sans-serif"
    fontSize: "46px"
    fontWeight: 600
    lineHeight: 1.06
    letterSpacing: "-0.015em"
  hero:
    fontFamily: "Space Grotesk, Instrument Sans, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.15
  metric:
    fontFamily: "Space Grotesk, Instrument Sans, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1
  page-title:
    fontFamily: "Space Grotesk, Instrument Sans, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
  section-title:
    fontFamily: "Space Grotesk, Instrument Sans, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    lineHeight: 1.25
  dialog-title:
    fontFamily: "Space Grotesk, Instrument Sans, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.2
  card-title:
    fontFamily: "Space Grotesk, Instrument Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  wordmark:
    fontFamily: "Space Grotesk, Instrument Sans, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
  body-lg:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  button-lg:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 600
    lineHeight: 1
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 600
    lineHeight: 1.4
  small:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.45
  caption:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.45
  overline:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 700
    letterSpacing: "0.05em"
  mono-id:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "12.5px"
    fontWeight: 400
rounded:
  xs: "4px"
  sm: "5px"
  chip: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  gap: "10px"
  inset: "14px"
  md: "16px"
  form-row: "18px"
  form-col: "20px"
  card: "24px"
  gutter: "32px"
  section: "48px"
  hero: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.on-ember}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.ember-hover}"
  button-page-cta:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.on-ember}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 24px"
  button-auth-submit:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.on-ember}"
    typography: "{typography.button-lg}"
    rounded: "{rounded.md}"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-destructive-solid:
    backgroundColor: "{colors.destructive-solid}"
    textColor: "{colors.on-ember}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 20px"
  button-destructive-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.destructive}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 20px"
  button-dialog:
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    height: "40px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "46px"
    padding: "0 14px"
  input-locked:
    backgroundColor: "{colors.sand-readonly}"
    textColor: "{colors.slate}"
    rounded: "{rounded.md}"
    height: "46px"
  dropzone:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.slate}"
    rounded: "{rounded.md}"
    height: "120px"
  chip:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.chip}"
    height: "28px"
  choice-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.md}"
    height: "42px"
  otp-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    width: "52px"
    height: "58px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  form-section:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  form-section-warning:
    backgroundColor: "{colors.ember-tint}"
  rail-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.overline}"
    rounded: "{rounded.lg}"
    padding: "20px"
    width: "300px"
  badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success-fg}"
    typography: "{typography.small}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning-fg}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-info:
    backgroundColor: "{colors.info-bg}"
    textColor: "{colors.info-fg}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-error:
    backgroundColor: "{colors.error-bg}"
    textColor: "{colors.error-fg}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  table-header:
    backgroundColor: "{colors.sand-readonly}"
    textColor: "{colors.slate-subtle}"
    typography: "{typography.overline}"
    height: "39px"
  table-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.slate}"
    typography: "{typography.body}"
    height: "58px"
  header-public:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "74px"
  sidebar:
    backgroundColor: "{colors.ink-sidebar}"
    textColor: "{colors.on-ink-muted}"
    width: "248px"
  sidebar-item-active:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.on-ember}"
    rounded: "{rounded.md}"
    height: "44px"
  auth-panel-candidate:
    backgroundColor: "{colors.ember-panel}"
    textColor: "{colors.on-ember}"
    typography: "{typography.auth-hero}"
    width: "560px"
  auth-panel-employer:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ember}"
    typography: "{typography.auth-hero}"
    width: "560px"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.dialog-title}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: ITTalent

## Overview

**Creative North Star: "The Open Counter"**

ITTalent is a marketplace, not one company's portal. Many employers post roles and run their hiring on it; applicants keep one profile and apply to any of them. The interface is the neutral counter between them: warm-sand paper, tight type, one hot colour. It never speaks in an employer's voice. Job and company copy appears as each employer wrote it; the labels, buttons and messages around it are always ITTalent's.

The system is small, dense and calm. Text runs at 13.5px, tables are 58px rows, form fields are 46px, panels are hairline-bordered rather than shadowed. Ember (a red-orange, `#f2470c`, the orange in the screens) is spent on the one thing a screen is for, so it reads as intent, not decoration. Three audiences share the system: **applicants**, **employers** (company hiring teams) and **platform admins**. Admin and employer workspaces are dense and data-first; the candidate site and sign-in are warmer and more encouraging. The colour of the sign-in panel tells a person which door they are in: Ember for candidates, near-black for employers.

**Key Characteristics:**

- Warm-sand neutrals with a single accent, Ember; one primary action per view.
- Borders, not shadows, separate surfaces; elevation is reserved for things that float.
- Space Grotesk for titles and numbers, Instrument Sans for everything else.
- Soft 12–16px panels and 12px buttons; pills are kept for the one page-level CTA, badges, toggles and avatars.
- Admin records are created and edited on their own pages: sections on the left, a 300px rail of checklists on the right.
- Status is always a word inside a tint pair, never colour alone. Status-change buttons are coloured by the action they perform.
- Every text/ground pair meets WCAG AA (4.5:1) except white on Ember, which is 3.6:1 and is limited to 14px/600 or larger labels.

## Colors

A warm-sand field with one accent. Neutrals lean warm (never blue-grey); the accent is a single red-orange with a darker hover and a darker candidate-panel variant.

### Primary

- **Ember** (`#f2470c`, token `primary`): Fill for the primary CTA, active nav item, focus ring, selection and checked boxes. White on it is 3.6:1, so labels on Ember are 14px/600 or larger. The `brand` token is the same value; use `brand` for the logo tile, cover and illustrations so the mark never follows a future change to `primary`.
- **Ember Hover** (`#d73c03`, `primary-hover`): Hover and pressed fill.
- **Ember Panel** (`#cf3a05`, `panel-candidate`): Ground of the candidate sign-in panel, Ember darkened until white text reaches 4.6:1.
- **Ember Link** (`#b33305`, `fg-link`): All body-size text links and accent text on Ember washes. In dark theme it becomes `#f6c9b6`.
- **Ember Wash / Tint / Border** (`#fde8e0` / `#fef3ee` / `#f0b4a0`): Selected-card fill, accent badges, the warning FormSection, and their outlines.

### Neutral

- **Canvas** (`#fafaf8`): Page ground. Every screen starts here.
- **Paper** (`#ffffff`): Cards, tables, inputs, menus, dialogs, the public header.
- **Sand** (`#f1efea`): The quiet fill: secondary buttons, neutral badges, chips, disabled inputs. **Sand Readonly** (`#f6f5f1`, `surface-readonly`): table header rows and locked inputs.
- **Ink** (`#19191c`): Headlines and primary text; also the hero and employer sign-in panel ground.
- **Ink Sidebar** (`#111114`): Admin and employer sidebar, with `#c9cacf` (`sidebar-muted`) for inactive items and white for hover and active. **`#b9b9be`** (`hero-fg-muted`) is supporting text on dark grounds.
- **Slate** (`#4a4a50`): Body text. **Slate Muted** (`#64646b`): hints and meta. **Slate Faint / Subtle** (`#6f6f76` / `#737379`): caps labels and icons only.
- **Line** (`#e6e4df`): The 1px border on every panel. **Line Strong** (`#dedcd6`, also the `input` token): the resting border on inputs, selects and textareas. **Line Muted** (`#efede8`): table row dividers. **Line Dashed** (`#c9c7c1`, `border-dashed`): upload dropzones and empty placeholders.

### Status (tint pairs)

Each status is a pale ground with a deep foreground: success green (`#e8f5ee` / `#12764a`), warning amber (`#fcf3e3` / `#b45309`), info blue (`#e4ecfb` / `#2a55a8`), blocked violet (`#efe9fb` / `#6941c6`), error red (`#fbe9e7` / `#b42318`), neutral sand. `notification-badge` (`#d92d20`) is the unread dot only. Solid status fills exist for confirm buttons only; `destructive-solid` is `#c62a1c` (white text 5.9:1 in light theme).

The application pipeline maps onto them: Submitted neutral, Under Review info, Interviewing violet, Offered warning, Hired success, Rejected error, Withdrawn muted.

### Dark theme

Same roles, derived values: canvas `#19191c`, card `#222226`, muted `#2e2e32`, foreground `#f4f2ee`, `surface-readonly` `#26262a`, `border-dashed` `#4a4a50`. Status foregrounds lighten (for example success `#6fd39b`, error `#f4a399`); Ember stays `#f2470c`. Always use the token name, never the hex, so the theme swaps.

### Named Rules

**The One Ember Rule.** Ember fills at most one primary action per view, plus the active nav item, checked boxes and the focus ring. If two things are orange, one of them is wrong.

**The Ember-Is-Not-Text Rule.** White on Ember is 3.6:1, so labels on it stay 14px/600 or larger, and body-size text never uses `primary`. Text links use `fg-link`, accent text on a wash uses `accent-foreground`.

**The Door Colour Rule.** The candidate sign-in panel is Ember, the employer panel is near-black. Never swap them and never reuse either as a page ground.

**The Word Beats Colour Rule.** Status is a labelled badge. Colour reinforces the word; it never replaces it.

**The Action-Colours-The-Button Rule.** A status-change button takes the colour of what it does, not of the record's current status: Activate is green, Suspend, Deactivate, Delete and Withdraw are red (solid, or outline beside a primary action), everything else is outline.

**The Faint-Means-Caps Rule.** `slate-faint` and `slate-subtle` are for uppercase labels and icons. Sentences use `slate` or `slate-muted`.

## Typography

**Display Font:** Space Grotesk (fallback Instrument Sans, sans-serif), weights 600/700 only.
**Body Font:** Instrument Sans (fallback system-ui, sans-serif), weights 400–700.
**Mono Font:** ui-monospace, SFMono-Regular, Menlo.

**Character:** Space Grotesk brings geometric character to titles, numbers and the wordmark; Instrument Sans stays out of the way at small sizes. The UI runs small and dense, so hierarchy comes from weight and family more than size.

### Hierarchy

- **Auth hero** (600, 46px, 1.06, -0.015em): Headline on the 560px sign-in panel, for example "Where IT careers take shape." or "Hire IT talent with less busywork."
- **Hero** (600, 36px, 1.15): Public hero headline. One per page.
- **Metric** (700, 34px, 1.0; `metric-xl` 40px): KPI card numbers and the dashboard hero number.
- **Page title** (600, 24px, 1.25): The single h1 of a workspace page.
- **Section title** (600, 21px, 1.25): Section and panel headings, mobile page titles.
- **Dialog title** (600, 19px, 1.2): Dialogs and confirm dialogs.
- **Card title** (600, 16px, 1.3): Job cards, company cards, board cards.
- **Body** (400, 13.5px, 1.5): Default UI text in tables, menus, descriptions. **Body strong** (600) for names and emphasised values. **Body large** (15px, 1.6) for empty-state copy and sidebar labels. **Button large** (600, 14.5px) for full-width auth buttons.
- **Label** (600, 13.5px, 1.4): Form field labels and card-section titles inside forms. **Small** (12.5px) for secondary lines, field hints and footer links. **Caption** (12px) for footnotes.
- **Overline** (700, 11.5px, +0.05em, caps): Table headers, rail-card titles and sidebar group labels. **Eyebrow** (700, 11px, +0.08em, caps) sits above section titles and on the employer panel ("FOR EMPLOYERS").
- **Mono ID** (12.5px): Record IDs (`APP-1029`, `JOB-201`, `ENT-0012`), phone numbers, counts.
- **Wordmark** (Space Grotesk 700, 19px, +0.04em, uppercase): ITTALENT beside the logo tile only.

### Named Rules

**The One H1 Rule.** Each page has one `page-title`. Everything under it steps down through `section-title` and `card-title`.

**The Two-Family Rule.** Titles and numbers are Space Grotesk; everything else is Instrument Sans. Never mix them within one line except the wordmark lockup.

**The Sentence Case Rule.** Titles, buttons and menu items are sentence case. Uppercase is only for overline, eyebrow and the wordmark.

## Layout

Four shells share one grid of gaps. **Workspace** (employer and admin): dark sidebar 248px (76px collapsed rail; 44px items with 15px labels) with a `canvas` content area and 32–40px gutters. **Form pages** (create and edit): breadcrumb, page title and one-line description, then a two-column `FormLayout`, sections on the left and a 300px sticky rail on the right, and a footer row of actions. **Authentication**: a split screen with a 560px brand panel (arch art) on the left and a centred 440px form on `canvas`; under 900px the panel stacks above the form. **Applicant and public marketplace**: a white 288px applicant sidebar or a 74px sticky white header (logo, Jobs / Companies / News pill nav, For employers, Sign in / Sign up), a `hero-bg` search hero, alternating `canvas` and `paper` sections of job and company cards at a 48px gutter, and a four-column footer (For candidates, For employers, ITTalent, legal with an EN · VI switch). Under 1024px the public nav and auth buttons fold into a menu sheet.

Spacing is tight and even: 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 32, 48, 64px. Defaults: 10px between siblings, 14px horizontal padding in inputs and menu rows, 24px padding in cards and form sections, 32px page gutter. In forms, a label, its control and its hint sit 8px apart, rows are 18px apart and columns 20px apart; a section holds 1, 2 or 3 columns (3 for short fields such as email, phone, website). Controls are 36 / 44 / 46px tall (inputs, selects and list filters are 46px); buttons run 24 / 28 / 32 / 36 / 40 / 44px, with 48px for the full-width auth submit. Tables use 58px rows under a 39px header. Layers: overlay 40, dialog 50, header 300, toast 1200.

### Named Rules

**The Every-Job-Has-a-Company Rule.** A job is never shown without the company it belongs to (logo, name), in lists, cards, detail and application views.

**The Own-Page Rule.** A form with more than about five fields, or with sections, gets its own page. Short forms (a name, a description, a status) stay in a dialog. Status is never a field in an edit form; it changes on the detail page.

## Elevation & Depth

Flat by default. Depth comes from a 1px `line` border on a `paper` panel over `canvas`, not from shadow. Shadows appear only on things that float or that need to be found.

### Shadow Vocabulary

- **Resting card** (`0 1px 2px rgba(0,0,0,.04)`, `shadow-xs`): Optional hairline lift on cards.
- **Raised** (`0 2px 8px rgba(0,0,0,.07)`, `shadow-sm`): Hovered job and company cards.
- **Menu** (`0 10px 24px rgba(25,25,28,.10)`, dark `rgba(0,0,0,.32)`): Menus, popovers, selects.
- **Toast** (`0 8px 20px rgba(25,25,28,.25)`): The dark toast.
- **Dialog** (`0 24px 60px rgba(0,0,0,.30)`) over a 50% ink overlay: Dialogs.
- **Brand** (`0 6px 18px rgba(242,71,12,.45)`): Only under the mobile round create button.
- **Focus** (2px `ember` ring; inputs add a 20% Ember halo): Keyboard focus on every interactive element.

### Named Rules

**The Border-Before-Shadow Rule.** If a surface is not floating, separate it with a border. A shadow on a static card is a defect.

## Shapes

Soft panels, soft buttons, few pills. Controls and panels use 12px (`md`); cards and form sections 16px (`lg`); the largest surfaces 20px (`xl`). **Pills (999px) are for the one page-level CTA at the top right of a list page ("Create user", "Create job type"), badges, segmented toggles and avatars.** Every other button (form footers at 44px, dialog buttons at 40px, table and detail actions, auth submit at 48px full width) is 12px. User-entered tags (`Chip`) are 8px; small system chips (CV / CL, kbd) are 5px and the tightest details 4px. Checkboxes are 20px squares with a 5px radius. Upload targets have a dashed `line-dashed` edge. The logo tile is 11px on a 40px square. Icons are Lucide, 2px stroke with round caps, at 16px in controls, 18px in navigation and 20–28px in empty-state discs.

The logo mark is a person whose arms arch like a bridge (one candidate reaching many employers): white glyph on an Ember rounded tile. The sign-in panels repeat the arch as large, low-contrast bands rising from the bottom-left; the art is decorative and hidden from assistive tech. Keep a quarter-tile clear space around the logo; never stretch, outline or recolour it. Minimum 16px for the tile alone, 24px with the wordmark.

## Components

The catalogue lives in the live React bundle (`window.ITTalent`, 74 components); this section is the rulebook. Character: **plain, dense and confident**.

### Buttons

- **Shape:** 12px radius. Only the one page-level CTA of a list page is a pill (`shape="pill"`, 44px). Text is optically centred; icons sit on the same line as the label.
- **Primary:** Ember fill, white 14px/600 label. One per view. Form footers use 44px (`FormActions`: Cancel outline, then the primary action, right-aligned above a 1px border); the auth submit is 48px and full width.
- **Outline / Secondary / Ghost:** Outline is white with a `line` border; secondary is Sand; ghost is text only.
- **Destructive:** `destructive` text for the trigger, `destructive-outline` beside a primary action, `destructive-solid` (`#c62a1c`) for the confirm ("Suspend user", "Delete job posting"). Other solids (success, warning, info, violet) are confirm buttons only. Activate is `success-solid`.
- **Dialog footers:** always 40px, Cancel-style on the left of the action, both the same height and radius. "Keep editing / Discard", "Cancel / Create" and "Cancel / Suspend user" are one pattern.
- **Hover / Focus / Disabled:** Primary darkens to `ember-hover`; focus is the 2px Ember ring; disabled is 50% opacity with no pointer.

### Inputs and form controls

- **Input:** White fill, 1px `line-strong` border, 12px radius, 46px tall, 14px side padding, 13.5px text. Select, search, filter triggers and `PasswordInput` (with a show/hide eye) share it. Focus is a 2px Ember ring plus a 20% halo; error is a red border and a red message under the field; disabled is Sand at 50% opacity.
- **FormField:** label 13.5px/600, control, then a 12.5px hint or error, 8px apart. Mark required fields with a red asterisk, not optional ones. The hint carries the constraint ("10–13 digits · must be unique").
- **LockedInput:** `sand-readonly` fill, lock icon at the right, for values that cannot change after creation. Say why in the hint ("Locked after creation").
- **TagInput and Chip:** free-text lists as removable 28px tags in a 46px minimum box; Enter or comma adds. `Badge` is for status, `Chip` for user-entered values.
- **ChoiceChips:** one choice from a short list as wrapping 42px buttons; selected is an ink border on a Sand fill. `tones` colour status-like choices (Active green, Suspended red). Use `Select` above about six options.
- **Checkbox:** 20px square; checked fills Ember with a white tick; 14px/600 label with an optional 13px description. For one explicit confirmation only.
- **Dropzone:** dashed box, upload icon, bold action, and the file rule underneath ("PNG or JPG, up to 2 MB"); 120px for a logo or cover, 96px for a gallery strip.
- **OtpInput:** six 52×58px cells in Space Grotesk 24px; typing advances, Backspace goes back, paste fills every cell.

### Cards, forms and detail pages

- **Cards:** 16px radius, `paper` on `canvas`, 1px `line`, 24px padding. Selected cards take an Ember wash and an Ember check. `JobCard` and `CompanyCard` are whole-card links that lift to `shadow-sm` on hover.
- **FormSection:** the card that groups fields on a create or edit page: 16px/700 title, one-line 13px description, then a `FormGrid` of 1–3 columns. `tone="warning"` tints it `ember-tint` for the one confirmation block; never colour a section green or red.
- **RailCard and FormLayout:** the 300px sticky right rail with 20px-padded cards and overline titles: REQUIRED TO CREATE (an orange-dot checklist in form order), SET BY THE SYSTEM, NOT EDITABLE HERE. On edit pages the last card shows the current status as a read-only badge.
- **DetailGrid:** label over value in 2 or 3 columns inside a card with a 15px/700 title. Empty optional values read "Not provided" in muted text, never blank. `DetailRow` is the single label-value line inside dialogs and side panels.
- **Breadcrumb:** "Parent / current" above the page title, 13px muted; the current item is 600, and mono when it is a record id.
- **Callout:** a 12px tinted box for a rule that applies to the form in front of the user; `warning` for consequences, `info` for how something works, `success` for a completed state. Not a toast and not an `InlineBanner`.

### Badges

Pill, 12.5px, tint pair from the Status palette. `ApplicationStatusBadge` maps the pipeline; `DocumentTypeBadge` (CV / CL) uses the 5px chip.

### Tables

`sand-readonly` header at 39px with overline labels in `slate-subtle`; 58px rows in `paper` separated by `line-muted`; hover uses `sand-hover`; row actions in a menu. Pagination is numbered on desktop.

### Navigation

- **Sidebar:** Ink sidebar; inactive items `#c9cacf`, hover and active white; active item filled Ember; 44px items with 15px labels; group labels in overline caps. Collapses to a 76px rail with a 36px toggle.
- **Public header:** 74px, white, logo left, pill nav (Jobs, Companies, News), "For employers" link, then Sign in (outline) and Sign up (primary). Signed-in users get a role menu. Mobile folds everything into a sheet.
- **Footer:** four columns with a legal row and a language switch; platform-level only.

### Authentication

`AuthLayout` frames every sign-in, sign-up, verify and recover screen: a 560px brand panel with the lockup, an `auth-hero` headline, one supporting paragraph, and a link to the other audience; the form sits in a centred 440px column. Candidate panel is Ember (`#cf3a05`) with light arches and a white logo tile. Employer panel is near-black with Ember arches and a FOR EMPLOYERS eyebrow. Errors are `InlineErrorAlert` lines under the form, never toasts. Employer accounts are invited, never self-registered: Sign in, Accept invitation (email fixed and read-only), and Request access (a vetting request that creates no account). One email is one account and one role.

### Overlays and feedback

Dialogs (16px, `shadow-dialog`, title in `dialog-title`), alert dialogs for destructive confirms with a tone-matched icon and button, toasts (dark, bottom, 200ms slide, max 3), inline banners for conditions that persist, and empty states that pair a title, one sentence and one CTA.

## Do's and Don'ts

### Do:

- **Do** use token names (`primary`, `canvas`, `status-success-fg`), not hex, so light and dark both work.
- **Do** keep one primary action per view, in Ember, with a label of 14px/600 or larger.
- **Do** use `fg-link` for text links and never `primary` for body-size text.
- **Do** write buttons as verb plus object: "Publish job", "Download CV", "Activate account".
- **Do** colour status-change buttons by the action: Activate green, Suspend / Deactivate / Delete / Withdraw red.
- **Do** give admin records with more than about five fields their own create and edit page, with a breadcrumb, sections and a rail.
- **Do** put constraints in field hints, mark required fields with an asterisk, and say "Optional" on optional ones.
- **Do** show every job with its company, and keep the interface voice as ITTalent.
- **Do** keep sign-in panels audience-coloured: Ember for candidates, near-black for employers.
- **Do** use sentence case, with uppercase only for overline, eyebrow and the wordmark.
- **Do** keep record IDs prefixed and in mono (`APP-1029`, `JOB-201`, `ENT-0012`).
- **Do** write errors that say what happened and what to do next.
- **Do** verify contrast at 4.5:1 for every new text and ground pair in both themes; white on Ember is the single documented exception.

### Don't:

- **Don't** put body-size text or small labels on Ember; the contrast is 3.6:1.
- **Don't** use pills for anything but the one page-level CTA, badges, toggles and avatars.
- **Don't** use `slate-faint` or `slate-subtle` for sentences.
- **Don't** add shadows to static cards; use a border.
- **Don't** put status inside an edit form; change it from the detail page or the row menu.
- **Don't** colour a form section green or red; only `tone="warning"`.
- **Don't** use "Submit", "OK" or "Click here" as button labels.
- **Don't** use emoji or icon fonts in product UI.
- **Don't** give dialog footers mismatched button styles or heights.
- **Don't** style copy as any one employer; no company gets a special voice or colour in the chrome.
- **Don't** let employers self-register; company accounts come from an invitation.
- **Don't** introduce a second accent colour or a new radius outside the scale.
