# CareerPilot AI 🚀

AI-powered career workspace — ATS resume engine, live job feeds, interview simulator, application tracking, and roadmap intelligence.

---

## 🌐 Live Demo

**Frontend (Cloudflare Pages):** https://careerpilot-dic.pages.dev

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│  Cloudflare Pages (Frontend)        │  ← Static React/Vite SPA
│  https://careerpilot-dic.pages.dev  │
└──────────────┬──────────────────────┘
               │ API calls → /api
┌──────────────▼──────────────────────┐
│  Render.com (Backend)               │  ← Express + AI Agents
│  https://careerpilot-api.onrender.com│
└──────────────┬──────────────────────┘
               │ persistence
┌──────────────▼──────────────────────┐
│  Supabase (PostgreSQL)              │  ← User data, resumes, applications
└─────────────────────────────────────┘
```

---

## ⚡ Quick Deploy (Full Stack)

### Step 1: Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New → Blueprint**
2. Connect this GitHub repo
3. Render auto-detects `render.yaml` and creates the `careerpilot-api` service
4. Add these **Environment Variables** in the Render dashboard:

| Variable | Value | Where to get it |
|---|---|---|
| `GEMINI_API_KEY` | `AIza...` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase Dashboard → Settings → API |
| `CORS_ORIGIN` | `https://careerpilot-dic.pages.dev` | Your Cloudflare Pages URL |
| `APP_URL` | `https://careerpilot-dic.pages.dev` | Same |
| `RAPIDAPI_KEY` | `e7e79...` | [RapidAPI → JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) |
| `JSEARCH_RAPIDAPI_KEY` | Same as above | Same |

5. Click **Deploy** — service starts at `https://careerpilot-api.onrender.com`

### Step 2: Set Up Supabase Database

Run these SQL files **in order** in your [Supabase SQL Editor](https://supabase.com/dashboard):

```
1. supabase_schema.sql
2. supabase_schema_v2.sql
3. supabase_schema_patch_v3.sql
4. supabase_schema_patch_v4_roadmaps.sql
5. supabase_schema_patch_v5_onboarding.sql
```

### Step 3: Connect Frontend to Backend

In **Cloudflare Pages** dashboard → Settings → Environment Variables → add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://careerpilot-api.onrender.com` |

Then **redeploy** Cloudflare Pages (or run `npm run deploy`).

---

## 🛠️ Local Development

```bash
# 1. Clone & install
git clone https://github.com/ahmedghannam801/CareerPilot.git
cd CareerPilot
npm install

# 2. Copy env template
cp .env.example .env
# Fill in your API keys

# 3. Start (Express + Vite dev server on port 3000)
npm run dev
```

---

## 🔑 Required API Keys

| Key | Required | Purpose | Free Tier |
|---|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | All AI features | Yes (generous) |
| `SUPABASE_URL` + `SUPABASE_ANON_KEY` | ✅ Yes | Data persistence | Yes (500MB) |
| `RAPIDAPI_KEY` | ⚠️ Optional | Live job feeds | Yes (500 req/mo) |
| `LINKEDIN_CLIENT_ID/SECRET` | ⚠️ Optional | LinkedIn Sign-In | Yes |

---

## 🧪 Diagnostics

```bash
# Check AI models connectivity
npm run check:ai

# TypeScript lint
npm run lint

# Full E2E quality gate
npm run test
```

---

## 📦 Deploy Commands

```bash
# Deploy frontend to Cloudflare Pages
npm run deploy

# Build only
npm run build
```
