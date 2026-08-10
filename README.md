<div align="center">
  <img src="./public/img/logo.png" alt="Los Perris Logo" width="120" />
  <h1>Twitch API & Streamer Dashboard</h1>
  <p><strong>An end-to-end ecosystem for Twitch stream management, chat moderation, and interactive overlays.</strong></p>

  <p>
    <img src="https://img.shields.io/github/actions/workflow/status/Ponss17/twitch_api/ci.yml?branch=master&label=CI&logo=github&style=flat-square" alt="CI Status" />
    <img src="https://img.shields.io/github/actions/workflow/status/Ponss17/twitch_api/codeql.yml?branch=master&label=CodeQL&logo=github&style=flat-square" alt="CodeQL Status" />
    <img src="https://img.shields.io/badge/license-Source--Available-blueviolet?style=flat-square" alt="License: Source-Available" />
    <img src="https://img.shields.io/badge/security%20policy-SECURITY.md-critical?style=flat-square&logo=shield" alt="Security Policy" />
    <img src="https://img.shields.io/badge/platform-Vercel%20%2B%20Supabase-black?style=flat-square&logo=vercel" alt="Platform" />
    <img src="https://img.shields.io/badge/node-22-339933?style=flat-square&logo=node.js" alt="Node 22" />
  </p>
</div>

<br />

<div align="center">
  <img src="./public/img/og-banner.png" alt="Dashboard Preview" width="800" style="border-radius: 8px;" />
</div>

<br />

This repository serves as a **technical showcase** of software architecture, security practices, and full-stack development within the Twitch API ecosystem.

> **⚠️ Source-Available:** This code is distributed under an All Rights Reserved license, strictly for auditing and portfolio purposes. You may **not** copy, use, fork, or deploy it. See [`LICENSE`](./LICENSE) for details.

---

## Table of Contents

- [Feature Set](#comprehensive-feature-set)
- [System Architecture](#system-architecture)
- [Security Implementation](#security-implementation)
- [Testing & CI/CD](#testing--cicd-pipeline)
- [Contributing](#contributing)
- [License](#license)

---

## Comprehensive Feature Set

Unlike standard chat bots, this project is a complete platform that acts as the central nervous system for a Twitch broadcast.

| Feature Category | Description |
| :--- | :--- |
| **Broadcaster Dashboard** | Centralized management portal with secure Twitch OAuth authentication and dynamic UI theming (Light/Dark/Matrix). |
| **Internationalization (i18n)** | The platform's default language is Spanish, but includes native i18n support to switch languages dynamically from the settings. |
| **Interactive Minigames** | Chat modules (Magic 8, Russian Roulette, Duel) plus panel tools (roulette giveaways, trends, stalker, questions). |
| **OBS Integration** | Transparent browser sources for roulette and trends, synced via overlay tokens. |
| **Bot Integration** | URL templates for Nightbot, StreamElements, Fossabot, Wizebot, and Streamlabs; watchtime reads StreamElements public points when available. |

---

## System Architecture

Built using a **Serverless Modular Monolith** pattern, the system balances development velocity with strict domain isolation.

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Astro.js (static), React.js, Tailwind | Static marketing/docs + interactive client islands for the Dashboard. |
| **Backend API** | Express.js (Node.js) | Domain modules for Auth, Commands, Games, and Dashboard on a single Vercel serverless entry. |
| **Database** | PostgreSQL (Supabase) | Primary relational storage. Server uses the service role; authorization is enforced in Express middleware. Realtime clients use scoped JWTs. |
| **State & Cache** | Redis (Vercel KV) + in-process L1 | Ephemeral overlay state, rate limiting, and short-lived response cache. |

---

## Security Implementation

Handling live Twitch interactions and OAuth tokens requires rigorous security measures at the infrastructure level.

| Protection | Implementation Detail |
| :--- | :--- |
| **Token Encryption** | Sensitive OAuth tokens are encrypted at the application level using authenticated cryptography before database insertion. |
| **Row Level Security** | Database queries are bounded by Postgres RLS, ensuring users can only interact with their own channel's data. |
| **HMAC Signatures** | The OAuth flow is protected against MitM and replay attacks using cryptographically signed state parameters. |
| **Anti-CSRF** | Stateful requests are strictly validated against origin headers to prevent Cross-Site Request Forgery. |

For vulnerability reports, please read the [Security Policy](./SECURITY.md) before reaching out.

---

## Testing & CI/CD Pipeline

Reliability is non-negotiable for live streaming tools. The repository enforces a strict continuous integration pipeline:

- **Unit & Integration:** Jest suites covering crypto/HMAC helpers, routing, and core controllers.
- **End-to-End (E2E):** Playwright smoke tests for dashboard auth flows.
- **Static Analysis:** Husky Git hooks prevent commits that fail `@typescript-eslint` rules or TypeScript compilation.

---

## Contributing

This is a **Source-Available** repository. While the codebase is closed for personal or commercial use, we welcome community contributions for improvements and bug fixes.

| What | Accepted? |
| :--- | :---: |
| Bug fixes or improvements via PR | ✅ |
| Bug reports (via GitHub Issues) | ✅ |
| Security vulnerabilities | ✅ (see [SECURITY.md](./SECURITY.md)) |
| Questions / technical discussion | ✅ |

Please read [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md) before opening an issue.

---

## License

Copyright © 2025–2026 [losperris.dev](https://losperris.dev). All Rights Reserved.

This repository is **Source-Available** — viewing is permitted; using, copying, forking, or deploying is not. See the full [`LICENSE`](./LICENSE) for details.
