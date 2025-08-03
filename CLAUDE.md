# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SecCheck is a web-based automated security testing tool that scans public-facing websites for common vulnerabilities based on the OWASP Top 10. Users can input a public URL and receive an actionable security report with safe, non-invasive testing.

## Development Commands

- **Start development server**: `pnpm dev` (uses Turbopack for faster builds)
- **Production build**: `pnpm build`
- **Start production server**: `pnpm start`
- **Lint code**: `pnpm lint`

Uses pnpm as package manager (version 10.10.0+).

## Tech Stack & Architecture

**Frontend (Next.js App Router)**
- Framework: Next.js 15.4.5 with App Router
- Language: TypeScript with strict mode
- Styling: Tailwind CSS v4
- Components: Shadcn (planned)
- Auth: NextAuth (planned)
- Database: Supabase + Drizzle (planned)

**Backend (Next.js API Routes)**
- Runtime: Node.js via Next.js API
- Browser automation: Playwright (planned)
- Job queue: BullMQ with Redis (planned)
- Workers: Docker containers on Fly.io (planned)

**Infrastructure (Planned)**
- Frontend hosting: Vercel
- Workers: Fly.io
- Database: Supabase (PostgreSQL)
- Queue: Upstash Redis

## Project Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/app/page.tsx` - Main landing page
- `src/app/layout.tsx` - Root layout with Geist fonts
- `src/app/globals.css` - Global styles
- `@/*` - TypeScript path alias to `./src/*`

## Key Features to Implement

The MVP includes security tests mapped to OWASP Top 10:
- Bearer token leakage detection (A07)
- Security header audit (A05) 
- Cookie security flags (A07)
- CORS policy analysis (A05)
- Directory exposure detection (A05)
- Token leakage in HTML/JS (A07)
- Basic XSS testing (A03)
- TLS/SSL verification (A02)
- Outdated library detection (A06)
- Basic SQL injection testing (A03)

## API Endpoints (Planned)

- `POST /api/scan` - Trigger security scan for target URL
- `GET /api/report/:id` - Retrieve scan report
- `POST /api/verify/domain` - Upload verification file/DNS record
- `GET /api/verify/check?url=` - Check domain verification status

## Current State

The project is currently a fresh Next.js installation with default template. The main implementation work is yet to begin - currently showing the default Next.js welcome page.