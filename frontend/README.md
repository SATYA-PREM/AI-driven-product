# Product Intelligence Platform — Frontend

A modern, responsive Product Manager (PM) workspace UI built with **React 19**, **Vite**, **Tailwind CSS**, and **Lucide Icons**. It provides interactive dashboards, multi-dimensional customer feedback insights, AI pipeline execution controls, and data preprocessing workflows.

---

## 🏗️ Architecture & Component Overview

The application follows a modular, feature-first directory structure:

```
frontend/
├── public/                     # Static assets and favicon
├── src/
│   ├── assets/                 # Images, logos, and global SVGs
│   ├── components/
│   │   ├── common/             # Reusable UI primitives (Buttons, Cards, Badges, Modals, Loading Spinners)
│   │   └── layout/             # App shell, Sidebar navigation, Header, Breadcrumbs
│   ├── context/                # WorkspaceContext, AuthContext, Toast Notification Providers
│   ├── features/
│   │   ├── aiAgents/           # CrewAI 3-Agent execution launcher, diagnostic health monitor, job polling
│   │   ├── dataAgent/          # CSV/XLSX/JSON file upload, raw record viewer, sanitization, quality gates
│   │   ├── intelligence/       # Dedicated PM Intelligence pages & sub-views:
│   │   │   ├── Overview.jsx    # Strategic KPI headers, top issues, top feature requests, opportunity feed
│   │   │   ├── PainPoints.jsx  # Customer pain point frequency, root causes, severity bands
│   │   │   ├── Trends.jsx      # Period-over-period trend velocity, accelerating/decelerating themes
│   │   │   ├── Themes.jsx      # Semantic category breakdown and feature tag distributions
│   │   │   ├── Sentiment.jsx   # Interactive sentiment ratios (Positive, Negative, Neutral, Mixed)
│   │   │   ├── Segments.jsx   # User segment breakdown (Enterprise, SMB, Power Users, Free tier)
│   │   │   └── Comparisons.jsx # 4 comparison modes (Time, Dataset, Segment, Product)
│   │   ├── pm/                 # Critical Issues management, inspection modal, task conversion
│   │   └── reports/            # Executive report generator and PDF/Markdown exporter
│   ├── services/               # API clients (Axios / Fetch) interfacing with FastAPI backend endpoints
│   ├── utils/                  # Formatters, priority color mappers, date helpers
│   ├── App.jsx                 # Master router and layout container
│   └── main.jsx                # React root entry point
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## ✨ Key Features & Views

### 1. PM Intelligence Hub
- **Overview**: High-level executive summary cards (`total_feedback_analyzed`, `critical_issues_count`, `high_demand_features`), priority score gauges, and strategic recommendations.
- **Pain Points**: Granular analysis of friction points backed by 100% record coverage and qualitative customer quotes.
- **Trends**: Visualized period-over-period velocity tracking, identifying emerging user complaints vs. resolving issues.
- **Themes**: Multi-dimensional semantic clustering across product modules (e.g. Payment & Checkout, Product Search, Authentication).
- **Sentiment**: Real-time customer sentiment distribution across datasets and workspaces.
- **Segments**: Breakdown of feedback density and satisfaction by customer tiers and personas.
- **Comparisons**: Multi-angle comparative analytics across time frames, dataset batches, customer segments, and competing product modules.

### 2. Critical Issues Management
- Real-time alert list of high-severity issues (priority score $\ge 70$).
- Filter by severity (`Critical`, `High`, `Medium`), search by issue keyword, and inspect raw supporting feedback records.
- One-click task conversion to bridge PM insights into actionable engineering backlog items.

### 3. Data Agent & File Ingestion
- Drag-and-drop CSV, JSON, and XLSX file uploader.
- Instant quality score report (0–100%) checking missing required fields, type mismatches, out-of-bounds ratings, and duplicate records.
- Dual collection verification showing raw ingested records alongside sanitized/preprocessed signals.

### 4. AI Agents Pipeline Execution
- Direct invocation and status tracking for the 3-Agent CrewAI pipeline:
  1. **Feedback Analysis Agent**: 10-dimension evaluation per feedback record.
  2. **Pattern & Trend Agent**: Semantic clustering and period velocity calculation.
  3. **Product Intelligence Agent**: Priority scoring (0–100) and 10 PM decision fields synthesis.
- Real-time step status indicators (`not_started`, `ready`, `in_progress`, `completed`) and overall percentage progress.

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### 1. Environment Configuration
Create a `.env` file in the `frontend/` root directory (or `.env.local`):

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
The frontend application will be available at [http://localhost:5173](http://localhost:5173).

### 4. Build for Production
```bash
npm run build
```
Generates an optimized static bundle in the `dist/` directory ready for deployment.

### 5. Preview Production Build
```bash
npm run preview
```

---

## 🛠️ Tech Stack & Key Libraries

- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React (`lucide-react`)
- **HTTP Client**: Axios
- **State & Context**: React Context API (Workspace & User Session State)
