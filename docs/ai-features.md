# SupportDesk — AI Features Documentation

## 1. Overview & Purpose

SupportDesk includes two AI-assisted workflows designed to speed up ticket triage and response drafting while keeping human agents in control:

1. **AI Auto-Categorisation & Priority Prediction:** Analyzes a support ticket's title and description to suggest a structured category and priority level.
2. **AI Suggest Reply:** Generates a tone-aware draft reply (`Professional`, `Empathetic`, `Short & Direct`) for agents to review, edit, and manually post—nothing is sent automatically.

---

## 2. User Flows & Backend Endpoints

### Auto-Categorisation & Priority Prediction
* **User Flow:** An authenticated user/agent triggers categorisation from the ticket workflow/API; the backend validates access, applies guardrails and PII masking, runs the categorisation logic, validates the output schema, and returns the structured classification.
* **Endpoint:** `POST /tickets/:id/ai/categorize` (authenticated; subject to per-user AI rate limiting).

### Suggest Reply
* **User Flow:** An agent opens a ticket, selects a reply tone, and requests a suggested reply. The backend applies guardrails, masks PII before model invocation, streams/returns the draft response, and displays it in an editable review box with a manual fallback if AI is unavailable.
* **Endpoint:** `POST /tickets/:id/ai/suggest-reply` (authenticated; supports streaming responses; subject to per-user AI rate limiting).

---

## 3. Prompt Templates, Versions & Instructions

* **Template Location:** `<update with your AI prompt/service files, e.g., apps/api/src/ai/>`
* **Prompt Version:** `<update with your version identifier, e.g., v1.0.0 / day17-guardrailed>`
* **Instruction Summary:**
  * Untrusted ticket content is wrapped inside explicit structural delimiters and bounded in length so user text cannot override system or developer instructions.
  * Categorisation instructs the model to classify strictly into supported categories/priorities based on ticket intent rather than user-supplied priority strings.
  * Suggest-reply instructs the model to produce a helpful, non-committal draft aligned with the requested tone without fabricating policies or leaking internal prompts.

---

## 4. Input / Output Schemas & Zod Validation

* **Input Context:** Ticket identifier, ticket title/description (sanitized, length-bounded, delimiter-wrapped, and PII-masked), and optional tone/options for reply suggestions.
* **Output & Zod Validation:**
  * Model responses are validated against strict **Zod** schemas before returning data to clients.
  * If model output fails Zod schema validation (malformed JSON, missing fields, or invalid enum values), the backend rejects/handles the invalid output safely and falls back to safe/manual handling rather than passing raw untrusted output to the UI.

---

## 5. Guardrails & Where They Are Enforced

* **Prompt Guard (`promptGuard`):** Wraps untrusted ticket text in delimiters and enforces input length limits before assembling prompts so instruction-override or prompt-injection attempts do not alter system behavior.
* **PII Masking (`piiMasker`):** Redacts/masks sensitive personal details (such as emails and phone numbers) before sending ticket text to external AI endpoints or logging sensitive payloads.
* **Moderation / Safety Checks:** Screens inputs/outputs for unsafe or disallowed content and handles flagged or blocked cases safely.
* **Per-User Rate Limiting (`aiRateLimiter`):** Enforces per-user request limits (`AI_RATE_LIMIT_MAX` within `AI_RATE_LIMIT_WINDOW_MS`, default `10` requests per `60000` ms / 1 minute) and returns HTTP `429` (`RATE_LIMITED`) when exceeded.

---

## 6. Error Handling, Timeouts & Manual Fallback

* **Rate Limits (`429`):** Exceeding the per-user quota returns `429` (`RATE_LIMITED`) using the standard API error response shape.
* **Timeouts & Provider Errors:** Upstream timeouts, network/provider failures, moderation blocks, or invalid model outputs are caught cleanly without crashing the API or blocking standard ticket CRUD, comments, or status updates.
* **Manual Fallback:** When AI generation fails or is unavailable, the UI/service falls back safely (e.g., `"AI unavailable — reply manually."`) so agents can write and post replies manually.

---

## 7. Evaluation Results & Known Failure Cases

* **Dataset & Method:** Evaluated categorisation against a **20-ticket** labelled dataset (`evalCategorisation.ts`).
* **Accuracy Result:** **95% accuracy (19/20)**, meeting the evaluation threshold (`>= 80%`).
* **Known Failure / Mismatch (`T-12`):**
  * **Root Cause (RCA):** Intent/category boundary overlap—the ticket wording sat close to adjacent category definitions, leading to a single label mismatch.
  * **Planned Refinement:** Clarify category boundary definitions and add targeted examples for overlapping intents, then re-run evaluation to confirm zero regressions.

---

## 8. Known Limitations, Risks & Next Improvements

* **Limitations & Risks:**
  * Edge-case intent overlap (such as `T-12`) can still cause occasional misclassifications on ambiguous tickets.
  * Heuristic/regex PII redaction may miss unusual formats or domain-specific identifiers; avoid pasting sensitive secrets in free text.
  * In-memory or single-instance rate limiting may behave differently across multiple instances if scaled horizontally.
* **Recommended Improvements:**
  * Expand the evaluation set beyond 20 tickets and add regression fixtures for ambiguous/overlapping cases.
  * Strengthen PII pattern coverage and audit logs to ensure sensitive fields are never persisted unnecessarily.
  * Add observability/metrics for AI latency, fallback rates, and `429` occurrences.

---

## 9. Setup & Configuration (No Secrets)

Configure environment variables in your local `.env` file (never commit real API keys or secrets):

* `OPENAI_API_KEY` — Your AI provider API key (keep secret locally).
* `AI_RATE_LIMIT_MAX` — Maximum AI requests per user per window (default: `10`).
* `AI_RATE_LIMIT_WINDOW_MS` — Rate-limit window in milliseconds (default: `60000`).

Run the API and web app locally following the repository setup instructions, and verify endpoints and UI workflows after starting both services.