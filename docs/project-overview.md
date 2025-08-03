# Project: SecCheck

SecCheck is a web-based automated security testing tool that scans public-facing websites for common vulnerabilities based on the OWASP Top 10. Users can input a public URL and receive an actionable security report. The platform prioritizes safe, non-invasive testing and maps all findings to OWASP categories.

---

- Landing Page (Modern Resend is a reference of what we want as layout, not the same, but as a reference)
    - Input to URL
    - Auth to App
- App/Dashboard (Authorized users only)

## 🧠 Goals

- Let users input a URL and receive an instant security vulnerability scan  
- Run passive and safe active tests via headless browser & HTTP client  
- Tag each vulnerability with OWASP Top 10 reference  
- Generate a clean and actionable security report  
- Allow report history and scan limits based on plan  

---

## 🔧 Tech Stack

### Frontend
- Framework: `Next.js` (App Router)
- Language: `TypeScript`
- Database: `Supabase + Drizzle`
- Styling: `Tailwind CSS`
- Components: `Shadcn`
- Auth: `NextAuth`
- Features:
  - Domain input form
  - Scan trigger + feedback
  - Dashboard for past reports
  - Report viewer with OWASP tags

### Backend
- Runtime: `Node.js` (Next.js API)
- Browser engine: `Playwright`
- Scan queue: `BullMQ` (Redis)
- Scan workers: Docker containers (deployed to Fly.io)
- Modules: Vulnerability tests written in TypeScript
- Report generation logic

### Infrastructure
- Hosting: Vercel (frontend & API)
- Scan Workers: Fly.io (Docker runtime)
- Database: Supabase (PostgreSQL)
- Storage: Supabase (for archived reports)
- Queue Host: Upstash Redis

---

## 📦 MVP Features

Each feature maps to OWASP Top 10 categories.

| Feature | OWASP | Description |
|--------|--------|-------------|
| ✅ Bearer Token Leakage Detection | A07 | Detect `Authorization` headers or tokens in responses |
| ✅ Security Header Audit | A05 | Check headers like CSP, HSTS, X-Frame-Options |
| ✅ Cookie Security Flags | A07 | Check for `Secure`, `HttpOnly`, `SameSite` flags |
| ✅ CORS Policy Analysis | A05 | Identify insecure wildcard or credential policies |
| ✅ Directory Exposure Guess | A05 | Try common paths like `/admin`, `/.env`, `.git/` |
| ✅ .env / .git Detection | A05 | Detect secrets or source code leaks |
| ✅ Token Leakage in HTML/JS | A07 | Regex match for API keys or tokens |
| ✅ Passive XSS Test | A03 | Inject `<script>` into query params and check reflection |
| ✅ TLS/SSL Check | A02 | Use public APIs to analyze HTTPS config |
| ✅ Outdated JS Library Detection | A06 | Match versions against CVE database |
| ✅ SQL Injection Test (Basic) | A03 | Test `' OR 1=1 --` in query params and detect anomalies |
| ✅ Reflected Input Validation | A03 | Flag echoed user input |
| ✅ SSRF Parameter Warning | A10 | Warn about `?url=` or `?redirect=` parameters |

---

## 🧪 API Endpoints

- `POST /api/scan` – Trigger scan for a target URL  
- `GET /api/report/:id` – Retrieve scan report  
- `POST /api/verify/domain` – Upload verification HTML or DNS record  
- `GET /api/verify/check?url=` – Check verification status  

