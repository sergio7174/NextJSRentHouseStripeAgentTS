<h1 align="center">NEXT HOUSE RENTING WITH DEEP AGENT</h1>
<h4 align="center">Full-stack house rental application with Stripe Checkout &amp; Webhooks, TypeScript LangGraph HITL Agent, Security Hardening, Observability, Docker Compose, and GitHub Actions CI</h4>
<h4 align="center">Built with Next.js, TypeScript, Node.js (Express), MongoDB, Stripe, OpenTelemetry, Pino, LangSmith, Docker, and LangGraph</h4>

<p align="center">
  <a href="#-configuration--setup">Configuration &amp; Setup</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-stripe-checkout--webhook-flow">Stripe Payments</a> •
  <a href="#-core-agent-features--architecture">AI Helper Agent</a> •
  <a href="#-security-hardening--debugging">Security &amp; Debugging</a> •
  <a href="#-observability-logging-tracing--llm-traces">Observability</a> •
  <a href="#-docker--github-actions-ci">Docker &amp; CI</a> •
  <a href="#-technologies-used-">Technologies Used</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-author">Author</a>
</p>

![Status project](https://img.shields.io/badge/STATUS-Active%20Development-GREEN?style=for-the-badge)

## 🔌 Technologies Used ✔️

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![LangGraph](https://img.shields.io/badge/LangGraph-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python%203.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?style=for-the-badge&logo=opentelemetry&logoColor=white)
![Pino](https://img.shields.io/badge/Pino-92A500?style=for-the-badge&logo=node.js&logoColor=white)
![LangSmith](https://img.shields.io/badge/LangSmith-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-6366F1?style=for-the-badge&logo=openai&logoColor=white)

---

## 🛠️ Tech Stack &amp; Architecture

- **Frontend (`:3000`)**: Next.js (App Router / Pages Router), React, TypeScript, Redux Toolkit, Bootstrap / CSS Modules, `PayNowButton`, `/booking/success` &amp; `/booking/cancel` pages, `AiChatWidget` with HITL interactive cards, and Next.js server `instrumentation.ts`.
- **Backend API &amp; TypeScript Agent (`:3001`)**: Node.js + Express backend handling house listings (`House`), bookings (`Booking` / `bookingdetails`), admin/owner/tenant workflows, TypeScript LangGraph agent routes (`/api/agent/turn`) with tenant-scoped thread IDs (`scopedThreadId`) and `interrupt()` / `Command({ resume })`, Zod request/query validation, Express 5-safe in-place sanitization, Stripe Checkout (`POST /create-checkout-session`), raw-body Stripe webhook processing (`POST /api/payments/webhook`), `pino` / `pino-http` structured logging, and OpenTelemetry tracing (`instrumentation.ts`).
- **AI Helper Service (`:8000`)**: Python 3.13, FastAPI (SSE streaming &amp; `/api/agent/turn`), LangGraph / Deep Agents, `MemorySaver` checkpointer keyed on `thread_id`, `httpx`, and `pytest` + `pytest-asyncio`.
- **Database**: MongoDB storing users, house listings, and bookings (`bookingdetails` with fields such as `paymentStatus` / `paymentstatus`, `stripeSessionId`, and `paidAt`).
- **Containers &amp; CI**: Multi-stage Dockerfiles, `docker-compose.yml` (with `host.docker.internal` support for local MongoDB), and GitHub Actions CI (`.github/workflows/ci.yml`).

---

## 📸 Screenshots

📸
<br>
<img src="./SYSTEM IMAGES/ADMINDASHBOARD01.jpg" alt="project screenshot01" />
<img src="./SYSTEM IMAGES/ADMINDASHBOARD02.jpg" alt="project screenshot02" />
<img src="./SYSTEM IMAGES/ADMINDASHBOARD03.jpg" alt="project screenshot03" />
<img src="./SYSTEM IMAGES/ADMINDASHBOARD04.jpg" alt="project screenshot04" />
<img src="./SYSTEM IMAGES/MAINDASBOARD.jpg" alt="project screenshot05" />
<img src="./SYSTEM IMAGES/OWNERDASBOARD01.jpg" alt="project screenshot06" />
<img src="./SYSTEM IMAGES/OWNERDASBOARD02.jpg" alt="project screenshot07" />
<img src="./SYSTEM IMAGES/OWNERDASBOARD03.jpg" alt="project screenshot08" />
<img src="./SYSTEM IMAGES/OWNERDASBOARD04.jpg" alt="project screenshot09" />
<img src="./SYSTEM IMAGES/OWNERDASBOARD05.jpg" alt="project screenshot10" />
<img src="./SYSTEM IMAGES/OWNERDASBOARD06withagent.jpg" alt="project screenshot11" />
<img src="./SYSTEM IMAGES/TENANTDASBOARD01.jpg" alt="project screenshot12" />
<img src="./SYSTEM IMAGES/TENANTDASBOARD02.jpg" alt="project screenshot13" />

<br>

---

## 🔑 Key Features

- **Role-Based Rental Workflows**: Support for Tenant, Owner, and Admin flows—browsing and managing houses, bookings, maintenance requests, and accounts.
- **Stripe Checkout &amp; Idempotent Webhooks**: Creates Stripe Checkout sessions from booking/house pricing, redirects via `PayNowButton`, handles `/booking/success` and `/booking/cancel`, verifies `stripe-signature` using `express.raw({ type: "application/json" })`, checks `session.payment_status === "paid"`, and prevents duplicate updates on retries.
- **TypeScript LangGraph HITL Agent (`scopedThreadId` + `interrupt()` / `Command({ resume })`)**: Isolates threads per tenant (`<tenantId>::<threadId>`), pauses before write actions (`create_booking`, `create_house_listing`) for explicit human approval or rejection, and logs structured domain IDs (`scopedThreadId`, `bookingId`, `houseCode`) without dumping raw payloads.
- **Security Policy &amp; Validation**: Enforces `Zod` schema and Mongoose `ObjectId` checks across routes and controllers, applies Express 5-safe in-place sanitization on `body`, `params`, `headers`, and `query`, restricts CORS origins, and redacts sensitive headers (`authorization`, `cookie`, `stripe-signature`) in logs.
- **Structured Logging, Distributed Tracing &amp; Debugging**: Combines `pino` + `pino-http` logs, OpenTelemetry `traceId`/`spanId` context injection, LangSmith tracing metadata (`tenant_id`, `raw_thread_id`, `is_resume`), and local VS Code / terminal debugging workflows.
- **Containerized Local Run (`Docker Compose`) &amp; Automated CI (`GitHub Actions`)**: Runs services cleanly via `docker compose up --build` and validates changes on `push` and `pull_request` to `main`.

---

## 💳 Stripe Checkout &amp; Webhook Flow

1. **Create Session (`POST /create-checkout-session`)**: Looks up the tenant's target booking and resolves the matching `House` (checking `House.findById` with fallback to `{ houseId }`), computes `unit_amount` in cents, creates the Stripe Checkout Session with `metadata: { bookingId }`, saves `stripeSessionId`, and returns `{ url, sessionId }`.
2. **Frontend Redirect &amp; Return Pages**: `PayNowButton` calls the backend and redirects to Stripe Checkout, returning to `/booking/success?session_id={CHECKOUT_SESSION_ID}` or `/booking/cancel?booking_id=...` on `:3000`.
3. **Webhook Verification &amp; Idempotency (`POST /api/payments/webhook`)**: Registered with `express.raw({ type: "application/json" })` before global JSON body parsers and sanitization middleware, verifies `stripe-signature` via `STRIPE_WEBHOOK_SECRET`, confirms `session.payment_status === "paid"`, skips already-paid sessions idempotently, and sets `paymentStatus: "paid"`, `paymentstatus: "paid"`, `stripeSessionId`, and `paidAt`.

For local webhook forwarding with Stripe CLI:

```powershell
stripe listen --events checkout.session.completed --forward-to localhost:3001/api/payments/webhook

```🤖 Core Agent Features & Architecture

    Tenant-Isolated Checkpointed Threads: Builds scopedThreadId from tenant context and raw thread_id so conversations and interrupted states stay isolated across tenants.

    Human-in-the-Loop (HITL) Approval / Rejection: High-impact write tools (create_booking, create_house_listing) interrupt execution and resume via Command({ resume }) upon user approval or rejection in the frontend chat widget or API client.

    Observability Metadata: Attaches tenant_id, raw_thread_id, and is_resume to LangSmith runs while keeping logs focused on domain IDs and counts.

``` 🛡️ Security Hardening & Debugging

    Middleware Order in server.ts: Mounts raw Stripe webhook handling first, followed by JSON/URL-encoded parsing (1mb limit), JSON syntax error handling (400 on malformed JSON), Express 5-compatible in-place sanitization, and application routes.

    Input Validation: Validates IDs and query/body parameters with Zod and Mongoose ObjectId checks, returning structured 400 responses on invalid inputs.

    Secret Hygiene: All .env files are excluded via .gitignore; only .env.example with placeholder values is committed to version control.

    Local Debugging: Supports running Express with npx tsx --import ./instrumentation.ts server.ts (or npx tsx server.ts), Next.js with npm run dev, and inspecting live pino-http logs (method, url, statusCode, responseTime) alongside browser DevTools network and console diagnostics. 

```📡 Observability (Logging, Tracing & LLM Traces)

    pino & pino-http: Logs structured request/response details and controller outcomes (info, warn, error) with pino-pretty in local development and automatic redaction of authorization, cookie, and stripe-signature.

    OpenTelemetry (instrumentation.ts): Preloads NodeSDK before Express startup (and registers in Next.js Node runtime) to inject active traceId and spanId values into pino logs via a mixin. Set OTEL_EXPORTER_OTLP_ENDPOINT when exporting traces to a local or remote OTLP collector.

    LangSmith (LANGSMITH_TRACING=true): Captures LangGraph node execution, tool calls, HITL interrupts/resumes, and tenant/thread metadata. 


```⚙️ Configuration & Setup

    Copy .env.example to .env in backend/ and populate your local credentials:

Fragmento de código

# Server & Database
MONGO_URI="mongodb://localhost:27017/rentahouse01"
PORT=3001
MODE="DEVELOPMENT"
JWT_SECRETKEY="replace_with_a_strong_random_secret"
CLIENT_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"

# Stripe Payments
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"

# LLM Providers & Agent Tenant Config
OPENAI_API_KEY="sk-proj-your_openai_api_key"
OPENROUTER_API_KEY="sk-or-v1-your_openrouter_api_key"
DEFAULT_TENANT_ID="default-tenant"

# Observability (Logging, OpenTelemetry & LangSmith)
LOG_LEVEL="info"
OTEL_SERVICE_NAME="nexthouserenting-backend"
# OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
LANGSMITH_TRACING="true"
LANGSMITH_API_KEY="lsv2_your_langsmith_api_key"
LANGSMITH_PROJECT="nexthouserenting-agent"

    Install dependencies and run locally:

PowerShell

# Backend (:3001)
cd backend
npm install
npx tsx --import ./instrumentation.ts server.ts

# Frontend (:3000)
cd ..
npm install
npm run dev

    Verify .gitignore before pushing to GitHub:

PowerShell

git status --ignored

```🐳 Docker & GitHub Actions CI

    Docker Compose: Builds and runs containerized services together (rentahouse-backend on :3001 and rentahouse-frontend on :3000) with host.docker.internal support for local MongoDB:
    PowerShell

    docker compose up --build

```👤 Author

Sergio Moncada — Full-Stack & AI Agent Developer