# Security Policy

## Overview

OMNYX handles device behavior data and routes it through an AI analysis pipeline. Security is a first-class concern throughout the system.

This document covers responsible disclosure, architecture trust boundaries, and safe development practices.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately:

- Open a [GitHub Security Advisory](https://github.com/nagadevikona20max/omnyx/security/advisories/new)
- Or email the maintainer directly (link your GitHub profile in the advisory)

Include in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix if you have one

You will receive a response within 72 hours. Critical vulnerabilities will be prioritized and patched within 7 days.

---

## Supported Versions

| Version | Supported |
|---|---|
| 1.x (main branch) | Yes |
| Older branches | No |

---

## Architecture Trust Boundaries

### Client (Mobile App)

The mobile client is considered an **untrusted environment**. It must never:

- Hold AI provider API keys (Anthropic, OpenAI, etc.)
- Make direct requests to AI providers
- Hold Supabase service role keys
- Store sensitive credentials in AsyncStorage or device state

### Backend Proxy

The backend (`backend/`) is the **security boundary** between the client and AI providers.

All AI requests flow:
```
Mobile Client
  POST /api/ai/analyze (with deviceId + threat data)
    |
  Backend Proxy (validates, sanitizes, rate-limits)
    |
  Anthropic API (API key stored server-side only)
    |
  Validated response returned to client
```

The backend enforces:
- Per-device rate limiting (20 req/hour, 30s cooldown)
- Input validation via Zod before any AI call
- Prompt sanitization (strips injection patterns, control characters)
- Output validation via Zod before returning to client
- Rejection of malformed, unsafe, or hallucinated AI responses

### Prompt Injection Prevention

User-supplied strings (app names, event descriptions, permission lists) are:

1. Sanitized to remove control characters and known injection patterns
2. Passed to the AI as serialized JSON in the **user turn only**
3. Never interpolated into the system prompt
4. Length-limited before processing

The system prompt explicitly instructs the model to ignore any instructions embedded in input data.

---

## Environment Variable Safety

### What must be kept secret

| Variable | Location | Secret? |
|---|---|---|
| `ANTHROPIC_API_KEY` | `backend/.env` | Yes - never commit |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `.env` | Treat as secret |
| `EXPO_PUBLIC_SUPABASE_URL` | `.env` | Treat as secret |

### Rules

- `.env` files are in `.gitignore` and must never be committed
- Only `.env.example` files (with placeholder values only) should exist in the repository
- Run `git status` before committing - look for any `.env` files in the diff
- If you accidentally commit a secret, rotate the key immediately and force-push to remove it from history

### Pre-commit check

Before pushing:

```bash
# Check no .env files are staged
git diff --cached --name-only | grep "\.env$"
# Should return nothing
```

---

## Dependency Security

- Dependencies are pinned in `package.json` and `package-lock.json`
- Run `npm audit` regularly during development
- Do not add dependencies with known critical vulnerabilities
- Backend dependencies are separate from frontend dependencies - keep them that way

---

## Rate Limiting

The backend implements in-memory rate limiting per device:

- 20 requests per hour
- 30-second cooldown between requests
- Requests exceeding limits receive HTTP 429

In production deployments, replace the in-memory limiter with a Redis-backed solution for multi-instance deployments.

---

## Responsible Disclosure Timeline

| Step | Timeline |
|---|---|
| Vulnerability reported | Day 0 |
| Acknowledgment sent | Within 72 hours |
| Patch developed | Within 7 days (critical) / 30 days (moderate) |
| Release published | Immediately after patch |
| Public disclosure | After patch is available |

---

## Out of Scope

The following are not considered security vulnerabilities for this project:

- Issues requiring physical device access
- Social engineering attacks
- Vulnerabilities in third-party dependencies (report those upstream)
- Issues in example/mock data that contain no real credentials
