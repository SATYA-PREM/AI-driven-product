# Product Intelligence Platform — Backend

A production-grade, agentic backend system built with **FastAPI**, **CrewAI**, **Google Gemini**, and **MongoDB**. It automates the transformation of noisy, unstructured customer feedback into prioritized, evidence-backed product intelligence for Product Managers.

---

## Complete Master Pipeline Flow

The platform executes a strict, deterministic sequence from raw file ingestion to executive PM reports:

```
[1. Ingestion]           CSV / JSON / XLSX file upload → status: UPLOADED
      ↓
[2. Validation]          Schema integrity & business rules check → Quality Score (0–100%) → status: VALIDATED
      ↓
[3. Cleaning]            Deduplication, HTML/XSS sanitization, rating scale normalization → status: CLEANED
      ↓
[4. Preprocessing]       Tokenization, date normalization, canonical ProductSignal schema → status: PREPROCESSED
      ↓
[5. AI Analysis]         Autonomous 3-Agent Sequential Pipeline:
    ├── Agent 1: Feedback Analysis Agent (10-dimension evaluation across 100% of records) → AGENT_1_COMPLETED
    ├── Agent 2: Pattern & Trend Agent (Semantic issue/feature clustering & trend velocity) → AGENT_2_COMPLETED
    └── Agent 3: Product Intelligence Agent (0–100 priority scoring & recommendations) → AGENT_3_COMPLETED
      ↓
[6. Intelligence]        Synthesized workspace KPIs, issue clusters, feature demand backlogs → status: INTELLIGENCE_READY
      ↓
[7. Executive Report]    Compiled PM intelligence executive report document → status: COMPLETED
```

---

## Key Capabilities

### 1. Complete Dataset Analysis (100% Record Coverage)
- The AI pipeline does **not** sample or cap records. Every single customer feedback row is processed across all 10 product dimensions by Agent 1.
- Repositories (`DataRepository` and `AnalysisRepository`) support `limit=0` and `limit=None` for complete dataset operations.
- Full dataset inspection endpoint: `GET /api/v1/datasets/{dataset_id}/analyses` returns all classified feedback records.
- Single record inspection endpoint: `GET /api/v1/analysis/{record_id}` retrieves the granular classification for a specific record.

### 2. Real-Time Workflow Synchronization
- Every pipeline execution milestone (Validation, Cleaning, Preprocessing, Agent 1, Agent 2, Agent 3, Intelligence, Report) automatically updates both:
  1. `datasets_collection` — tracks dataset lifecycle state (`UPLOADED` → `VALIDATED` → `CLEANED` → `PREPROCESSED` → `AGENT_1_COMPLETED` → `AGENT_2_COMPLETED` → `AGENT_3_COMPLETED` → `INTELLIGENCE_READY` → `COMPLETED`).
  2. `workflows_collection` — tracks step statuses (`not_started`, `ready`, `in_progress`, `completed`), start/completion timestamps, and overall completion `progress_percentage`.

### 3. Four Autonomous Specialized Agents
- **Data Agent**: Preprocessing toolkit that inspects dirty data, validates schemas, cleans anomalies, and prepares canonical AI-ready records.
- **Agent 1 (Feedback Analysis Agent)**: Classifies each feedback across 10 dimensions: Sentiment, Intent, Theme, Product Area, Issues, Pain Points, Feature Requests, Keywords, and Confidence scores. Powered by Gemini with deterministic heuristic fallback.
- **Agent 2 (Pattern & Trend Agent)**: Groups recurring problems and requested features across all customers into semantic clusters, calculating period-over-period trend velocity.
- **Agent 3 (Product Intelligence Agent)**: Applies deterministic priority scoring `(Frequency*0.35 + Severity*0.25 + Trend*0.15 + Sentiment*0.15 + Impact*0.10)` to rank issues and generate actionable product recommendations.

---

## API Architecture & Swagger Route Structure

The Swagger UI (`/docs`) is organized into 8 sequential phases:

| # | Section Name | Description & Primary Endpoints |
|---|---|---|
| **1** | **Authentication & Users** | User signup, login, JWT issuance, profile retrieval (`POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `GET /api/v1/users/me`) |
| **2** | **Workspaces & Products** | Multi-tenant workspaces, role-based member management (PM, Member), product catalog (`/api/v1/workspaces`, `/api/v1/products`) |
| **3** | **Data Ingestion & Datasets** | Upload raw feedback files (CSV, JSON, XLSX), list datasets, retrieve raw records (`POST /api/v1/datasets`, `GET /api/v1/datasets/{id}/records`) |
| **4** | **Data Agent - Dirty Data Preprocessing** | Validation, cleaning, preprocessing, and Gemini readiness gate (`POST /datasets/{id}/validate`, `/clean`, `/preprocess`, `/pipeline`) |
| **5** | **AI Agents & Health Probes** | Live operational diagnostic reporting status of all agents (`GET /api/v1/health/agents`) |
| **6** | **AI Analysis Pipeline (CrewAI 3-Agent Flow)** | Launch 3-agent analysis on full dataset, poll job status, retry failed stages, inspect all dataset analyses or single records (`POST /datasets/{id}/analysis`, `GET /analysis/jobs/{id}`, `GET /datasets/{id}/analyses`, `GET /analysis/{record_id}`) |
| **7** | **Product Intelligence & PM Dashboard** | Strategic KPI summaries, scored issue clusters, feature demand rankings, executive reports (`GET /workspaces/{id}/intelligence/summary`, `/issues`, `POST /workspaces/{id}/reports`) |
| **8** | **Background Jobs & System Monitoring** | Background job polling, health checks, root endpoint (`GET /api/v1/jobs/{id}`, `GET /health`, `GET /`) |

---

## Installation & Setup

### Prerequisites
- Python 3.11+
- MongoDB instance (local `mongodb://localhost:27017` or MongoDB Atlas)
- Google Gemini API Key (optional for live LLM inference; platform includes deterministic heuristic fallback for offline operation)

### 1. Configure Environment Variables
Create a `.env` file in the `BACKEND/` directory:

```env
APP_NAME=Product Intelligence Platform
APP_VERSION=1.0.0
DEBUG=true

# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=product_intelligence

# Security
SECRET_KEY=your-super-secret-jwt-key-minimum-32-chars-long
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# AI Models
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash
```

### 2. Install Dependencies
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Run Application Server
```bash
python -m uvicorn app.main:app --reload --port 8000
```

- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Probe**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **AI Agents Diagnostic**: [http://127.0.0.1:8000/api/v1/health/agents](http://127.0.0.1:8000/api/v1/health/agents)

---

## Running the Automated Test Suite

Execute pytest across unit and integration tests:

```bash
# Run all tests
python -m pytest tests/ -v

# Run workflow stages and sequence tests
python -m pytest tests/unit/test_workflow_stages.py -v

# Run Swagger and Data Agent diagnostic tests
python -m pytest tests/test_swagger_and_data_agent.py -v

# Run 3-Agent CrewAI pipeline integration tests
python -m pytest tests/test_milestone2_workflow.py tests/test_crewai_pipeline.py -v
```

