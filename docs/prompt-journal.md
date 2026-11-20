# SupportDesk Prompt Journal

Ye journal SupportDesk project ke dauran AI ke sath ki gayi key interactions, prompts, aur unke basis par kiye gaye code updates ko track karta hai.

---

## Entry 1: Monorepo Structure & Config Files (Day 3)
- **Prompt:** "Create standard configuration files for the SupportDesk monorepo including .gitignore, .env.example, and README.md."
- **AI Response Summary:** Provided template configurations covering node_modules/env exclusion and directory overviews.
- **Changes Made:** Created root `.gitignore`, `.env.example`, and structured `README.md`.
- **Reasons for Changes:** To secure environment variables and ensure smooth onboarding for team collaboration.
- **Verification Steps:** Ran `git status` to ensure `.env` and `node_modules` were successfully ignored.

---

## Entry 2: Feature Branch & Conventional Commits Setup (Day 3)
- **Prompt:** "Explain how to structure branch names and write commit messages following Conventional Commits for SupportDesk."
- **AI Response Summary:** Outlined prefixes like `feature/`, `bugfix/` and commit formats like `type(scope): message`.
- **Changes Made:** Adopted `feature/support-desk-setup` branch convention.
- **Reasons for Changes:** To maintain clean git history and enable automated release/changelog generation.
- **Verification Steps:** Verified branch name using `git branch` and inspected commit history with `git log --oneline`.

---

## Entry 3: Pull Request (PR) Workflow & Git Basics (Day 4)
- **Prompt:** "Guide me through opening a clean Pull Request on GitHub for my initial monorepo setup and explain git vs github differences."
- **AI Response Summary:** Step-by-step instructions on pushing branches, opening PRs, and differentiating local version control from remote hosting.
- **Changes Made:** Pushed feature branch to remote GitHub repository and opened a reviewable PR.
- **Reasons for Changes:** To demonstrate code review hygiene before merging into the main branch.
- **Verification Steps:** Checked GitHub PR interface to confirm clean file diffs without any accidental sensitive files.

---

## Entry 4: Environment Variable Management & Monorepo Skeleton (Day 4)
- **Prompt:** "How should we structure the full monorepo skeleton including apps, agents, automation, and handle .env files securely?"
- **AI Response Summary:** Provided directory paths and placeholder environment setups to prevent secret leaks.
- **Changes Made:** Created folder structure (`apps/api`, `apps/web`, `apps/mobile`, `agents`, `automation/n8n`, `docs`) and configured `.env.example`.
- **Reasons for Changes:** To align with the roadmap requirements and ensure no real credentials are exposed.
- **Verification Steps:** Inspected folder tree in VS Code and verified `.gitignore` rules.

---

## Entry 5: Merge Conflict Resolution & Branching Strategy (Day 4)
- **Prompt:** "Explain how to resolve a merge conflict safely when two branches edit overlapping lines without losing intended changes."
- **AI Response Summary:** Outlined conflict marker handling (`<<<<<<<`, `=======`, `>>>>>>>`), manual merging, and verification checks.
- **Changes Made:** Practised reviewing and resolving conflicting code sections.
- **Reasons for Changes:** To ensure safe collaboration during team-based monorepo workflows.
- **Verification Steps:** Ran git diff and verified clean builds after conflict resolution.

---

## Entry 6: Plan-First Prompting (Day 5)
- **Date/Context:** 2026-10-27 | SupportDesk CLI Implementation
- **Goal:** Inspect requirements and propose a step-by-step implementation plan before writing any code.
- **Prompt Used:** *"I need a TypeScript CLI in the SupportDesk repository that generates ticket IDs and converts CSV ticket records to JSON. Do not write code yet. Summarize the requirements, list assumptions, propose an implementation plan, identify likely files to change, and describe risks."*
- **AI Response Summary:** Provided a modular plan covering folder setup, utility logic, testing with Jest, and error handling.
- **Changes Made & Why:** Added explicit constraints to ensure Node.js file system (`fs`) checks missing paths safely without crashing.
- **Outcome:** Clear roadmap established before touching code files.

---

## Entry 7: Clarifying-Question Prompting (Day 5)
- **Date/Context:** 2026-10-27 | Requirements Validation
- **Goal:** Identify ambiguous requirements, ticket ID formats, and CSV error-handling rules before coding.
- **Prompt Used:** *"Before suggesting code, identify ambiguities in the ticket CLI task. Ask questions about ticket ID format, required CSV columns, empty files, malformed rows, validation, and expected output."*
- **AI Response Summary:** Raised questions regarding default prefixes, timestamp slicing, empty CSV fallback behavior, and missing column exceptions.
- **Changes Made & Why:** Confirmed standard prefix as `SUP-`, decided empty CSV files should return an empty array `[]`, and missing files must throw descriptive errors.
- **Outcome:** Eliminated guesswork and locked down exact behavioral contracts.

---

## Entry 8: Test-First Prompting (Day 5)
- **Date/Context:** 2026-10-27 | Jest Unit Test Design
- **Goal:** Define test scenarios and propose Jest unit tests before writing the feature code.
- **Prompt Used:** *"Do not implement the feature yet. Propose Jest tests for ticket ID generation and CSV-to-JSON conversion. Include valid input, empty input, missing columns, malformed rows, invalid values, and repeated ID generation."*
- **AI Response Summary:** Proposed comprehensive test cases covering format validation, uniqueness, empty checks, and file errors.
- **Changes Made & Why:** Adopted test structures directly into `apps/cli/src/ticket.test.ts` to ensure robust coverage.
- **Outcome:** Successfully ran `npm test` and verified all 8 test cases passed.

---

