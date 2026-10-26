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

## Entry 6: TypeScript CLI & Test-Driven Development (Day 5)
- **Prompt:** "Help me design a TypeScript function for generating random structured ticket IDs and a CSV-to-JSON parser with robust edge-case handling."
- **AI Response Summary:** Provided clean TypeScript implementation using Node.js `fs` module and string manipulation.
- **Changes Made:** Implemented `generateTicketId` and `convertCsvToJson` inside `apps/cli/src/index.ts`.
- **Reasons for Changes:** To automate ticket tracking setup and seed data ingestion for SupportDesk.
- **Verification Steps:** Created unit tests covering custom prefixes, empty files, and error throwing.

---

## Entry 7: Writing Jest Unit Tests for CLI Tools (Day 5)
- **Prompt:** "Write at least 8 comprehensive Jest test cases for the ticket ID generator and CSV parser covering success and error scenarios."
- **AI Response Summary:** Generated structured Jest test suites with mock file setup and teardown (`fs.writeFileSync` / `fs.unlinkSync`).
- **Changes Made:** Added `ticket.test.ts` with 8 passing test cases.
- **Reasons for Changes:** To ensure code reliability, catch regression bugs, and satisfy the Day 5 verification checklist.
- **Verification Steps:** Executed `npx jest` and verified all 8 test cases passed successfully.