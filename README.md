# IT Talent Platform - Web Frontend

Modern, high-performance web frontend for the IT Talent Platform, built with React 19, Vite, TypeScript, and Tailwind CSS v4.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Development Server](#development-server)
  - [Building for Production](#building-for-production)
- [Available Scripts](#available-scripts)
- [API Client Generation](#api-client-generation)
- [Contributing Guide](#contributing-guide)
  - [Workflow](#workflow)
  - [Commit Message Conventions](#commit-message-conventions)
  - [Coding Standards](#coding-standards)
  - [Pull Request Guidelines](#pull-request-guidelines)

---

## 🌟 Overview

The **IT Talent Platform Web** application provides an intuitive user interface for exploring tech talent opportunities, managing user accounts, and accessing administrative controls. It connects to the backend services via a type-safe API client generated from OpenAPI specifications.

---

## ✨ Key Features

- **Public Landing Page:** Responsive marketing and discovery interface highlighting platform benefits, featured opportunities, and call-to-actions.
- **Authentication & Authorization:** Secure registration and login workflows with form validation, role-based access control, and route protection.
- **Admin User Management:** Dedicated administrative dashboard for searching, filtering, inspecting, and managing user profiles and roles.
- **Internationalization (i18n):** Multi-language support (English and Vietnamese) powered by `i18next` and `react-i18next`.
- **Type-Safe API Integration:** Auto-generated fetch client and hooks using Hey-API (`@hey-api/openapi-ts`) integrated with TanStack React Query.
- **Accessible & Consistent UI:** Styled with Tailwind CSS v4 and accessible components built on Radix UI primitives with Lucide icons.

---

## 🛠️ Tech Stack

- **Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Tooling:** [Vite 8](https://vite.dev/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **State & Data Fetching:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Styling & Components:** [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
- **Internationalization:** [i18next](https://www.i18next.com/), [react-i18next](https://react.i18next.com/)
- **Code Generation:** [@hey-api/openapi-ts](https://heyapi.dev/)
- **Testing:** [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/), [jsdom](https://github.com/jsdom/jsdom)
- **Linting & Formatting:** [ESLint 10](https://eslint.org/), [Prettier](https://prettier.io/)

---

> **Contributing agents and developers:** structure, reuse and coding rules are in [`AGENTS.md`](./AGENTS.md); the design system (tokens, components, layout) is in [`DESIGN.md`](./DESIGN.md).

### End-to-end tests (backend + web together)

```bash
cd ../ittalent-backend && docker compose up -d      # MongoDB (replica set) + Redis, once
cd ../ittalent-web && npm run test:e2e              # boots BE :3101 and web :5174, seeds a dedicated DB, runs Playwright (system Chrome)
npm run test:e2e:report                             # open the HTML report
```

The suite never touches dev data (`ittalent_myapps_e2e` database, separate ports). Set `E2E_MONGODB_URI` to use another database.

## 📂 Project Structure

```text
ittalent-web/
├── public/                 # Static assets
├── src/
│   ├── api/                # API client configuration and generated clients
│   │   └── generated/      # Auto-generated OpenAPI fetch client
│   ├── app/                # Application root, routing, and global providers
│   ├── auth/               # Auth context, hooks, and protected route guards
│   ├── components/         # Reusable UI and layout components
│   │   ├── common/         # Generic application widgets (loading screen, etc.)
│   │   ├── layout/         # Layout shells (admin layout, public layout)
│   │   └── ui/             # Atomic design components (shadcn/Radix primitives)
│   ├── config/             # App-wide configuration and environment variables
│   ├── features/           # Feature-based domain modules
│   │   ├── admin/          # Admin management views and sub-components
│   │   ├── auth/           # Login and registration views
│   │   └── public-site/    # Landing page and public portal views
│   ├── hooks/              # Custom reusable React hooks
│   ├── i18n/               # i18next configuration and setup
│   ├── lib/                # Utility helpers and library wrappers
│   ├── locales/            # Localization dictionary files (en, vi)
│   ├── styles/             # Global CSS and Tailwind theme configurations
│   └── main.tsx            # Application entry point
├── tests/                  # Unit and integration test suites (Vitest)
│   ├── admin/              # Tests for admin features
│   ├── auth/               # Tests for authentication features
│   ├── public-site/        # Tests for public site components
│   └── setup.ts            # Global test environment setup
├── openapi.json            # OpenAPI schema specification
├── openapi-ts.config.ts    # OpenAPI client generation configuration
├── package.json            # Dependencies and npm scripts
└── vite.config.ts          # Vite build and test configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** `>= 20.x` (LTS recommended)
- **npm:** `>= 10.x` (or compatible package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ittalent-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Copy the example environment file and configure the values:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API service | `http://localhost:3000` |
| `OPENAPI_URL` | *(Optional)* Override URL for fetching OpenAPI spec | `http://localhost:3001/openapi.json` |

### Development Server

Start the local development server with hot-module replacement (HMR):

```bash
npm run dev
```

The application will be accessible at [http://localhost:5173](http://localhost:5173).

### Building for Production

Compile and bundle the application for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts the Vite development server |
| `npm run build` | `tsc -b && vite build` | Typechecks and creates an optimized production bundle |
| `npm run typecheck` | `tsc -b` | Runs TypeScript project references typecheck |
| `npm run test` | `vitest run` | Runs all unit and component tests with Vitest |
| `npm run lint` | `eslint .` | Runs ESLint across all source files |
| `npm run format` | `prettier --write .` | Formats all code files with Prettier |
| `npm run generate:client` | `openapi-ts` | Regenerates the API client from the running backend OpenAPI |
| `npm run preview` | `vite preview` | Serves the production build locally for verification |

---

## 🔄 API Client Generation

My Applications local development: start the backend from the sibling `ittalent-backend` repo on port `3001`, use `VITE_API_URL=http://localhost:3001` (the default in `.env.example`), and run `npm run dev`. The candidate demo credentials are in the backend README. The `/my-applications` route is available after signing in. The list, detail, history and PATCH withdrawal call the backend via the generated SDK. Regenerate using `npm run generate:client` while the backend is running (or set `OPENAPI_URL` to another live contract URL). The old checked-in `openapi.json` is a legacy snapshot, not the source for new SDK generation; it declares an admin users list not yet declared by the new backend. The existing admin list query uses the shared client until that endpoint is implemented in the backend contract.

The project uses [@hey-api/openapi-ts](https://heyapi.dev/) to generate type-safe API clients directly from the OpenAPI specification:

```bash
npm run generate:client
```

- Schema source: `http://localhost:3001/openapi.json` (override with `OPENAPI_URL`)
- Output directory: `src/api/generated/`
- Configuration file: `openapi-ts.config.ts`

Whenever backend API contracts change, start the backend and rerun this script. The checked-in `openapi.json` is retained as a legacy snapshot, not the active generator input.

---

## 🤝 Contributing Guide

We welcome contributions! Please follow these guidelines to ensure code quality and seamless collaboration.

### Workflow

1. **Create a branch:**
   ```bash
   git checkout -b feature/my-feature-name
   # or
   git checkout -b fix/my-bug-fix
   ```
2. **Make your changes:** Focus on small, incremental steps.
3. **Verify locally:** Ensure typecheck, tests, and linter pass before committing.
   ```bash
   npm run typecheck
   npm run test
   npm run lint
   ```
4. **Commit:** Follow the conventional commit format.
5. **Push and create a Pull Request / Merge Request.**

### Commit Message Conventions

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature (e.g., `feat(auth): add remember-me checkbox`)
- `fix:` A bug fix (e.g., `fix(users): correct pagination offset calculation`)
- `docs:` Documentation only changes (e.g., `docs: update setup instructions in README`)
- `style:` Formatting or stylistic changes without logic modification
- `refactor:` Code refactoring that neither fixes a bug nor adds a feature
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependency updates, or build configuration

### Coding Standards

- **TypeScript:** Strict type-safety is enforced. Avoid using `any`; declare precise interfaces or utility types.
- **Component Architecture:** Group domain components under `src/features/<feature-name>`. Keep reusable primitives under `src/components/ui`.
- **Formatting:** Keep code formatted by running `npm run format` before pushing.
- **Code Style:** ESLint rules must be respected without disabling warnings unless strictly justified.

### Pull Request Guidelines

- Keep PRs concise and focused (aim for around 600 lines or fewer of changes). Split large features into smaller, reviewable PRs where possible.
- Ensure all CI checks (typecheck, tests, lint) pass.
- Provide a clear PR description detailing what was changed and how to test it.
