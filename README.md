<div align="center">

# 🌿 EcoSphere

### *Turn Your ERP Into an ESG Engine*

**An enterprise-grade Environmental, Social & Governance platform built for the Odoo Hackathon 2026**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Deployed on Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## 🏆 Hackathon 2026 Acknowledgement

This repo is built for the **Odoo Hackathon 2026** under the Evaluator **Divyesh Vyas** and teammates:
- Rudra Pratap Singh
- Aryan Agarwal
- Dev Saxena
- Rachit Kanchan

---

## 🚨 The Problem

Every modern enterprise sits on a goldmine of operational data — fleet logs, procurement records, energy bills, HR reports. Yet when it comes to ESG reporting, teams are still **copy-pasting numbers into spreadsheets**.

> **The result?** Manual errors, months-old data, zero employee engagement, and compliance audits that cost six figures in consulting fees.

---

## 💡 Our Solution

**EcoSphere** seamlessly plugs into your operational data and transforms it into a living, breathing ESG intelligence layer:

| Without EcoSphere | With EcoSphere |
|---|---|
| Manual spreadsheet-based carbon tracking | ⚡ Auto-calculated CO₂ from operational records |
| ESG reports compiled once a year | 📊 Real-time ESG scores updated continuously |
| Zero employee involvement in sustainability | 🏆 Gamified challenges, XP, badges & leaderboards |
| Compliance policies gathering dust | ✅ Policy acknowledgement tracking with audit trail |
| Sustainability is a PR exercise | 🌱 Sustainability embedded in daily ERP workflows |

---

## ✨ Feature Showcase

### 🌍 Environmental Module
- **Emission Factor Engine** — Configure kg CO₂e conversion rates per activity type (fleet, manufacturing, purchased energy, logistics)
- **Auto Carbon Accounting** — Emissions auto-calculated the moment an operational record is created — no manual entry needed
- **Department Carbon Heatmap** — Visual comparison of emissions across all departments with trend lines
- **Sustainability Goals** — Set targets, track progress bars in real-time, get alerted on overruns
- **Manual Carbon Entry Modal** — Escape hatch for data that lives outside your ERP

### 🤝 Social Module
- **CSR Activity Board** — Create, publish, and manage company sustainability events
- **Employee Participation Tracking** — Staff join activities, upload proof, and managers approve
- **Engagement Scoring** — Department-level social participation scores feed directly into the ESG index

### ⚖️ Governance Module
- **ESG Policy Library** — Draft, activate, archive policies with version control
- **Policy Acknowledgement Tracking** — Every employee's sign-off is timestamped and auditable
- **Compliance Issues Board** — Severity-tagged violations with assigned owners, due dates, and overdue highlighting
- **Audit Log** — Full immutable trail of governance actions

### 🏆 Gamification Engine
- **Challenge Lifecycle** — Draft → Active → Under Review → Completed with XP rewards per challenge
- **Badge System** — Auto-unlocked based on XP thresholds and specific behavioral triggers
- **Reward Catalog** — Stock-limited rewards redeemable with XP (automatically deducted)
- **Live Leaderboard** — Department and individual rankings to spark healthy competition
- **XP Economy** — Every sustainable action (CSR participation, policy acknowledgement, challenge completion) earns XP

### 📊 Dashboard & Analytics
- **ESG Score KPI Cards** — Environmental / Social / Governance / Total with configurable weightings
- **Carbon Trend Chart** — Month-over-month emissions vs. target area chart
- **Department Ranking Chart** — Bar chart comparison across all departments
- **Automation Engine** — Scheduled triggers for recurring emission calculations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│   React 18 · TypeScript · Vite · Tailwind CSS v3        │
│   Recharts · Lucide Icons · React Router v6             │
└──────────────────────┬──────────────────────────────────┘
                       │  REST API (JSON)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND                            │
│            FastAPI 0.115 · Python 3.12                  │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Router  │→ │ Service  │→ │   Repo   │              │
│  │  Layer   │  │  Layer   │  │  Layer   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       JWT Auth · Pydantic v2 · Alembic Migrations       │
└──────────────────────┬──────────────────────────────────┘
                       │  SQLAlchemy ORM
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    DATABASE                             │
│       Embedded SQLite (with automatic demo seeding)     │
└─────────────────────────────────────────────────────────┘
```

---

## 🧮 ESG Score Formula

```
Department ESG Score = (Environmental × 0.40) + (Social × 0.30) + (Governance × 0.30)

