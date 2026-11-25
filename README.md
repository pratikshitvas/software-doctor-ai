# Software Doctor AI

**Detect. Diagnose. Repair. Prevent.**

Milestone 1 is a local development foundation: a responsive React workspace and an Express API with a real OpenAI-compatible analysis call. It does not fabricate reports. When no AI credential is configured, analysis returns a clear configuration error. Every report says automated verification was **Not executed**; no supplied code is run or modified.

## Requirements

- Node.js 20 or newer
- npm
- An OpenAI API key or a compatible local provider such as Ollama

## Run on Windows 10/11

1. Copy `.env.example` to `apps/api/.env` and configure `OPENAI_API_KEY`. For Ollama, set `OPENAI_BASE_URL=http://localhost:11434/v1`, `OPENAI_MODEL` to an installed model, and the key to any non-empty local placeholder if your server does not require authentication.
2. From the repository root run:

   ```powershell
   npm install
   npm run dev
   ```

3. Open the Vite URL shown in the terminal (normally http://localhost:5173). The API listens at http://localhost:4000.

To build the web client run `npm run build`.

## Current milestone

- Working manual error/stack-trace analysis UI.
- OpenAI-compatible chat completions integration with JSON response validation.
- API health endpoint and clear unavailable-provider errors.
- Responsive dark dashboard shell.
- Environment template and Windows startup instructions.

Dashboard summary values are explicitly empty states; they are not presented as observed monitoring data. The free-credit display is a UI mock until database-backed accounts and ledger transactions are implemented. Do not use it for billing.

## Roadmap

1. Database-backed API, auth/session security, tenant model, audit trail, and atomic two-investigation credit ledger.
2. Persistent monitoring ingestion SDK and incident grouping.
3. Investigation persistence, repository context, Git regression analysis, patch export and approval.
4. Automated API/client tests and sample deliberately-buggy applications.
5. Desktop Electron shell with hardened preload bridge.
6. Mobile Expo client.
7. Verified sandbox payments and subscription handling.
8. Production deployment, signing, retention, and operational documentation.

## Security and scope

- Never commit secrets; keep credentials in local environment files.
- Treat logs and source code as untrusted input. The model instruction explicitly prevents following embedded instructions, but prompt injection cannot be eliminated by prompting alone.
- Uploaded/source text is sent to the configured AI provider when analysis is requested.
- Analysis is limited by `MAX_ANALYSIS_CHARS`; request bodies are size limited.
- No GitHub access, repository writes, payment processing, account system, persistent queue, database, or code execution is included in this milestone.
- No AI-generated patch is automatically applied, deployed, or merged.

## Architecture

```
apps/
  api/   Express API and AI provider call
  web/   React/Vite interface
```

More packages will be added as each capability is implemented and verified. macOS/iOS builds and signed Windows/macOS packages require platform-specific build environments and credentials.
