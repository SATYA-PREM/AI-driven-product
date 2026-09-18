# Product Intelligence Platform 🚀

> An end-to-end, agentic AI platform that transforms unstructured customer feedback into prioritized, evidence-backed product intelligence and actionable roadmaps for Product Managers.

---

## 🌟 Overview

The **Product Intelligence Platform** replaces manual, subjective feedback triage with a deterministic, multi-agent AI pipeline. It ingests customer feedback files (CSV, JSON, XLSX), validates and cleans raw records, performs 10-dimensional AI signal extraction across **100% of dataset records**, clusters recurring issues and feature requests, and presents decision-grade PM intelligence via an intuitive React dashboard.

```
[ Customer Feedback File ] (CSV / JSON / XLSX)
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│                 Phase 1: Data Preprocessing              │
│  - File Parsing & Schema Validation                     │
│  - Deduplication & Sanitization (Quality Score 0-100%)  │
│  - Tokenization & Signal Standardization                │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Phase 2: 3-Agent CrewAI Pipeline           │
│  - Agent 1: Feedback Analysis (10 dimensions per row)   │
│  - Agent 2: Pattern & Trend (Semantic Clustering)        │
│  - Agent 3: Product Intelligence (Priority Scoring)     │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│             Phase 3: Live PM Intelligence Hub           │
│  - Overview Dashboard & KPI Summary Cards               │
│  - 7 Specialized Insights Views (Pain Points, Trends,   │
│    Themes, Sentiment, Segments, Comparisons)            │
│  - Critical Issues & Engineering Task Conversion        │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 🧠 Autonomous 3-Agent CrewAI Pipeline
1. **Feedback Analysis Agent**: Evaluates 100% of dataset records across 10 dimensions: Sentiment, Intent, Theme, Product Area, Specific Issues, Pain Points, Feature Requests, Keywords, Confidence, and Impact.
2. **Pattern & Trend Agent**: Clusters raw feedback into semantic problem groups and feature request backlogs while calculating period-over-period trend velocity.
3. **Product Intelligence Agent**: Synthesizes 10 structured PM decision fields and assigns deterministic priority scores ($0–100$) using the formula:
   $$\text{Score} = (\text{Frequency} \times 0.35) + (\text{Severity} \times 0.25) + (\text{Trend} \times 0.15) + (\text{Sentiment} \times 0.15) + (\text{Impact} \times 0.10)$$

### 📊 PM Intelligence Dashboard & Insights Views
- **Overview**: Executive dashboard headers, critical issue count, high demand features, and strategic recommendations.
- **Pain Points**: Deep inspection of customer friction points backed by 100% record coverage and direct customer quotes.
- **Trends**: Track period-over-period acceleration and deceleration across product modules.
- **Themes**: Multi-dimensional semantic category breakdown across system components.
- **Sentiment**: Real-time sentiment distribution ratios (Positive, Negative, Neutral, Mixed).
- **Segments**: Customer segment breakdown (Enterprise, SMB, Power Users, Free Tier).
- **Comparisons**: Multi-angle comparative analytics across time frames, dataset batches, customer segments, and competing product modules.
- **Critical Issues**: Dedicated priority triage page ($\ge 70$ score) with one-click engineering task conversion.

### 🛡️ Clean Data Guarantee & 100% Record Coverage
- **Raw vs. Cleaned Separation**: Ingested data is stored untouched in `raw_data` collection while processed records are saved in `cleaned_data`.
- **Zero Sampling**: Agent 1 analyzes every single row without capping or sampling.
- **Self-Healing Synthesis**: Aggregates metrics live from MongoDB documents even if pre-saved summary caches are empty.

---

## 📁 Repository Structure

```
.
├── backend/                    # FastAPI + CrewAI + MongoDB Backend
│   ├── app/
│   │   ├── api/v1/             # Modular REST API routes organized by phase
│   │   ├── core/               # App configuration, security, MongoDB database init
│   │   ├── models/             # Data models and MongoDB document schemas
│   │   ├── services/           # Data cleaning, CrewAI agents, Intelligence Service
│   │   └── main.py             # FastAPI entry point & middleware configuration
│   ├── tests/                  # Pytest unit and integration test suite
│   ├── requirements.txt        # Python backend dependencies
│   └── README.md               # Backend documentation
│
├── frontend/                   # React 19 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # Common UI components & layout shell
│   │   ├── features/           # Intelligence views, PM Dashboard, AI Agents, Data Agent
│   │   ├── services/           # API integration clients
│   │   └── App.jsx             # React router & main entry
│   ├── package.json            # Node.js dependencies & scripts
│   ├── vite.config.js          # Vite build configuration
│   └── README.md               # Frontend documentation
│
└── README.md                   # Master project documentation (this file)
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.11 or higher
- **MongoDB**: Local instance (`mongodb://localhost:27017`) or MongoDB Atlas URI
- **Google Gemini API Key**: (Optional; platform includes deterministic fallback heuristics)

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (.env)
cp .env.example .env
# Edit .env and specify your MONGODB_URI and GEMINI_API_KEY if available

# Start FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc API Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Configure environment variables (.env)
# Create a .env file with: VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1

# Start Vite dev server
npm run dev
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Automated Tests

```bash
# Run backend test suite
cd backend
python -m pytest tests/ -v

# Run frontend production build check
cd frontend
npm run build
```

---

## 🤝 Technical Stack Summary

| Domain | Technology / Framework |
|---|---|
| **Frontend UI** | React 19, Vite, Tailwind CSS, Lucide Icons, Axios |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, Pydantic v2 |
| **AI & Agent Orchestration** | CrewAI, Google Gemini API (`gemini-2.0-flash`) |
| **Database** | MongoDB Atlas / PyMongo / Motor |
| **Testing** | Pytest, Vite Build Compiler |

---

## 📄 Documentation Links

- [Backend Detailed README](file:///d:/PROJECTS/AI-driven-product/AI-driven-product/backend/README.md)
- [Frontend Detailed README](file:///d:/PROJECTS/AI-driven-product/AI-driven-product/frontend/README.md)
