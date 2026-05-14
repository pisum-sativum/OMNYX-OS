# Contributing to OMNYX

Thank you for your interest in contributing. OMNYX is an experimental, open-source AI privacy operating system. Every contribution - whether a bug fix, new feature, visual improvement, or documentation update - matters.

This guide helps you get oriented quickly.

---

## Project Philosophy

OMNYX is not a dashboard. It is designed to feel like a **living intelligence system** - atmospheric, reactive, and visually intentional.

Before contributing, internalize these principles:

- **No clutter.** Every element earns its place.
- **No generic UI.** If it looks like a SaaS app, it is wrong.
- **Performance is non-negotiable.** 60fps animations, always.
- **Security is first-class.** Especially in anything touching the AI backend.
- **TypeScript strict mode.** No `any` shortcuts.

---

## Getting Started

### Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/omnyx.git
cd omnyx
npm install
cp .env.example .env
npx expo start
```

### Backend (if working on AI features)

```bash
cd backend
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm run dev
```

### TypeScript Check

Before every PR, run:

```bash
npx tsc --noEmit
```

Zero errors required.

---

## Folder Structure

```
app/                    Screens and navigation (Expo Router)
  (tabs)/               Tab screens
  (auth)/               Auth screens
src/
  components/           Shared UI components
  hooks/                Custom React hooks
  services/             External integrations (AI proxy, Supabase)
  store/                Zustand global state (useAppStore.ts)
  theme/                Theme definitions (5 themes)
  types/                TypeScript interfaces
  events/               Event bus and atmosphere engine
backend/
  src/
    routes/             API handlers
    middleware/         Rate limiting, validation
    services/           AI provider wrappers
    validators/         Zod schemas
    security/           Sanitization, content filtering
```

---

## Branch Naming

```
feat/short-description        New feature
fix/short-description         Bug fix
refactor/short-description    Code cleanup or restructure
docs/short-description        Documentation only
ui/short-description          Visual or animation changes
security/short-description    Security-related changes
```

Examples:
```
feat/swarm-detail-screen
fix/reanimated-opacity-conflict
ui/nebula-orbital-ring-depth
docs/contributing-setup-guide
```

---

## Commit Message Format

```
type: short description in lowercase

Optional body for complex changes.
```

Types: `feat`, `fix`, `refactor`, `docs`, `ui`, `security`, `perf`, `test`

Examples:
```
feat: add per-agent detail screen to swarm view
fix: resolve orbital ring overflow on narrow screens
ui: deepen nebula atmospheric glow layers
docs: expand contributing setup guide
security: add request body size limit to ai proxy
```

No generic commit messages. No "update files". No "fix stuff".

---

## Pull Request Workflow

1. Branch from `main`
2. Keep PRs focused - one concern per PR
3. Run `npx tsc --noEmit` before submitting
4. Include screenshots or screen recordings for any UI changes
5. Describe what changed and why, not just what
6. Link any related issues

### PR Description Template

```
## What
Brief description of the change.

## Why
Motivation. What problem does this solve?

## How
Key implementation decisions.

## Screenshots
(For UI changes - required)
```

---

## Coding Standards

### TypeScript

- Strict mode. No implicit `any`.
- Prefer `type` over `interface` for simple shapes.
- Use explicit return types on all exported functions.
- Use `z.infer<typeof Schema>` for Zod-derived types.

### React Native / Expo

- All animations must use React Native Reanimated v4.
- Never use 3-digit hex values with opacity suffix appended (e.g., `#888` + `25` = `#88825` - invalid). Always use 6-digit hex.
- `useAnimatedStyle` returning `opacity` must not be on an `Animated.View` that also has an `entering` prop - use manual `useSharedValue` entrance instead.
- `pointerEvents="box-none"` on absolute overlay containers so underlying screens remain touchable.

### Theme System

All colors come from the theme system in `src/theme/index.ts`. Never hardcode colors in components - always use `C = theme.colors` from the current theme.

### Animation Rules

- All animations must `cancelAnimation()` on unmount.
- Avoid opacity-based ring/echo animations - use `transform: [{ scale }]` only.
- Pulse durations should vary with `atmosphereLevel` where appropriate.
- Target 60fps - profile with Flipper if uncertain.

### Backend (AI Proxy)

- All inputs go through Zod validation before touching any service.
- All AI outputs go through Zod validation before being sent to the client.
- Never interpolate user-supplied content directly into the system prompt.
- User data goes in the user message as serialized JSON only.
- New routes require rate limiting middleware.

---

## Issue Labels

| Label | Meaning |
|---|---|
| `good first issue` | Suitable for new contributors |
| `frontend` | React Native / Expo UI work |
| `backend` | Fastify API / AI proxy |
| `ai` | AI engine, prompts, swarm logic |
| `security` | Security-sensitive work - requires careful review |
| `enhancement` | New feature or improvement |
| `bug` | Something is broken |
| `documentation` | Docs, README, comments |
| `ui` | Visual design, animations, themes |
| `performance` | Speed, rendering, memory |

---

## Good First Issues

Look for issues labeled `good first issue`. These are scoped tasks with clear requirements:

- Adding a new privacy mode
- Extending mock intelligence reports
- Improving theme color depth
- Writing missing type definitions
- Adding missing screenshots to README

---

## What Not To Do

- Do not submit AI-generated code without reviewing it yourself
- Do not add unrelated changes to a focused PR
- Do not hardcode colors, strings, or API keys
- Do not break existing TypeScript types without a migration plan
- Do not add dependencies without discussing first

---

## Questions

Open a GitHub Discussion or comment on a relevant issue. We are builder-first here - questions are welcome.
