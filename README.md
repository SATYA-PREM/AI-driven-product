# ProdAI: AI-Driven Product Intelligence Platform 🚀

> An enterprise-grade, agentic AI platform that transforms multi-source customer feedback into prioritized product intelligence, generates comprehensive PRDs with deterministic AI agents, and automates cross-functional team delivery across Product Managers, Designers, Developers, QA Engineers, and Stakeholders.

---

## 🌟 Overview & Architecture

**ProdAI** bridges the gap between chaotic customer signals and production engineering execution. Instead of manual triage, subjective roadmap debates, and fragmented handoffs, ProdAI introduces a 4-tier autonomous lifecycle:

```
[ Raw Feedback Files / Multi-Channel Ingestion ] (CSV, JSON, XLSX)
                          │
                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Tier 1: Data Ingestion & Sanitization Engine             │
│  • Multi-Source Parser (Feedback, Support Tickets, Reviews, Surveys)   │
│  • 0–100% Quality Score Gate & Schema Anomaly Detection                │
│  • XSS Stripping, Null Imputation, Deduplication & Canonical Tokens    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Tier 2: Multi-Agent CrewAI Intelligence Cluster            │
│  • Feedback Analysis Agent: 10-dimensional extraction across 100% rows │
│  • Pattern & Trend Agent: Semantic clustering & velocity calculation   │
│  • Product Intelligence Agent: 0-100 deterministic priority scoring    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Tier 3: AI PRD Studio & Requirements Engine              │
│  • 4-Agent PRD Synthesis: Context ➔ Epics ➔ Stories ➔ Acceptance (Gherkin) │
│  • Full Traceability: Customer Evidence ➔ Issue ➔ Requirement ➔ Test   │
│  • Review & Approval Gate: PM sign-off & Version Control (v1.0+)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Tier 4: Automated Handoff & Role-Based Workspaces          │
│  • PRD Assignment Matrix: Auto-assign via AI specialist or manual      │
│  • Product Designer: UX Requirements, Product Context & Design Handoff │
│  • Lead Developer: Implementation Workspace, Submissions & Blockers    │
│  • QA Lead: Test Plans, Suites, Cases, Defect Triage & Verification    │
│  • Stakeholder / Owner: Business Objectives, Roadmap & Approval Queue  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Functional Capabilities

### 1. Data Ingestion & Dirty Data Agent
- **Multi-Source Support**: Ingest customer feedback, Zendesk/support tickets, app store reviews, NPS surveys, and social signals.
- **Source & Batch Scoping**: Dynamic workspace-level scoping by source type and specific dataset batches (`feed21`, `feedback1`, etc.).
- **Data Quality Gate**: Automated 6-step pipeline (Inspect ➔ Validate ➔ Clean ➔ Canonical Preprocess ➔ Gemini Readiness Gate ➔ Lifecycle Audit) producing a deterministic 0–100% Quality Score.

### 2. Autonomous 3-Agent CrewAI Intelligence
1. **Feedback Analysis Agent**: Evaluates 100% of dataset records without sampling across 10 structured dimensions:
   - Sentiment, Intent, Product Area, Specific Issues, Pain Points, Feature Requests, Keywords, Confidence, Impact, and Urgency.
2. **Pattern & Trend Agent**: Clusters raw feedback semantically into problem clusters and calculates period-over-period trend velocity.
3. **Product Intelligence Agent**: Synthesizes 10 structured PM decision fields and computes deterministic Priority Scores ($0–100$):
   $$\text{Score} = (\text{Frequency} \times 0.35) + (\text{Severity} \times 0.25) + (\text{Trend} \times 0.15) + (\text{Sentiment} \times 0.15) + (\text{Impact} \times 0.10)$$

### 3. Comprehensive PM Intelligence Hub
- **Executive Overview**: High-priority KPI cards, health indicators, critical issues requiring immediate PM triage.
- **7 Deep-Dive Views**:
  - **Pain Points**: Granular inspection of friction backed by direct customer quotes and confidence metrics.
  - **Trends**: Acceleration and deceleration monitoring across system modules.
  - **Themes**: Semantic category distribution across components.
  - **Sentiment**: Real-time ratio breakdown (Positive, Negative, Neutral, Mixed).
  - **Segments**: Impact classification by customer tier (Enterprise, SMB, Power User, Free).
  - **Comparisons**: Multi-dimensional comparative analytics across timeframes, batches, and sources.
  - **Critical Issues**: Dedicated triage for items scoring $\ge 70$, with one-click conversion to PRD candidate features.

### 4. PRD Studio & 4-Agent Generation
- **Context Synthesis**: Aggregates PM-approved insights into an evidence-backed context snapshot.
- **4-Agent Pipeline**:
  - *Product Analyst*: Business rationale, problem statements, and success metrics.
  - *Requirements Analyst*: Granular functional specifications and non-functional requirements.
  - *Product Manager*: User personas, user stories with Gherkin acceptance criteria (`Given-When-Then`).
  - *PRD Architect*: Document compilation, release phases, and technical constraints.
- **Audit & Version History**: Full trace of prompt outputs, agent duration, and revision history.

### 5. Cross-Functional Role Workspaces

ProdAI delivers dedicated, specialized dashboards and action queues tailored to each role in the software lifecycle:

| Role Workspace | Primary Capabilities & Actions |
| :--- | :--- |
| **Product Manager (PM)** | Workspace settings, data ingestion, insights approval, PRD generation, team assignment matrix, delivery readiness. |
| **Product Designer (UX)** | Assigned PRDs, UX requirements review, user context inspection, Figma link submission, design response sign-off. |
| **Lead Developer (Dev)** | Implementation workspace, code submissions, technical blocker logging, clarification requests, defect fix submissions. |
| **QA Lead / Tester** | Test plans, test suites, test case execution (PASS/FAIL), defect filing, retesting verification, regression queue, release readiness score. |
| **Business Stakeholder** | Executive KPI dashboard, product roadmap portfolio, business objectives tracking, PRD approval gate, risk register oversight. |

### 6. Natural-Language AI Assistant
- Conversational chat powered by Gemini and anchored to project context.
- Instant query capability over customer feedback, approved features, active PRD requirements, and cross-functional task statuses.

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── agents/                     # CrewAI multi-agent definitions
│   │   │   ├── feedback_analysis_agent/# 10-dimensional row analysis
│   │   │   ├── prd_agent/              # 4 specialized agents for PRD synthesis
│   │   │   ├── prd_assignment_agent/   # Role-matching & assignment engine
│   │   │   └── assistant_agent/        # Natural-language project assistant
│   │   ├── api/v1/                     # REST API route handlers
│   │   │   ├── auth.py, workspaces.py, datasets.py, feedback.py
│   │   │   ├── intelligence.py, features.py, prd.py, prd_assignment.py
│   │   │   ├── designer.py, developer.py, qa.py, stakeholder.py
│   │   │   └── assistant.py, reports.py, workflow.py
│   │   ├── core/                       # Config, MongoDB init, permissions, security
│   │   ├── models/                     # Data schemas & domain entities
│   │   ├── repositories/               # Mongo data access layer
│   │   ├── schemas/                    # Pydantic v2 request/response schemas
│   │   ├── services/                   # Business logic and agent orchestrators
│   │   └── main.py                     # FastAPI application entry & middleware
│   ├── tests/                          # Pytest unit & API integration test suite
│   ├── requirements.txt                # Python backend dependencies
│   └── README.md                       # Backend guide
│
├── frontend/
│   ├── src/
│   │   ├── api/                        # Axios HTTP client modules
│   │   ├── components/                 # Layout (Sidebar, TopNavbar), common widgets
│   │   ├── features/                   # Role and domain-specific feature modules
│   │   │   ├── auth/                   # Authentication & login
│   │   │   ├── workspaces/             # Multi-workspace management
│   │   │   ├── dataAgent/              # Dirty data quality inspector
│   │   │   ├── datasets/               # Dataset batch management
│   │   │   ├── feedback/               # Customer feedback triage
│   │   │   ├── intelligence/           # 7 PM intelligence views
│   │   │   ├── features/               # Feature backlog & KPI matrix
│   │   │   ├── prd/                    # PRD Studio, generator & document viewer
│   │   │   ├── prd-assignment/         # PRD assignment matrix & team responses
│   │   │   ├── designer/               # Product designer workspace
│   │   │   ├── developer/              # Developer implementation workspace
│   │   │   ├── qa/                     # QA test plans, cases, defects & readiness
│   │   │   ├── stakeholder/            # Executive dashboard & approval gates
│   │   │   └── assistant/              # AI Assistant conversational drawer
│   │   ├── utils/                      # Workspace access, tokens, date formatting
│   │   ├── App.jsx                     # Route architecture & role guards
│   │   └── main.jsx                    # Vite application root
│   ├── package.json                    # Node dependencies
│   ├── vite.config.js                  # Vite configuration
│   └── README.md                       # Frontend guide
│
└── README.md                           # Master documentation
```

