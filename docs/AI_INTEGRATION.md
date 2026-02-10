# AI Integration (Google Gemini)

## Overview

ScopeLedger uses **Google Gemini** (`@google/generative-ai`) for optional, explainable AI features. AI never mutates data on its own; all suggestions are advisory, and users explicitly apply any changes.

## Configuration

- **API key:** Set `VITE_GEMINI_API_KEY` in your environment. If unset, AI features are disabled and the UI shows a clear message.
- **Model:** `gemini-1.5-flash` (fast, cost-effective).

## Features

1. **Budget / financial health**
   - Prompt: *"Explain this project's financial health."*
   - Context: cost-to-date, total budget, remaining budget, burn rate, baseline.
   - Output: 2–4 sentence summary. No data changes.

2. **Forecast / completion risk**
   - Prompt: *"Assess forecast completion risk."*
   - Context: same project metrics.
   - Output: Short risk assessment. No data changes.

3. **Monthly spending summary**
   - Prompt: *"Summarize monthly spending."*
   - Context: project data (e.g. costs, dates).
   - Output: Factual summary. No data changes.

4. **Custom / natural language**
   - Support for custom prompts and Q&A over project context.
   - All responses are explainable (e.g. "This insight was generated from the project data you provided. No data was modified.").

## Implementation

- **Module:** `src/ai/gemini.ts`
- **Usage:** `getAIInsight(req, context)` returns `{ summary, explainable, suggestedActions? }`.
- **UI:** Overview tab "Explain this project's financial health" and Forecast tab use these insights. Results are displayed in-app; no silent writes.

## Security and privacy

- The API key is used client-side. For higher sensitivity, consider a backend proxy that calls Gemini and forwards only sanitized context.
- Only project-level metrics and non-PII context are sent. No raw user credentials or unrelated data.

## Optional and explainable

- AI is **optional**: the app works fully without Gemini.
- All insights are **explainable**: users see how they were produced and that no data was changed automatically.