Organisation Score   = Σ(Department Scores) / Total Departments
```

> **Weights are fully configurable** via the Settings panel — no code changes required.

---

## 🛠️ Tech Stack

| Layer | Technology | Why We Chose It |
|---|---|---|
| **Backend Framework** | FastAPI 0.115 | Async-first, auto-generated OpenAPI docs, blazing fast |
| **ORM & Migrations** | SQLAlchemy 2.0 + Alembic | Type-safe queries, zero-downtime schema changes |
| **Auth** | JWT (python-jose + passlib/bcrypt) | Stateless, scalable, industry standard |
| **Validation** | Pydantic v2 | Runtime type safety across all API boundaries |
| **Database** | PostgreSQL / SQLite | Production-grade relational storage |
| **Frontend Framework** | React 18 + TypeScript 5 | Component model, strict typing, huge ecosystem |
| **Build Tool** | Vite 5 | Sub-second HMR, ESM-native, optimised bundles |
| **Styling** | Tailwind CSS v3 | Utility-first, dark-mode-first, zero runtime |
| **Charts** | Recharts 2 | Composable SVG charts with React integration |
| **Icons** | Lucide React | Consistent, tree-shakable icon set |
| **Frontend Deployment** | Vercel | Global CDN, instant deployments, zero config |
| **Backend Deployment** | Render | Managed containers, auto-deploy from Git |

---

## 📁 Project Structure

```
EcoSphere/
├── backend/                         # FastAPI application
│   ├── app/
│   │   ├── api/v1/                  # Route handlers (one file per resource)
│   │   │   ├── auth.py              # JWT login & token refresh
│   │   │   ├── carbon_transactions.py
│   │   │   ├── emission_factors.py
│   │   │   ├── csr_activities.py
│   │   │   ├── policies.py
│   │   │   ├── gamification.py
│   │   │   └── auto_calculation.py  # Automated emission triggers
│   │   ├── core/                    # Config, security, database, DI
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   ├── schemas/                 # Pydantic v2 request/response schemas
│   │   ├── services/                # Business logic (carbon, scoring, gamification)
│   │   ├── repositories/            # Data access layer
│   │   └── main.py                  # FastAPI app entry point
│   ├── alembic/                     # Database migrations
│   ├── seed.py                      # Rich demo data seeder (~32KB of realistic data)
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                        # React + Vite SPA
    ├── src/
    │   ├── App.tsx                  # Root component with tab routing
    │   ├── components/              # Feature UI components
    │   │   ├── GamificationTab.tsx
    │   │   ├── GovernanceTab.tsx
    │   │   ├── EmissionFactorsTab.tsx
    │   │   ├── AutomationTab.tsx
    │   │   ├── DepartmentCarbonTrackingTab.tsx
    │   │   └── ManualCarbonEntryModal.tsx
    │   ├── features/auth/           # Login, token management, auth screen
    │   ├── api/                     # API client functions
    │   ├── types/                   # Shared TypeScript interfaces
    │   └── main.tsx                 # React entry point
    ├── public/resources/            # Static assets (audio, images)
    ├── tailwind.config.js
    ├── vite.config.ts
    └── package.json
```

---

## 🗄️ Data Models

| Model | Description |
|---|---|
| `User` / `Role` | Auth, RBAC, XP points, level |
| `Department` | Org hierarchy with head assignment |
| `EmissionFactor` | CO₂e conversion rates per activity type |
| `EmissionFactorMapping` | Maps ERP record types to emission factors |
| `CarbonTransaction` | Auto-calculated emissions with source tracing |
| `EnvironmentalGoal` | Sustainability targets with progress |
| `CSRActivity` | Company sustainability events |
| `EmployeeParticipation` | CSR participation with proof & approval |
| `ESGPolicy` / `PolicyAcknowledgement` | Governance policies & employee sign-offs |
| `Audit` / `ComplianceIssue` | Audit findings, violations, severity, owner |
| `Challenge` / `ChallengeParticipation` | Gamified sustainability challenges |
| `Badge` / `UserBadge` | Auto-awarded achievement badges |
| `Reward` / `RewardRedemption` | Redeemable rewards with XP economy |
| `DepartmentScore` | Computed, weighted ESG scores per department |
| `Notification` | In-app event notifications |

---

## 🔐 User Roles

| Role | Access Level |
|---|---|
| 🔴 **System Admin** | Full platform access — configure everything |
| 🟠 **ESG Manager** | Manage all ESG modules, run reports, configure weights |
| 🟡 **Department Manager** | Manage department activities, view own scores |
| 🟢 **Employee** | Join challenges, CSR activities, earn XP & badges |
| 🔵 **Auditor** | Conduct audits, log compliance issues, read-only elsewhere |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL (or use SQLite for local dev)

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL and SECRET_KEY

# Run database migrations
alembic upgrade head

# Seed with realistic demo data
python seed.py

# Start the API server
uvicorn app.main:app --reload
# → API live at http://localhost:8000
# → Swagger UI at http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# → App live at http://localhost:5173
```

