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