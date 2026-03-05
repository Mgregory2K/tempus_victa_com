# Tempus Victa // Cognitive OS

**Operational Status: v2.6 (Sovereign LAN)**

Tempus Victa is a **local-first cognitive operating system** that turns every input from your life—voice captures, texts, shared content, notifications, and manual entries—into structured, actionable intelligence through a centralized Doctrine engine.

Built for the year 45,000,003 AD but functional today.

## 🧬 Twin+ Doctrine (The Learning Substrate)

Twin+ is not a feature; it is the app's continuous behavioral substrate. It is a local, inspectable, evolving model of the user that shapes every interaction from day one.

- **Mirror**: Learns your language, cadence, tone, and decision patterns.
- **Predict**: Forecasts next actions and potential derailments.
- **Optimize**: Suggests reductions in cognitive load based on historical successes.
- **Escalation Ladder**: Strictly follows **Local → Internet → Opt-in AI**.

## 🛰 Core Modules (Windows into Twin+)

- **The Bridge**: Your strategic cockpit. View cognitive load, time reclaimed, and the Twin+ Daily Brief.
- **The Ready Room**: A self-aware deliberation chamber. Engage Twin+ for socratic debates, lexicon learning, and high-fidelity stress-testing.
- **The Doctrine**: The immutable hierarchy of intelligence.
- **Settings**: Control your neural link, provide API keys, and manage Azure/Entra identity.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **Interface**: [Tailwind CSS 4](https://tailwindcss.com) with Custom HUD Cockpit styling.
- **Intelligence**: Integrated OpenAI (GPT-4o) with intent-based escalation and live internet context.
- **Identity**: Google (Sovereign OAuth)

## 🚀 Production-First Workflow (Mobile Ready)

The `dev` server is not suitable for mobile or LAN testing due to aggressive caching. Use the following production workflow for a stable, mobile-first experience.

**1. Build for Production:**
```bash
npm run build
```

**2. Start the Production Server:**
```bash
npm run start -- -H 0.0.0.0
```

Visit [http://localhost:3010](http://localhost:3010) on your desktop or your machine's IP (e.g., http://192.168.40.250:3010) on a mobile device.

---
*"I have a guy for that. Tempus Victa is my Twin+ assistant, and AI is its assistant."*
