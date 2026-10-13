# CareerPilot AI — Agent Instructions & Architecture Guidelines

## 1. Project Overview & Architecture
CareerPilot AI is an AI-powered career workspace and ATS resume engine with live document generation, application tracking, interview simulation, and roadmap intelligence.

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide React, Motion.
- **Backend Server:** Express 4 with `tsx` (`server.ts`) serving Vite middleware and `/api` REST endpoints.
- **Database & Persistence:** Local JSON persistence fallback (`careerpilot_db.json`) and Supabase (`@supabase/supabase-js`).
- **AI Integrations:** Google GenAI (`@google/genai`), Multi-provider AI Gateway (`src/server/ai/gateway.ts`).

## 2. Core Commands & Workflows
- **Development Server:** `npm run dev` (Starts Express + Vite on port 3000)
- **Type Checking / Lint:** `npm run lint` (`tsc --noEmit`)
- **Production Build:** `npm run build`
- **Preview:** `npm run preview`

## 3. Engineering Rules & Guardrails
- **Zero Hallucination:** Never fake functionality or fabricate dummy state as completed operations.
- **Navigation & Routing Integrity:** Keep URL synchronization in `App.tsx` (`window.history.pushState` / `popstate`). Never use universal homepage redirects as error fallbacks.
- **Explicit Button Types:** Use explicit `type="button"` on actions and `type="submit"` on intended form submissions.
- **Security & Secrets:** Never expose or log `.env` secrets, API keys, or private database credentials.
- **Document Integrity:** Preserve the official Google Doc ATS template (`#1f3864`, Carlito/Calibri, A4 standard).
