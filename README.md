# CSV → Validate → Clean → MongoDB Pipeline (Beginner Guide)

This is a small, focused project that does exactly one thing well:
takes a CSV file, checks every row for problems, cleans up the good
rows, and saves **both the raw and the cleaned versions into MongoDB,
in two separate collections.**

Read this top to bottom before running anything — each section builds
on the last.

---

## Part 1: Understand the idea before touching code

### What is a MongoDB "collection"?

If you're used to spreadsheets: a MongoDB **database** is like an
Excel workbook, a **collection** is like one sheet in that workbook,
and a **document** is like one row in that sheet — except each row
can be a small JSON object instead of flat columns.

This project creates 3 collections automatically the first time you
insert into them (you never have to "create" a collection by hand):

| Collection | What it holds |
|---|---|
| `batches` | One document per CSV upload — like a receipt. Filename, when it was uploaded, how many rows, final counts. |
| `raw_data` | One document per row, **exactly as it appeared in the CSV**, untouched. |
| `cleaned_data` | One document per row that **passed validation**, after cleaning/normalizing. |

### Why two separate collections instead of one?

1. You always want an untouched copy of what was uploaded. If your
   cleaning logic ever has a bug, you can reprocess from `raw_data`
   without needing the person to re-upload the file.
2. `raw_data` and `cleaned_data` will have **different row counts** —
   bad rows (missing fields, invalid rating, duplicates) get dropped
   during cleaning. Keeping them separate makes that difference
   visible: you can always see "12 rows came in, 9 made it through."

### The flow, step by step

```
CSV file
   │
   ▼
1. Parse into rows (list of Python dictionaries)
   │
   ▼
2. Store EVERY row into raw_data, untouched
   │
   ▼
3. Validate every row (check required fields, types, ranges, duplicates)
   │
   ▼
4. Clean only the rows that PASSED validation (normalize text, dates, etc.)
   │
   ▼
5. Store the cleaned rows into cleaned_data (a separate collection)
```

---

## Part 2: The files, and what each one does

Read them in this order — each one is short and does one job:

1. **`app/config.py`** — loads your MongoDB connection string from `.env`
2. **`app/database.py`** — connects to MongoDB, defines the 3 collections
3. **`app/validator.py`** — checks each row, returns `(is_valid, errors)` — never changes the data
4. **`app/cleaner.py`** — takes an already-valid row and normalizes it
5. **`app/pipeline.py`** — runs steps 1-5 above in order; this is the file that ties everything together
6. **`app/main.py`** — the FastAPI web server with an upload endpoint

Open each file — every function has a comment above it explaining what it does and why.

---

## Part 3: Set up and run it

### Step 1: Install Python tools

```bash
cd csv-pipeline
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Get a MongoDB connection string

If you already set this up for the earlier project, reuse the same
Atlas cluster — just use a different database name so the data
doesn't mix in with anything else.

1. In MongoDB Atlas, click **Connect** → **Drivers** → copy the connection string.
2. Run:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and paste your connection string into `MONGODB_URI`.

### Step 3: Confirm the database connects

```bash
python -c "from app.database import check_connection; print('Connected!' if check_connection() else 'Failed')"
```

You should see `Connected!`.

### Step 4: Run the unit tests (no database needed for these)

```bash
pytest tests/ -v
```

These test `validator.py` and `cleaner.py` directly with plain
dictionaries — no MongoDB involved, so they run instantly and are a
good way to see the validation rules in action without uploading
anything.

### Step 5: Start the API

```bash
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs — this is FastAPI's interactive docs page.

### Step 6: Upload the sample CSV

In the `/docs` page, open `POST /upload-csv`, click "Try it out", choose
`sample_data/sample_feedback.csv`, and execute.

`sample_feedback.csv` has 12 rows, with 3 bad ones on purpose:
- Row 10 has no rating
- Row 11 has rating = 7 (outside the allowed 1-5 range)
- Row 12 is a duplicate of row 2

You should get a response like:

```json
{
  "batch_id": "...",
  "total_rows": 12,
  "valid_rows": 9,
  "invalid_rows": 2,
  "duplicate_rows": 1,
  "quality_score": 75.0,
  "raw_rows_stored": 12,
  "cleaned_rows_stored": 9,
  "row_errors": [
    {"row_number": 10, "errors": ["Missing required field: 'rating'"]},
    {"row_number": 11, "errors": ["'rating' must be between 1 and 5, got: 7"]},
    {"row_number": 12, "errors": ["Duplicate of an earlier row in this file"]}
  ]
}
```

Notice: **12 rows went into `raw_data`, but only 9 went into `cleaned_data`** — that's the whole point of keeping them separate.

### Step 7: Look at the data two ways

**Through the API** — copy the `batch_id` from Step 6's response, then in `/docs` try:
- `GET /batches/{batch_id}/raw` — see all 12 untouched rows
- `GET /batches/{batch_id}/cleaned` — see the 9 cleaned rows (compare row 4 — the raw version has `"VERY SLOW CHECKOUT!!!"`, the cleaned version has `"very slow checkout"`)

**Through MongoDB Atlas directly** — in Atlas, click **Browse Collections**
on your cluster. You'll see `batches`, `raw_data`, and `cleaned_data` as
three separate collections, exactly like three separate folders, each
holding its own documents.

---

## Part 4: Adapting this to your own CSV

The demo validates a specific shape (`customer_id, rating, feedback, date`).
To handle a different CSV:

1. Open `app/validator.py`, change `REQUIRED_FIELDS` to your column names.
2. Update the checks inside `validate_row()` to match your rules (e.g. if
   you don't have a "rating," remove that range check; add checks for
   whatever fields you do have).
3. Open `app/cleaner.py`, update `clean_row()` to build the shape you want
   for your cleaned data.

The pattern — check required fields, then types, then ranges, then
duplicates — stays the same no matter what columns you're validating.

---

## Troubleshooting

| Problem | Likely cause |
|---|---|
| `MONGODB_URI is not set` warning | You didn't run `cp .env.example .env`, or forgot to fill it in |
| `ModuleNotFoundError` | Virtual environment isn't activated |
| Upload returns 400 "Please upload a .csv file" | Check the file extension is literally `.csv` |
| `raw_data` has rows but `cleaned_data` is empty | Every row failed validation — check the `row_errors` in the upload response to see why |
| Duplicate rows aren't being caught | Duplicate detection compares `customer_id` + `feedback` text exactly — if your data has slightly different wording per "duplicate," it won't match; that's expected for exact-duplicate detection |

# AI-driven-product-assistant

An AI-powered assistant that understands a user's requirements in natural language, searches the available product catalog, compares relevant products, and recommends the most suitable options.

## Running the Frontend

To start the frontend development server:

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (first time only):
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Running the Backend

To start the backend FastAPI server:

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Start the Uvicorn server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