---

## ⚡ Quick Start & Setup

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.11 or higher
- **MongoDB**: Local MongoDB (`mongodb://localhost:27017`) or MongoDB Atlas URI
- **Google Gemini API Key**: Recommended for live AI features (includes deterministic heuristics fallback)

---

### 1. Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate a Python virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# Copy .env.example to .env and set your MongoDB URI and Gemini API Key:
cp .env.example .env

# 5. Start FastAPI development server
python -m uvicorn app.main:app --reload --port 8000
```

- **Interactive Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Interactive Reference**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2. Frontend Setup

```bash
# 1. Open a new terminal and navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite dev server
npm run dev
```

- **Application URL**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing & Verification

```bash
# Run backend test suite (unit and API tests)
cd backend
python -m pytest tests/ -v

# Run frontend build check
cd frontend
npm run build
```

---

## 🛡️ Security & Role-Based Access Control (RBAC)

ProdAI enforces strict two-tier authorization:
1. **Frontend Route Guards**: `PMRouteGuard`, `WorkspaceAccessGuard`, and role checks ensure team members only access appropriate workspace sections.
2. **Backend API Middleware**: Every request validates the JWT session and enforces granular workspace permissions (`VIEW_WORKSPACE`, `MANAGE_WORKSPACE`, `GENERATE_PRD`, `ASSIGN_PRD`, etc.).

---

## 🤝 Technology Stack

| Domain | Technology / Libraries |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite, Tailwind CSS, Lucide Icons, Axios |
| **Backend Framework** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| **AI Orchestration** | CrewAI, Google Gemini API (`gemini-2.0-flash`) |
| **Database** | MongoDB Atlas / PyMongo / Motor |
| **Testing** | Pytest, Vitest |
| **Styling & Theme** | Dark/Light theme with custom Tailwind glassmorphism tokens |

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
