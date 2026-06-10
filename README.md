<div align="center">

# OMNYX

**AI Privacy Intelligence Operating System**

*A futuristic, open-source mobile privacy system powered by autonomous AI agents.*

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![GSSoC](https://img.shields.io/badge/GSSoC-2024-orange?style=flat-square)](https://gssoc.girlscript.tech)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

---

![OMNYX Banner](screenshots/banner.png)

</div>

---

## Join OMNYX

Building AI tools, mobile experiences, and open-source products.

| | |
|---|---|
| **Beginner Friendly** | Scoped issues with step-by-step instructions |
| **Fast PR Reviews** | Feedback within 48-72 hours |
| **Open to Contributors** | No gatekeeping — fork and build |
| **Real Project Experience** | AI, mobile, privacy — production-quality codebase |

**Start here** — [Good First Issues](https://github.com/OMNYX-OS/OMNYX-OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

---

## What is OMNYX?

OMNYX is an experimental, open-source **AI privacy operating system** for mobile devices. It continuously monitors device behavior, detects surveillance threats in real time, and interprets them through an autonomous AI swarm - then presents the intelligence in a cinematic, deeply visual interface.

This is not a dashboard. Not a SaaS product. Not a generic security app.

OMNYX is designed to feel like a **living intelligence system** - autonomous, atmospheric, and deeply intentional about privacy.

---

## Vision

Most privacy tools tell you what happened. OMNYX tells you what it means.

The goal is to build an interface that feels **10 years ahead** of conventional mobile security software: a system that breathes, reacts, interprets, and protects - without ever feeling like a corporate compliance tool.

---

## Key Features

### Privacy Intelligence Engine
- Real-time threat detection and classification
- Behavioral anomaly scoring
- Ambient atmosphere system that reacts to threat level
- Autonomous privacy score with trend tracking

### AI Swarm System
- 5 specialized AI agents (SENTINEL, SCOUT, ANALYST, GUARDIAN, WATCHER)
- Distributed analysis with coordinated reasoning
- Agent status visualization with live pulse animations
- Swarm constellation UI in pentagon formation

### AI Explanation Engine
- Secure backend proxy architecture (API keys never touch the client)
- Per-threat intelligence reports with operational tone
- Swarm reasoning fragments before synthesis
- Rate-limited, prompt-sanitized, response-validated pipeline

### Cinematic UI Themes
- **NEBULA** - Cosmic intelligence, violet orbital systems, deep space atmosphere
- **TERMINAL** - Tactical surveillance command center, radar grid, monochrome green
- **SOLARIS** - Golden holograms, solar flare atmosphere, warm command energy
- **GLASSMORPH** - Translucent intelligence layers, premium glass depth
- **LUMINA** - Ultra-minimal luxury, warm parchment, dark gold elegance

### Privacy Modes
- Ghost, Banking, Normal, Travel, Focus, Sleep
- Each mode adjusts monitoring intensity and AI behavior

### Memory Stream (Replay)
- Full event timeline with SVG waveform trace
- Animated signal archive with risk delta tracking
- Agent response logs per event

### Threat Feed
- Live threat feed with real-time breathing borders on critical events
- Tension meter synchronized to atmosphere level
- Resolve workflow with AI explanation per threat

---

## Screenshots

> *Screenshots coming soon. To contribute visuals, see [CONTRIBUTING.md](CONTRIBUTING.md).*

| Nebula Mode | Terminal Mode | Solaris Mode |
|---|---|---|
| ![Nebula](screenshots/nebula.png) | ![Terminal](screenshots/terminal.png) | ![Solaris](screenshots/solaris.png) |

| Threat Intelligence | AI Explanation | Swarm System |
|---|---|---|
| ![Threats](screenshots/threats.png) | ![AI Engine](screenshots/ai-engine.png) | ![Swarm](screenshots/swarm.png) |

---

## Architecture

```
omnyx/
 app/                     Expo Router screens and navigation
   (tabs)/                Core tab screens
     index.tsx            Home - Privacy Score + Orbital Hero
     threat-feed.tsx      Live Threat Intelligence Feed
     agents.tsx           AI Swarm Constellation
     replay.tsx           Memory Stream Timeline
     modes.tsx            Privacy Modes + Theme Switcher
   (auth)/                Authentication screens
 src/
   components/            Shared UI components
   hooks/                 Custom React hooks
   services/              External service integrations
   store/                 Zustand global state
   theme/                 Theme system (5 themes)
   types/                 TypeScript type definitions
   events/                Event bus and atmosphere engine
 backend/                 Secure AI proxy (Node.js + Fastify)
   src/
     routes/              API route handlers
     middleware/          Rate limiting, request validation
     services/            AI provider integrations
     validators/          Zod input/output schemas
     security/            Prompt sanitization, content filtering
```
See full system architecture with diagrams:  
[View Architecture Docs](docs/architecture.md)
### Data Flow

```
Device Sensors
    |
Ambient Engine (atmosphere scoring)
    |
Threat Classifier (risk level assignment)
    |
App Store (Zustand - realtime state)
    |
AI Swarm Agents (status + analysis)
    |
Backend Proxy (/api/ai/analyze)
    |
AI Provider (threat interpretation)
    |
Intelligence Report (validated + rendered)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, React Native 0.81 |
| Navigation | Expo Router v6 |
| Language | TypeScript (strict) |
| State | Zustand with subscribeWithSelector |
| Animations | React Native Reanimated v4 |
| Graphics | React Native SVG |
| Styling | NativeWind (Tailwind for RN) |
| Backend | Node.js, Fastify v5 |
| AI Provider | Pluggable (default: haiku-class LLM) |
| Validation | Zod |
| Realtime | Supabase (optional) |
| Blur | expo-blur |
| Gradients | expo-linear-gradient |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator, or the Expo Go app

### Installation

```bash
# Clone the repository
git clone https://github.com/nagadevikona20max/omnyx.git
cd omnyx

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your credentials

# Start the development server
npx expo start
```

### Running on Device

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android

# Expo Go (scan QR code)
npx expo start
```

### Backend Setup (AI Explanation Engine)

The AI Explanation Engine requires a running backend proxy. This keeps API keys off the client.

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set ANTHROPIC_API_KEY in .env

# Start development server
npm run dev
# Backend runs on http://localhost:3001
```

Without the backend running, OMNYX uses built-in mock intelligence reports so the full UI is demonstrable without any API keys.

---

## Environment Variables

### Root `.env`

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_AI_PROXY_URL=http://localhost:3001
```

### `backend/.env`

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

---

## Development Roadmap

### Phase 1 - Core UI System
- [x] Cinematic home screen with orbital score ring
- [x] 5-theme system (Nebula, Terminal, Solaris, Glassmorph, Lumina)
- [x] SignalDock floating navigation
- [x] Ambient atmosphere engine

### Phase 2 - Threat Intelligence
- [x] Real-time threat feed with live indicators
- [x] Threat classification and risk scoring
- [x] Resolve workflow
- [x] Privacy mode system

### Phase 3 - AI Swarm
- [x] 5-agent swarm with status visualization
- [x] Swarm constellation (pentagon formation)
- [x] Agent pulse animations synchronized to atmosphere

### Phase 4 - Cinematic Polish
- [x] Planetary orbital ring system
- [x] Floating orb ambient backgrounds
- [x] Memory Stream (Replay) timeline
- [x] Tension meter and threat pulse borders

### Phase 5 - AI Explanation Engine
- [x] Secure backend proxy (keys never on client)
- [x] Per-threat intelligence reports
- [x] Rate limiting and prompt sanitization
- [x] Zod-validated response pipeline
- [x] Offline mock intelligence fallback

### Phase 6 - AI Swarm Dashboard
- [ ] Per-agent detail screens
- [ ] Swarm coordination visualization
- [ ] Agent task assignment UI

### Phase 7 - Privacy Mode Enforcement
- [ ] System-level permission restriction hooks
- [ ] Mode-specific behavioral responses
- [ ] Automation rules engine

### Phase 8 - Sensor Integration
- [ ] Real device permission scanning (Android)
- [ ] Background activity monitoring
- [ ] Network request interception

### Phase 9 - Polish and Release
- [ ] Custom fonts (Geist or Inter)
- [ ] Haptic feedback system
- [ ] Onboarding flow
- [ ] App Store preparation

---

## Contributing

OMNYX is open to contributors. Whether you are improving UI components, fixing bugs, expanding the AI engine, or adding new themes, every contribution moves the project forward.

Read the full guide: [CONTRIBUTING.md](CONTRIBUTING.md)

Quick reference:

```bash
# Fork the repo
# Create your branch
git checkout -b feat/your-feature-name

# Make changes
# Run TypeScript check
npx tsc --noEmit

# Push and open a PR
```

---

## Security

API keys must never be committed to the repository. The backend proxy architecture exists specifically to isolate AI provider credentials from the mobile client.

Read the full policy: [SECURITY.md](SECURITY.md)

---

## License

MIT License. See [LICENSE](LICENSE).

---

## Acknowledgments

Built with intention. Designed for privacy. Engineered for the future.

---

<div align="center">

**OMNYX OS — BUILT FOR PRIVACY. DESIGNED FOR FREEDOM.**

[![Good First Issues](https://img.shields.io/github/issues/OMNYX-OS/OMNYX-OS/good%20first%20issue?style=flat-square&color=00FF88&label=Good%20First%20Issues)](https://github.com/OMNYX-OS/OMNYX-OS/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
[![Contributors](https://img.shields.io/github/contributors/OMNYX-OS/OMNYX-OS?style=flat-square&color=7C3AED)](https://github.com/OMNYX-OS/OMNYX-OS/graphs/contributors)

</div>
