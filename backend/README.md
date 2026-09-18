# Product Intelligence Platform — Backend

A production-grade, agentic backend system built with **FastAPI**, **CrewAI**, **Google Gemini**, and **MongoDB**. It automates the transformation of noisy, unstructured customer feedback into prioritized, evidence-backed product intelligence for Product Managers.

---

## 🏗️ Master Pipeline Flow

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

## 🔥 Key Capabilities

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

## 📑 API Architecture & Swagger Route Structure

The Swagger UI (`/docs`) is organized into 8 sequential phases:

| # | Section Name | Description & Primary Endpoints |
|---|---|---|
| **1** | **Authentication & Users** | User signup, login, JWT issuance, profile retrieval (`POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `GET /api/v1/users/me`) |
| **2** | **Workspaces & Products** | Multi-tenant workspaces, role-based member management (PM, Member), product catalog (`/api/v1/workspaces`, `/api/v1/products`) |
| **3** | **Data Ingestion & Datasets** | Upload raw feedback files (CSV, JSON, XLSX), list datasets, retrieve raw records (`POST /api/v1/datasets`, `GET /api/v1/datasets/{id}/records`) |
| **4** | **Data Agent - Dirty Data Preprocessing** | Validation, cleaning, preprocessing, and Gemini readiness gate (`POST /datasets/{id}/validate`, `/clean`, `/preprocess`, `/pipeline`) |
| **5** | **AI Agents & Health Probes** | Live operational diagnostic reporting status of all agents (`GET /api/v1/health/agents`) |
| **6** | **AI Analysis Pipeline (CrewAI 3-Agent Flow)** | Launch 3-agent analysis on full dataset, poll job status, retry failed stages, inspect all dataset analyses or single records (`POST /datasets/{id}/analysis`, `GET /analysis/jobs/{id}`, `GET /datasets/{id}/analyses`, `GET /analysis/{record_id}`) |
| **7** | **Product Intelligence & PM Dashboard** | Strategic KPI summaries, priority-scored issue clusters (0–100), ranked customer feature requests, trend velocity, workspace/dataset sentiment breakdown, comparative analytics, and persisted executive reports (`GET /workspaces/{id}/intelligence`, `/summary`, `/issues`, `/features`, `/trends`, `/sentiment`, `/insights`, `/comparison`, `POST /workspaces/{id}/reports`, `GET /workspaces/{id}/reports/latest`) |
| **8** | **Background Jobs & System Monitoring** | Background job polling, health checks, root endpoint (`GET /api/v1/jobs/{id}`, `GET /health`, `GET /`) |

---

### Detailed Endpoint Reference: 7. Product Intelligence & PM Dashboard

All endpoints under Phase 7 require JWT authentication (`Authorization: Bearer <token>`) and support optional `dataset_id` query filtering. If `dataset_id` is omitted, metrics and artifacts automatically aggregate across the **entire workspace**.

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/v1/workspaces/{id}/intelligence` | Complete Product Intelligence overview (KPIs, top issues, top features, trends, opportunities, recommendations, insights) | `dataset_id` (optional) |
| `GET` | `/api/v1/workspaces/{id}/intelligence/summary` | Executive KPI cards for dashboard headers (`total_feedback_analyzed`, `critical_issues_count`, `high_demand_features`) | `dataset_id` (optional) |
| `GET` | `/api/v1/workspaces/{id}/intelligence/insights` | Comprehensive list of decision-grade Product Insights, each containing all 10 structured PM decision fields | `dataset_id` (optional), `limit` (default: 50) |
| `GET` | `/api/v1/workspaces/{id}/intelligence/issues` | Priority-scored semantic issue clusters (0–100 formula with frequency, severity, trend, sentiment, and impact) | `dataset_id` (optional), `limit` (default: 50) |
| `GET` | `/api/v1/workspaces/{id}/intelligence/features` | Ranked customer feature request clusters, mention frequencies, segment targeting, and request counts | `dataset_id` (optional), `limit` (default: 50) |
| `GET` | `/api/v1/workspaces/{id}/intelligence/trends` | Period-over-period trend velocity (acceleration, deceleration, emerging themes, % changes) | `dataset_id` (optional), `limit` (default: 50) |
| `GET` | `/api/v1/workspaces/{id}/intelligence/sentiment` | Customer sentiment breakdown (positive, negative, neutral, mixed) with percentage ratios across workspace or dataset | `dataset_id` (optional) |
| `GET` | `/api/v1/workspaces/{id}/intelligence/comparison` | Period-over-period and multi-dataset comparison analytics backed by live MongoDB aggregations | `comparison_type`, `quick_range`, `dataset_id` (optional) |
| `POST` | `/api/v1/workspaces/{id}/reports` | Generate and persist an executive product intelligence report with summary KPIs, prioritized issues, feature demand rankings, and strategic takeaways | `dataset_id` (optional), `report_type` (`executive_summary` / `roadmap_brief`) |
| `GET` | `/api/v1/workspaces/{id}/reports/latest` | Retrieve the latest compiled executive PM report for the workspace or dataset | `dataset_id` (optional) |

---

## 🎯 The 10 Product Intelligence Decision Fields

Every insight generated by Agent 3 (`ProductIntelligenceAgent`) and stored in MongoDB `product_insights_collection` includes 10 structured PM decision fields designed to support immediate executive roadmapping and engineering triage:

1. **`business_impact`**: Quantified organizational risk, retention impact, and metric areas:
   ```json
   {
     "level": "high",
     "impact_areas": ["customer_satisfaction", "task_completion", "revenue_risk", "conversion_rate"],
     "description": "Unaddressed payment friction directly impacts conversion rate and customer retention."
   }
   ```
2. **`feature_opportunity`**: Concrete product opportunity derived from customer feedback:
   ```json
   {
     "identified": true,
     "area": "Payment & Checkout",
     "opportunity": "Optimize one-click checkout and error recovery",
     "expected_value": "Eliminate user drop-off and improve checkout conversion."
   }
   ```
3. **`product_recommendation`**: Actionable strategic product decision with clear rationale:
   ```json
   {
     "action": "Investigate payment gateway timeouts and implement card auto-retry",
     "rationale": "Identified by customer reports with 100% negative sentiment.",
     "priority": "high"
   }
   ```
4. **`root_cause`**: Underlying UX/architectural friction hypothesis (strictly marked as `hypothesis` until verified by production telemetry):
   ```json
   {
     "status": "hypothesis",
     "description": "Potential gateway timeout or client-side form validation mismatch.",
     "confidence": 0.70
   }
   ```
5. **`affected_feature`**: Specific system feature or component name (e.g. `"Payment & Checkout Gateway"`, `"Product Search & Filter Engine"`).
6. **`evidence`**: Auditable customer evidence with record count, share percentage, IDs, and qualitative summary:
   ```json
   {
     "record_count": 2,
     "percentage": 6.7,
     "record_ids": ["FB001", "FB013"],
     "supporting_records": ["FB001", "FB013"],
     "evidence_summary": "Backed by 2 customer feedback record(s) experiencing checkout friction."
   }
   ```
7. **`confidence`**: Statistical and semantic confidence in the formulated insight:
   ```json
   { "score": 85, "level": "high" }
   ```
8. **`recommended_next_steps`**: Sequential, multi-step engineering and PM action checklist:
   ```json
   [
     "Audit operational telemetry and error logs for checkout gateway.",
     "Review qualitative evidence records (FB001, FB013).",
     "Collaborate with the payments squad to scope preventative UX enhancements.",
     "Track period trend velocity post-release to verify customer friction resolution."
   ]
   ```
9. **`priority`**: Deterministic score (0–100) paired with transparent PM rationale:
   ```json
   {
     "score": 71.7,
     "level": "high",
     "reason": "Severity is high with 100% negative sentiment; evidence frequency is 2 signal(s) (6.7% of dataset)."
   }
   ```
10. **`trend`**: Time-series velocity direction (`increasing`, `decreasing`, `stable`, `emerging`, or `insufficient_data`):
    ```json
    {
      "direction": "increasing",
      "change_percentage": 100.0,
      "comparison_period": "previous_period",
      "current_frequency": 2,
      "previous_frequency": 1,
      "confidence": 0.75,
      "reason": "Frequency velocity evaluated over observed periods (+100.0% change)."
    }
    ```

---

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- MongoDB instance (local `mongodb://localhost:27017` or MongoDB Atlas)
- Google Gemini API Key (optional for live LLM inference; platform includes deterministic heuristic fallback for offline operation)

### 1. Configure Environment Variables
Create a `.env` file in the `backend/` directory:

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
cd backend
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

## 🧪 Running the Automated Test Suite

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