## Entry 9: Structured Debugging Prompting (Day 5)
- **Date/Context:** 2026-10-27 | Local Debugging Exercise
- **Goal:** Diagnose an intentional local bug systematically using structured error reporting and minimal fixes.
- **Prompt Used:** *"Help me debug this without rewriting the whole feature. Expected behaviour: Ticket ID should contain hyphens. Actual behaviour: Hyphens were missing causing test failure. Exact error: expect(received).toBe(true) received false. Relevant code: generateTicketId function."*
- **AI Response Summary:** Identified that the string template literal was missing hyphens (`-`) between tokens.
- **Changes Made & Why:** Restored hyphens in `generateTicketId` to match the expected format validation.
- **Outcome:** Reran `npm test` successfully; confirmed the bug was caught by tests and fixed locally without committing the broken state.
## Day 13 — Frontend Foundations (`SupportDesk`)
**Date:** 17 November 2026  
**Project:** SupportDesk (`apps/web`)  

### 1. Objective
Set up the React, Vite, TypeScript, and Tailwind CSS frontend foundation with a feature-based directory structure, a centralized environment-configured API client (`VITE_API_BASE_URL`), a responsive login flow, shared application layout, and protected routes connected to the real backend authentication mechanism[cite: 1].

---

### 2. Prompts Used
* **Planning Prompt:**  
  > *"Act as a senior frontend engineer working on the SupportDesk React application. Inspect the existing repository and supplied login API contract. Do not write code yet. Create an implementation plan for a responsive login page, shared application layout, one API client whose base URL comes from an environment variable, authentication state based on the actual backend mechanism, protected routes, and clear loading/validation/success/error states. Use existing React, Vite, TypeScript and Tailwind conventions. Identify files to create or modify, dependencies, risks and tests. Do not invent endpoints, response fields, packages or authentication behaviour."*[cite: 1]

* **API Client Prompt:**  
  > *"Implement one shared API client based on the actual SupportDesk repository and backend contract. Requirements: TypeScript strict mode; base URL from import.meta.env.VITE_API_BASE_URL; central request configuration and error handling; actual authentication mechanism; no hard-coded URLs; no invented endpoints; no API calls in React components; focused success and failure tests."*[cite: 1]

* **Debugging & Integration Prompt:**  
  > *"Diagnosed POST http://localhost:3000/api/auth/login 404 (Not Found) and INVALID_CREDENTIALS error when connecting LoginPage to the live backend API."*[cite: 3]

* **Code Review Prompt:**  
  > *"Act as a senior frontend architect reviewing my Day 13 SupportDesk implementation. Inspect the actual diff and repository context. Verify: React/Vite/TypeScript conventions; folder structure; no API calls or fetch inside UI components; API base URL from VITE_API_BASE_URL; real backend login contract; auth state and protected routes match the backend; loading/validation/error/responsive states; accessibility; no exposed secrets; and meaningful tests."*[cite: 1]

---

### 3. AI Output & Implementation Summary
* **Folder Structure Created (`apps/web/src`):**
  * `pages/` (`LoginPage.tsx`, `TicketsPage.tsx`)[cite: 1, 2]
  * `components/` (`AppLayout.tsx`, `ProtectedRoute.tsx`)[cite: 1, 2]
  * `features/tickets/` (`api/`, `hooks/`, `components/`)[cite: 1]
  * `lib/` (`api-client.ts`, `auth.tsx`)[cite: 1, 2]
* **Centralized API Client (`src/lib/api-client.ts`):**
  * Configured `baseURL` using `import.meta.env.VITE_API_BASE_URL` without hard-coded URLs[cite: 1].
  * Added request/response handling to attach credentials/tokens and handle unauthorized (`401`) responses safely.
* **Login & App Shell:**
  * Built responsive `LoginPage.tsx` with React Hook Form validation, disabled submit state during requests, and server/validation error banners[cite: 1, 2].
  * Built `AppLayout.tsx` with sidebar navigation (`SupportDesk`, `Tickets`), header with `Logout` action, and main content outlet[cite: 1, 4].

---

### 4. Issues Encountered & Fixes Applied (Independent Verification)
1. **404 Not Found on Login (`POST /api/auth/login`):**
   * **Root Cause:** `VITE_API_BASE_URL` included `/api` (`http://localhost:3000/api`), whereas the backend auth route was mounted directly at `http://localhost:3000/auth/login`[cite: 3].
   * **Fix:** Updated `VITE_API_BASE_URL=http://localhost:3000` in `.env` / `.env.example` and restarted the Vite dev server.
2. **Invalid Credentials During API Verification:**
   * **Root Cause:** Tested with unseeded credentials (`sayali12.new@example.com`), returning `INVALID_CREDENTIALS` from the backend[cite: 2, 3].
   * **Fix:** Verified valid user records in Prisma Studio and authenticated successfully against the live backend[cite: 3, 4].
3. **Architecture & Boundary Check:**
   * Verified zero direct `fetch()` or API calls inside UI components (`LoginPage.tsx`, `AppLayout.tsx`, `TicketsPage.tsx`)[cite: 1, 2].

---

### 5. Verification Evidence
* **Backend Endpoint Check:** Verified `POST http://localhost:3000/auth/login` via PowerShell `Invoke-RestMethod` and browser Network tab (`200 OK` on valid credentials, structured `401` error on invalid credentials)[cite: 3].
* **Protected Routes:** Confirmed unauthenticated visits redirect to `/login` and authenticated login redirects to `http://localhost:5173` (`Tickets` view inside `AppLayout`)[cite: 1, 2, 4].
* **Responsive & Console Check:** Tested mobile viewport (`369x501`) and desktop layout; confirmed no sensitive tokens or secrets are logged to the console[cite: 1, 3, 4].
