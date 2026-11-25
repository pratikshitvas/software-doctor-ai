# Software Doctor AI

**Detect. Diagnose. Repair. Prevent.**

A JavaScript monorepo for a software reliability assistant. This repository is under active implementation. The available code provides working local foundations for account verification, AI investigations, monitoring ingestion, and web/desktop/mobile clients. It is not yet a production-ready commercial SaaS; unfinished integrations are listed below.

## What works in this implementation

- Responsive React dashboard with registration, sign-in, email verification, account deletion, project creation, live incident list/status updates, investigation history, and credit display.
- Express API with Argon2id password hashes, short-lived JWT access tokens, hashed refresh tokens with rotation/replay-family revocation, request validation, security headers, and rate limits.
- Prisma/PostgreSQL schema for users, organizations, projects, incidents, investigations, credit ledger, subscriptions, payments, audit events, and related records.
- Exactly two initial credits are granted when email verification succeeds. AI investigations reserve credits server-side; successful schema-valid reports consume one credit; failures release the reservation.
- OpenAI-compatible real analysis (OpenAI or compatible endpoint such as local Ollama) with strict Zod report validation. No fabricated report fallback.
- Project scoped, one-time display monitoring keys; Node/browser global exception and rejection capture; common-secret redaction; repeated-error grouping; incident list and status updates.
- Electron wrapper with context isolation, renderer Node access disabled, sandboxed renderer, narrow preload IPC, tray menu, notifications, and Windows NSIS build configuration.
- Expo iOS/Android incident inbox, login, secure token storage, and refresh.
- Built-in Node tests and CI workflow for schema generation, tests, and web production build.

## Still not implemented

- Password reset, Google OAuth, team invitations/organization authorization, and platform-admin console.
- Payment checkout/webhooks, subscription activation/refunds, Google Play Billing and Apple IAP.
- GitHub App/OAuth, commit regression analysis, patch downloads, and pull request creation.
- Persistent background queue, SSE updates, push/email incident alerts, SDK latency/HTTP instrumentation, offline buffering, and dependency risk analysis.
- Full admin metrics, cost tracking, retention management, and operations controls.
- Electron local project picker and Git inspection. Mobile is a focused incident-review app rather than full feature parity.
- Production migration history and managed deployment configuration.

Do not treat the included plans or UI labels as a functioning checkout. No payment is collected. AI-generated patches are not applied, deployed, or merged. The app never executes uploaded source code. Reports label verification as **Not executed**.

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (installed locally or hosted; Docker is not required)
- OpenAI API key or OpenAI-compatible AI service to run real investigations
- SMTP account for email verification outside development

## Windows 10/11 local setup

### 1. Configure the API

Copy `apps/api/.env.example` to `apps/api/.env`. Set at least:

- `DATABASE_URL` to your PostgreSQL database
- `JWT_ACCESS_SECRET` to a long random value (32+ random bytes)
- `OPENAI_API_KEY` for a real hosted AI provider
- `OPENAI_BASE_URL` and `OPENAI_MODEL` if using Ollama or another compatible server

For Ollama, use its OpenAI-compatible endpoint and a model installed on your machine. The software does not install or download models automatically.

During local development only, when SMTP is unset, the API prints the verification URL to its terminal. In production configure SMTP before allowing registration.

### 2. Install, create the database schema, and start web/API

From the repository root in PowerShell:

```powershell
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Open the Vite URL printed in the terminal (normally http://localhost:5173). The API listens on http://localhost:4000.

### 3. Create and verify an account

- Choose **Create an account** and submit an email, name, and password with at least 12 characters.
- Copy the verification URL printed by the API terminal. Open it in the browser. The page should show the email verification form with the token prefilled; if not, paste only the token value into that form.
- Sign in after verification. Your dashboard should show two free investigations.

### 4. Test AI investigation

- Paste a real or sample error into **AI Doctor** and optionally include the relevant code.
- Select **Analyze error**.
- Confirm the report has summary, severity, evidence, test recommendations, risk, missing context, and a proposed diff where the model has enough information.
- Confirm the report says **Not executed**. The product does not run source code or claim tests passed.
- Confirm credits decrease only after a schema-valid successful report. A provider/configuration failure should leave credits available.

### 5. Test project monitoring

- Open **Projects**, create a project, and copy its one-time ingestion key. The key is only returned when created or rotated.
- Install the workspace SDK in a sample app and initialize it with project ID, key, and API endpoint.
- Trigger an uncaught error or call `SoftwareDoctor.capture({ message: "sample failure" })`.
- Open **Incidents** and verify the error appears; send the same event again and verify the event count increases instead of creating another incident.
- Change its state and refresh to confirm it persisted.

### 6. Test native shells

**Desktop:** keep `npm run dev` running, then in another PowerShell terminal run `npm run dev:desktop`. To create a Windows installer run `npm run build:desktop`. macOS packaging requires a Mac; code signing requires Apple Developer credentials.

**Android:** set `EXPO_PUBLIC_API_URL` to an API address reachable from your emulator/device. Android emulator access to the host machine usually uses `http://10.0.2.2:4000` rather than localhost. Then run `npm run dev:mobile` or `npm run build:android`. iOS builds require macOS/Xcode or a supported cloud build account.

## Tests and CI

Run `npm test` for the API security helper and SDK redaction tests. Run `npm run build:web` for the web production build. The GitHub Actions workflow runs Prisma client generation, tests, and the web build on pushes and pull requests. These checks do not verify live AI, SMTP, PostgreSQL data flows, payments, GitHub access, or native signing.

## Security notes

- Never commit `.env` files or expose provider/payment keys in client code.
- The monitoring ingestion key is a project credential; store it in an app deployment secret. Rotate it if exposed.
- Source code and logs are sent to the configured AI provider when analysis is requested.
- Redaction covers common credential formats, not every possible secret. Review inputs before sending.
- Browser sessions currently live in memory; mobile refresh/access tokens use Expo SecureStore.
- No server-side code runner is configured. Do not add execution on the API host.

## Current architecture

```
apps/api                 Express, Prisma, authentication, AI, monitoring
apps/web                 React/Vite dashboard and investigation client
apps/desktop             Electron wrapper for the web client
apps/mobile              Expo incident review client
packages/monitoring-sdk  Browser/Node error capture
database                 PostgreSQL setup documentation
```
