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

## Project Progress Tracking

### 🎯 Status Legend
- ✅ **COMPLETED** - Feature fully implemented and tested
- 🚧 **IN PROGRESS** - Currently being developed
- ⏳ **PLANNED** - Scheduled for implementation
- 🧪 **TESTING** - Implementation complete, testing in progress
- ❌ **BLOCKED** - Waiting on dependencies or decisions

### 📋 Implementation Status

#### **Frontend Development**
| Component | Status | Notes |
|-----------|--------|-------|
| Landing Page | ✅ | Complete with hero, features, pricing, FAQ sections |
| Navigation Bar | ✅ | Responsive navbar with logo and navigation |
| Dark Theme UI | ✅ | Custom dark theme with gradients and animations |
| Responsive Design | ✅ | Mobile-first responsive layout |
| Framer Motion Animations | ✅ | Smooth animations throughout |
| Shadcn Components | ✅ | Button, Input, Card components integrated |
| Dashboard Layout | ⏳ | User dashboard for scan history |
| Report Viewer | ⏳ | Component to display security reports |
| Authentication UI | ⏳ | Sign in/up forms and user management |

#### **Backend API Development**
| Endpoint | Status | OWASP Category | Notes |
|----------|--------|----------------|-------|
| `POST /api/scan` | ⏳ | - | Trigger scan endpoint |
| `GET /api/report/:id` | ⏳ | - | Retrieve scan results |
| `POST /api/verify/domain` | ⏳ | - | Domain verification |
| `GET /api/verify/check` | ⏳ | - | Check verification status |
| Bearer Token Detection | ⏳ | A07 | Detect Authorization headers/tokens |
| Security Header Audit | ⏳ | A05 | CSP, HSTS, X-Frame-Options |
| Cookie Security Flags | ⏳ | A07 | Secure, HttpOnly, SameSite |
| CORS Policy Analysis | ⏳ | A05 | Wildcard/credential policies |
| Directory Exposure | ⏳ | A05 | /admin, /.env, .git/ detection |
| Token Leakage (HTML/JS) | ⏳ | A07 | Regex match for API keys |
| Passive XSS Test | ⏳ | A03 | Script injection in query params |
| TLS/SSL Check | ⏳ | A02 | HTTPS configuration analysis |
| Outdated JS Libraries | ⏳ | A06 | CVE database matching |
| SQL Injection Test | ⏳ | A03 | Basic injection testing |
| Reflected Input Validation | ⏳ | A03 | Echo detection |
| SSRF Parameter Warning | ⏳ | A10 | URL/redirect parameter analysis |

#### **Infrastructure & Services**
| Service | Status | Notes |
|---------|--------|-------|
| Next.js Setup | ✅ | Project initialized with TypeScript |
| Vercel Deployment | ✅ | Frontend hosting configured |
| Supabase Database | ✅ | PostgreSQL database configured with schema |
| Drizzle ORM | ✅ | Schema and migrations setup complete |
| NextAuth Integration | ⏳ | User authentication system |
| Playwright Setup | ⏳ | Headless browser automation |
| BullMQ Queue System | ⏳ | Redis-based job queue |
| Fly.io Workers | ⏳ | Docker containers for scanning |
| Upstash Redis | ⏳ | Queue and caching infrastructure |

#### **Security Testing Modules**
| Module | Status | Priority | Dependencies |
|--------|--------|----------|--------------|
| HTTP Client Scanner | ⏳ | High | Playwright setup |
| Browser Automation | ⏳ | High | Playwright, Docker |
| Report Generation | ⏳ | High | Database, templates |
| Domain Verification | ⏳ | Medium | File upload, DNS |
| Rate Limiting | ⏳ | Medium | Redis, API setup |
| User Management | ⏳ | Medium | NextAuth, database |
| Scan History | ⏳ | Low | Database, dashboard |
| API Rate Limits | ⏳ | Low | User tiers, Redis |

### 🎯 Current Sprint Goals

**Sprint 1: Core API Foundation**
- [ ] Set up Supabase database and schema
- [ ] Implement basic scan API endpoint
- [ ] Create first security test module (header audit)
- [ ] Set up Playwright for browser automation

**Sprint 2: Security Testing Suite**
- [ ] Implement OWASP Top 10 testing modules
- [ ] Create report generation system
- [ ] Add domain verification system
- [ ] Basic dashboard for scan results

**Sprint 3: Production Ready**
- [ ] User authentication and management
- [ ] Rate limiting and user tiers
- [ ] Deploy scanning workers to Fly.io
- [ ] Production deployment and monitoring

### 🚨 Current Blockers
- None identified - infrastructure ready for backend development

### 📝 Next Actions  
1. ✅ ~~Set up Supabase database~~ - **COMPLETED**
2. ✅ ~~Create database schema for scans, reports, and users~~ - **COMPLETED**
3. ✅ ~~Set up Drizzle ORM with migrations~~ - **COMPLETED**
4. Create first API endpoint `/api/scan` with basic structure  
5. Implement security header audit as first testing module
6. Set up Playwright for automated browser testing

### 🗄️ Database Schema
**Tables Created**:
- `users` - User accounts with plans and limits
- `domains` - Domain verification for authenticated scans  
- `scans` - Scan requests and metadata
- `scan_results` - Individual vulnerability findings
- `reports` - Generated security reports
- `api_keys` - API access management
- `usage_stats` - Rate limiting and analytics

### 🧪 Testing Strategy
- Unit tests for individual security test modules
- Integration tests for API endpoints
- E2E tests for scan workflow
- Security testing on controlled test sites
- Performance testing for scan speed