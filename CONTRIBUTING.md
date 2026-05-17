<div align="center">

# Contributing to OMNYX

**AI Privacy Intelligence Operating System**

*Open source. Founder-built. Contributor-powered.*

[![Good First Issues](https://img.shields.io/github/issues/OMNYX-OS/OMNYX-OS/good%20first%20issue?style=flat-square&color=00FF88&label=Good%20First%20Issues)](https://github.com/OMNYX-OS/OMNYX-OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-00FF88?style=flat-square)](https://github.com/OMNYX-OS/OMNYX-OS/pulls)
[![Community](https://img.shields.io/badge/Community-Discussions-7C3AED?style=flat-square)](https://github.com/OMNYX-OS/OMNYX-OS/discussions)

</div>

---

## Start Contributing in 5 Minutes

No permission needed. No onboarding call. Just fork and build.

```
Step 1 — Fork
Step 2 — Clone
Step 3 — Install
Step 4 — Run
Step 5 — Pick an issue
Step 6 — Open a PR
```

### Step 1 — Fork

Click **Fork** in the top-right corner of [OMNYX-OS/OMNYX-OS](https://github.com/OMNYX-OS/OMNYX-OS).

### Step 2 — Clone

```bash
git clone https://github.com/YOUR_USERNAME/OMNYX-OS.git
cd OMNYX-OS
```

### Step 3 — Install

```bash
npm install
```

### Step 4 — Run

```bash
# Copy environment file
cp .env.example .env

# Start Expo dev server
npx expo start
```

Scan the QR code with Expo Go, or press `a` for Android emulator, `i` for iOS simulator.

Optional — start the AI proxy (needed only for AI explanation features):

```bash
npm run server
# Runs on http://localhost:3001
```

### Step 5 — Pick an issue

Browse [Good First Issues](https://github.com/OMNYX-OS/OMNYX-OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) and comment `"I'd like to work on this"` to claim it. You'll be assigned within 24 hours.

### Step 6 — Open a PR

```bash
# Create your branch
git checkout -b feat/your-feature-name

# Make your changes, then verify TypeScript
npx tsc --noEmit

# Commit
git add .
git commit -m "feat: describe what you did"

# Push
git push origin feat/your-feature-name
```

Open a pull request against `main`. Fill out the PR template completely.

---

## Folder Structure

```
omnyx/
  app/                   Expo Router screens
    (tabs)/              Core tab screens (home, threats, agents, replay, modes)
  src/
    components/          Shared UI components
    hooks/               Custom React hooks
    services/            Data services (mock data, AI proxy, scan logic)
    store/               Zustand global state (useAppStore.ts)
    theme/               Theme system — 5 themes, color tokens
    types/               TypeScript type definitions
    events/              Event bus, atmosphere engine
  server/                Node.js AI proxy (Express, runs with npm run server)
  android/               Android native project
  ios/                   iOS native project
  .github/               Issue templates, PR template
```

Key files to know:

| File | Purpose |
|------|---------|
| `src/store/useAppStore.ts` | Global state — all app data lives here |
| `src/theme/index.ts` | All theme color tokens |
| `src/services/mockData.ts` | Mock agents, apps, events |
| `src/services/privacyIntelligence.ts` | Score computation, threat building |
| `server/proxy.ts` | AI proxy server |

---

## Code Standards

### TypeScript

- Strict mode is on. All code must pass `npx tsc --noEmit`.
- No `any` unless absolutely unavoidable and commented.
- Type all function parameters and return values.

### React Native

- Never use hardcoded colors. Always pull from the active theme: `const C = THEMES[currentTheme].colors`
- Use `useAppStore((s) => s.field)` for store subscriptions — never `useAppStore.getState()` inside render.
- Animations use React Native Reanimated v4. Always call `cancelAnimation()` in cleanup.
- No `console.log` in production code paths.

### Styling

- NativeWind (Tailwind) for layout where applicable.
- Theme-aware colors from `C.*` for all visual properties.
- Follow `borderRadius`, `padding`, and `gap` conventions of surrounding components.

### Comments

- Write comments only when the WHY is non-obvious from the code itself.
- No block comments that describe what the code does — the code does that.

---

## Branch Naming

```
feat/short-description       New feature
fix/short-description        Bug fix
docs/short-description       Documentation
refactor/short-description   Refactor with no behavior change
test/short-description       Tests only
ui/short-description         Visual / animation only
```

Examples:
```
feat/haptic-feedback-threats
fix/scan-button-freeze-android
docs/add-jsdoc-useappstore
ui/empty-state-threat-feed
```

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type: short description (under 72 characters)
```

Types:

| Type | When to use |
|------|-------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `ui` | Visual / animation change |
| `refactor` | Code change with no behavior change |
| `test` | Tests only |
| `chore` | Build, config, dependency updates |

Examples:
```
feat: add empty state for threat feed tab
fix: cancel reanimated scan pulse on unmount
docs: add jsdoc to computePrivacyScore
ui: increase font size on permission chip labels
```

---

## How to Claim an Issue

1. Find an open issue labeled `good first issue` or `help wanted`.
2. Comment: `"I'd like to work on this."`
3. A maintainer will assign you within 24 hours.
4. You have **7 days** to open a PR. If you need more time, comment on the issue.
5. If no update after 7 days, the issue may be reassigned.

One active claim at a time per contributor. Finish or drop one before claiming another.

---

## How Reviews Work

- Reviews happen within **48-72 hours** of a PR being opened.
- A PR needs **1 maintainer approval** to merge.
- Feedback will be specific, actionable, and respectful.
- Address all comments before requesting re-review.
- Small, focused PRs get reviewed and merged faster.

What reviewers check:

- `npx tsc --noEmit` passes
- No hardcoded colors, no secrets
- Feature matches the issue scope exactly
- Animations have `cancelAnimation()` cleanup
- Code follows existing patterns — no unnecessary abstractions

---

## PR Workflow

```
fork → branch → build → tsc check → PR → review → revisions → merge
```

- Target branch is always `main`.
- One feature per PR. Do not bundle unrelated changes.
- Include screenshots for any UI change.
- Link the issue with `Fixes #123` in the PR body.

---

## Contributor Rewards

| Milestone | Recognition |
|-----------|-------------|
| First PR merged | `First PR` badge + shoutout in Discussions |
| 3 PRs merged | Listed in README Contributors section |
| 5 PRs merged | Contributor Spotlight post in Discussions |
| 10 PRs merged | Community role + profile shoutout |
| Major contribution | Core team invitation |

Contributor of the Month is announced in Discussions at the end of each month, based on impact, code quality, and responsiveness to reviews.

---

## GSSoC Contributors

OMNYX participates in [Girl Script Summer of Code](https://gssoc.girlscript.tech).

GSSoC-tagged issues are labeled `LFX` or `GSSoC`. All standard contribution rules apply. Point assignments follow GSSoC program guidelines.

---

## Questions

Open a [Discussion](https://github.com/OMNYX-OS/OMNYX-OS/discussions) — don't open an issue for questions.

Category guide:
- **Q&A** — setup help, "how does X work"
- **Ideas** — feature proposals before filing a formal issue
- **Show and Tell** — share what you built with OMNYX

---

<div align="center">

**Every PR makes OMNYX sharper. Thank you for building with us.**

</div>