### Environment Variables

```env
# backend/.env
# Note: For the Hackathon MVP, we use local SQLite so DATABASE_URL is not required.
```

---

## 📡 API Reference

All routes are prefixed with `/api/v1/`. Interactive docs available at `/docs`.

| Resource | Endpoints |
|---|---|
| `users` | CRUD + role assignment |
| `departments` | CRUD |
| `emission-factors` | CRUD + bulk import |
| `emission-factor-mappings` | Map ERP types to factors |
| `carbon-transactions` | CRUD + filters by dept/date/source |
| `auto-calculation` | Trigger automated emission computation |
| `csr-activities` | CRUD + participation management |
| `policies` | CRUD + acknowledgement tracking |
| `gamification` | Challenges, badges, rewards, leaderboard |
| `settings` | ESG weights, notification preferences |

---

## 🏆 Gamification Rules

| Action | XP Reward |
|---|---|
| ✅ Complete a sustainability challenge | Configurable per challenge |
| 🌳 Participate in a CSR activity | Fixed XP on manager approval |
| 📜 Acknowledge an ESG policy | Compliance XP bonus |
| 📸 Submit proof for a sustainability activity | Evidence bonus XP |
| 🥇 Reach the top of the leaderboard | Badge unlock |

XP accumulates → **Badges auto-unlock** at defined thresholds → XP can be **redeemed for Rewards** (stock-limited, XP deducted on redemption).

---

## ✅ Quality & Architecture Highlights

- ✅ **Clean Architecture** — Repository → Service → API router separation
- ✅ **Type-safe API contracts** — Pydantic v2 schemas on every endpoint
- ✅ **Database migrations** — Alembic with zero-downtime schema changes
- ✅ **Role-Based Access Control** — JWT + role middleware
- ✅ **Audit logging** — Immutable trail on key entities
- ✅ **Responsive dark-themed UI** — Enterprise-grade design system
- ✅ **Startup audio feedback** — Immersive UX with autoplay + interaction fallback
- ✅ **Modular feature structure** — Each domain is independently extensible
- ✅ **Demo data seeder** — 32KB of realistic seeded data for instant demos

---

## 🌐 Deployment

| Service | Platform | Configuration |
|---|---|---|
| **Backend API** | Render (Web Service) | `render.yaml` at repo root |
| **Frontend SPA** | Vercel | `vercel.json` in `frontend/` |
| **Database** | Render PostgreSQL / Supabase | `DATABASE_URL` env variable |

```yaml
# render.yaml (included in repo)
services:
  - type: web
    name: ecosphere-backend
    env: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## 🔮 Roadmap

| Feature | Status |
|---|---|
| 🤖 AI Sustainability Recommendations (Gemini API) | 🗺️ Planned |
| 📈 Predictive Carbon Analytics (time-series ML) | 🗺️ Planned |
| 📱 React Native Mobile App | 🗺️ Planned |
| 🔌 IoT Sensor Integration | 🗺️ Planned |
| 🔗 Native Odoo![alt text](image.png) ERP Connector | 🗺️ Planned |
| 📊 Power BI / Looker Connector | 🗺️ Planned |
| 💬 Slack / Microsoft Teams Integration | 🗺️ Planned |
| 🏅 ESG Benchmarking vs. Industry Standards | 🗺️ Planned |
| 📧 Email & Push Notifications | 🗺️ Planned |
| 📋 GRI / SASB / TCFD Report Templates | 🗺️ Planned |

---

<div align="center">

*"The greatest threat to our planet is the belief that someone else will save it."*  
*— Robert Swan*

**EcoSphere** — Because sustainability shouldn't be an afterthought.

</div>
