# Antigravity 2.0 - Deployment & Setup Guide

This guide describes how to run and deploy **Antigravity 2.0** (both locally and to production on Vercel).

---

## 🛠️ Technology Stack
* **Framework**: React / TanStack Start
* **Database & Realtime**: Supabase (PostgreSQL)
* **Styling**: Tailwind CSS
* **Audio Engine**: Web Audio API (in-browser synthesizer effects)

---

## ⚙️ Prerequisites
* **Node.js**: v18.0.0 or higher
* **Package Manager**: npm or bun
* **Hosting**: Vercel Account (free tier)
* **Database**: Supabase Account (free tier)

---

## 💻 Local Environment Setup

### 1. Install Dependencies
Run the install command inside the project directory:
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env` in the root of the project and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://kvocoscsioezfylzxbwf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2b2Nvc2NzaW9lemZ5bHp4YndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Mzk1NjMsImV4cCI6MjA5ODUxNTU2M30.OrDW6bAaHecadIfjpvijbIfjZG4Ky6sywa3yTJALoBE
```

### 3. Start Local Development Server
Launch the development environment:
```bash
npm run dev
```
The application will be running locally at `http://localhost:8080` (or `http://localhost:5173`).

---

## 🚀 Production Deployment (Vercel)

### 1. Compile Build
Ensure the application builds locally with no syntax errors:
```bash
npm run build
```

### 2. Deploy to Vercel
Deploy directly from your CLI using Vercel:
```bash
npx vercel --prod --yes
```
This builds and deploys your TanStack Start/Nitro server structure directly to your production URL.

---

## ⚠️ Database Pausing (Supabase Free Tier)
Supabase pauses free tier databases if they don't receive queries for more than 7 days.
* **If it gets paused**: Go to your [Supabase Dashboard](https://supabase.com/dashboard) and click **"Restore"** next to the project *Antigravity 2.0*. It will wake up and be online within 2 minutes.
