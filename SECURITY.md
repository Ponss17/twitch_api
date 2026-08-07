# Security Policy

## Supported Versions

This repository is made available for auditing and showcase purposes. It is not distributed as a self-hosted package. The live production environment at [ttv.losperris.dev](https://ttv.losperris.dev) is continuously deployed from the latest commit on `main`.

| Scope | Status |
| :--- | :--- |
| **Live production instance** (`ttv.losperris.dev`) | ✅ Actively maintained |
| **Source code in this repository** | ✅ Actively maintained |
| Older tagged versions / branches | ❌ Not supported |

---

## Reporting a Vulnerability

Security is a top priority for this project. If you believe you have found a security vulnerability, please report it **privately** to ensure it is handled safely and responsibly.

> [!WARNING]
> **Do not report security vulnerabilities through public GitHub issues, comments, or pull requests.** Doing so exposes users of the live service to risk before a fix can be deployed.

### How to Report

Send a direct message on Discord to:

- **Discord:** `ponss17` (or reach out through the official server)

You may also open a [GitHub Private Security Advisory](https://github.com/features/security-advisories) directly on this repository if you prefer a GitHub-native channel.

### What to Include

Please provide as much detail as possible:

- **Description** — What is the vulnerability and what is its potential impact?
- **Steps to reproduce** — A minimal, reliable sequence to trigger the issue.
- **Affected component** — Frontend, backend API, database layer, OAuth flow, etc.
- **Evidence** — Relevant logs, screenshots, or a proof-of-concept (redact any sensitive data).

---

## Response SLA

| Milestone | Target timeframe |
| :--- | :--- |
| Acknowledgement of receipt | ≤ 48 hours |
| Initial triage & severity assessment | ≤ 5 business days |
| Remediation plan communicated | ≤ 7 business days |
| Patch deployed (critical/high severity) | ≤ 14 days from confirmation |

These are best-effort targets for a personal project maintained outside of business hours.

---

## Vulnerability Scope

### In Scope

- Authentication & OAuth flow vulnerabilities (token leakage, MitM, replay attacks)
- Authorization bypass (accessing another user's channel data)
- Injection attacks (SQL injection, XSS, command injection)
- Cryptographic weaknesses in token encryption or HMAC signing
- Sensitive data exposure (secrets, tokens, PII)
- Rate-limiting bypass on the live API

### Out of Scope

- Vulnerabilities in third-party services (Twitch, Supabase, Vercel, Redis)
- Theoretical or purely academic issues with no practical impact
- Denial-of-service attacks against the live service
- Social engineering or phishing attempts
- Issues that require physical access to infrastructure

---

## Hall of Fame

We sincerely appreciate responsible disclosure. Researchers who report valid, in-scope vulnerabilities will be acknowledged here (with your permission).

*No entries yet — be the first!*

---

*Thank you for helping keep this project and its users safe.*
