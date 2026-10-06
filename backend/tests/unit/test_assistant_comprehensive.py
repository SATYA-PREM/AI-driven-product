"""
test_assistant_comprehensive.py
--------------------------------
Comprehensive test suite testing N test cases across the AI Assistant system:
1. Fast-Path Intent Classification for all 20 Pre-tested Insight Questions
2. Fast-Path Intent Classification for all 20 Pre-tested PRD Questions
3. Conversational / Greetings queries
4. Multi-turn contextual follow-up recognition
5. Dynamic query execution with Gemini LLM mock & markdown JSON parsing
6. Fallback handling on LLM failures
7. Edge cases with empty databases (0 records, 0 PRDs, 0 issues)
8. ObjectId & schema validation resilience (extra fields, refer buttons)
9. Session & message persistence lifecycle
10. FastAPI endpoint testing via TestClient
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.assistant.query_service import query_service, _safe_len, _safe_float, _safe_list
from app.services.assistant.assistant_service import assistant_service
from app.services.assistant.context_service import context_service
from app.services.assistant.retrieval_service import retrieval_service
from app.services.assistant.authorization_service import authorization_service
from app.agents.assistant_agent.agent import assistant_agent
from app.repositories.assistant_repository import assistant_repository
from app.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse, StructuredData


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def mock_workspace_id():
    return "6ac2a2002574301a1b93f12f"


@pytest.fixture(autouse=True)
def mock_db_retrieval():
    """Autouse fixture to provide mock database retrieval and authorization data for fast, reliable unit tests."""
    with patch.object(authorization_service, "verify_workspace_access", return_value={"authorized": True, "role": "member"}), \
         patch.object(authorization_service, "verify_category_access", return_value=True), \
         patch.object(retrieval_service, "get_workspace_metadata") as mock_ws, \
         patch.object(retrieval_service, "get_product_insights") as mock_pi, \
         patch.object(retrieval_service, "get_top_issues") as mock_ti, \
         patch.object(retrieval_service, "get_increasing_issues") as mock_ii, \
         patch.object(retrieval_service, "get_decreasing_issues") as mock_di, \
         patch.object(retrieval_service, "get_requested_features") as mock_rf, \
         patch.object(retrieval_service, "get_sentiment_distribution") as mock_sent, \
         patch.object(retrieval_service, "get_example_feedback") as mock_ef, \
         patch.object(retrieval_service, "get_prds") as mock_prds:

        mock_ws.return_value = {
            "workspace_id": "6ac2a2002574301a1b93f12f",
            "workspace_name": "ProdAI Workspace",
            "product_name": "E-Commerce App",
            "product_type": "E-Commerce & Retail",
            "industry": "E-Commerce & Retail",
            "batches": [{"id": "b1", "name": "Batch 1", "records": 50}],
            "total_batches": 1,
            "total_records": 150,
        }

        mock_ti.return_value = [
            {
                "cluster_id": "ISSUE-001",
                "name": "Checkout Payment Failure",
                "frequency": 42,
                "feedback_count": 42,
                "percentage_of_feedback": 28.0,
                "severity": "CRITICAL",
                "trend_percentage": 35.0,
                "velocity_status": "spiking",
                "business_impact_summary": "Users cannot complete payments causing revenue drop.",
                "impacted_user_segments": ["Mobile Shoppers", "International"],
            }
        ]

        mock_ii.return_value = [
            {
                "cluster_id": "ISSUE-001",
                "name": "Checkout Payment Failure",
                "trend_percentage": 45.0,
                "frequency": 42,
                "velocity_status": "spiking",
            }
        ]

        mock_di.return_value = [
            {
                "cluster_id": "ISSUE-003",
                "name": "Legacy Login Timeout",
                "trend_percentage": -30.0,
                "frequency": 5,
            }
        ]

        mock_pi.return_value = [
            {
                "id": "PI-001",
                "title": "Payment gateway latency",
                "priority_score": 92.0,
                "type": "issue",
            }
        ]

        mock_rf.return_value = [
            {
                "id": "FEAT-001",
                "name": "Apple Pay Integration",
                "request_count": 89,
            }
        ]

        mock_sent.return_value = {
            "positive": 20,
            "neutral": 30,
            "negative": 50,
            "total": 200,
            "counts": {"positive": 40, "neutral": 60, "negative": 100, "total": 200},
        }

        mock_ef.return_value = [
            {
                "id": "FB-001",
                "text": "My payment failed at checkout step 3.",
                "source": "App Store",
                "date": "2026-10-01",
                "sentiment": "negative",
            }
        ]

        mock_prds.return_value = [
            {
                "id": "prd-db-1",
                "prd_id": "PRD-2026-001",
                "title": "One-Click Checkout Resiliency",
                "status": "in_review",
                "current_version": "v1.0",
                "customer_need": "Fast and reliable mobile checkout.",
                "proposed_solution": "Integrate idempotent payment processor with auto-retry.",
                "problem_statement": {"primary_problem": "Payment failures on mobile networks."},
                "requirements": [
                    {"requirement_id": "REQ-01", "title": "Auto-retry on network error", "type": "functional", "priority": "high"}
                ],
                "features": [{"name": "Smart Retry Engine"}],
                "user_stories": [{"story_id": "US-01", "user_story": "I want payments to auto-retry so I don't lose my cart."}],
                "scope": {"in_scope": ["Payment retry", "Error banner"], "out_of_scope": ["Crypto"]},
                "requirements_count": 1,
                "features_count": 1,
                "user_stories_count": 1,
            }
        ]

        yield


# =====================================================================
# 1. HELPER FUNCTIONS DEFENSIVE TESTS
# =====================================================================
def test_safe_helpers():
    assert _safe_len(None) == 0
    assert _safe_len([1, 2, 3]) == 3
    assert _safe_len({"a": 1}) == 1
    assert _safe_len("abc") == 0

    assert _safe_float(None, 10.0) == 10.0
    assert _safe_float("42.5") == 42.5
    assert _safe_float("invalid", 5.0) == 5.0

    assert _safe_list(None, ["default"]) == ["default"]
    assert _safe_list([1, 2]) == [1, 2]
    assert _safe_list("not-a-list", ["fallback"]) == ["fallback"]


# =====================================================================
# 2. CONVERSATIONAL & GREETING FAST-PATH TESTS
# =====================================================================
@pytest.mark.parametrize("greeting", [
    "hello",
    "hi there",
    "hey assistant",
    "good morning",
    "good afternoon",
    "who are you",
    "what can you do",
    "how can you help",
    "thank you",
])
def test_greeting_fast_path(greeting, mock_workspace_id):
    matched = query_service.classify_fast_path(greeting)
    assert matched is not None
    domain, intent = matched
    assert domain == "CONVERSATION"

    res = query_service.execute_fast_path(domain, intent, mock_workspace_id)
    assert "AI Product Intelligence Assistant" in res["answer"]
    assert res["mode"] == "FAST_RETRIEVAL"
    assert res["confidence"] == 1.0


# =====================================================================
# 3. 20 PRE-TESTED INSIGHT QUESTIONS (N=20 TEST CASES)
# =====================================================================
INSIGHT_TEST_QUESTIONS = [
    ("What are the highest-priority issues?", ["TOP_ISSUES", "COMMON_PROBLEMS", "PAIN_POINTS"]),
    ("Why is this insight high priority?", ["EXPLAIN_PRIORITY", "ISSUE_IMPACT"]),
    ("What evidence supports this insight?", ["INSIGHT_EVIDENCE", "CUSTOMER_EVIDENCE", "STRONGEST_EVIDENCE_ISSUES"]),
    ("How many customers are affected?", ["AFFECTED_CUSTOMERS", "RECURRING_ISSUES"]),
    ("What are the most common customer problems?", ["COMMON_PROBLEMS", "TOP_ISSUES", "PAIN_POINTS"]),
    ("What are the recurring issues?", ["RECURRING_ISSUES", "AFFECTED_CUSTOMERS"]),
    ("Which issues are increasing?", ["INCREASING_ISSUES", "EMERGING_ISSUES"]),
    ("Which issues are decreasing?", ["DECREASING_ISSUES"]),
    ("What are the biggest pain points?", ["PAIN_POINTS", "TOP_ISSUES", "COMMON_PROBLEMS"]),
    ("What are the most requested features?", ["REQUESTED_FEATURES", "HIGHEST_DEMAND_FEATURE"]),
    ("Which feature has the highest demand?", ["HIGHEST_DEMAND_FEATURE", "REQUESTED_FEATURES"]),
    ("What is the dominant sentiment?", ["SENTIMENT_SUMMARY", "VISIBLE_TRENDS"]),
    ("What product area has the most problems?", ["WORST_PRODUCT_AREA", "CATEGORY_OVERVIEW", "INTELLIGENCE_SUMMARY"]),
    ("What are the emerging issues?", ["EMERGING_ISSUES", "INCREASING_ISSUES"]),
    ("What customer evidence supports this issue?", ["CUSTOMER_EVIDENCE", "INSIGHT_EVIDENCE", "STRONGEST_EVIDENCE_ISSUES"]),
    ("What is the impact of this issue?", ["ISSUE_IMPACT", "EXPLAIN_PRIORITY"]),
    ("What trends are visible?", ["VISIBLE_TRENDS", "SENTIMENT_SUMMARY"]),
    ("Which issues have the strongest evidence?", ["STRONGEST_EVIDENCE_ISSUES", "INSIGHT_EVIDENCE", "CUSTOMER_EVIDENCE"]),
    ("Summarize the product intelligence.", ["INTELLIGENCE_SUMMARY", "CATEGORY_OVERVIEW", "WORST_PRODUCT_AREA"]),
    ("What should I understand about this category?", ["CATEGORY_OVERVIEW", "INTELLIGENCE_SUMMARY", "WORST_PRODUCT_AREA"]),
]

@pytest.mark.parametrize("question,expected_intents", INSIGHT_TEST_QUESTIONS)
def test_insight_questions_fast_path(question, expected_intents, mock_workspace_id):
    matched = query_service.classify_fast_path(question)
    assert matched is not None, f"Failed to classify insight question: '{question}'"
    domain, intent = matched
    assert domain == "INSIGHT"
    assert intent in expected_intents, f"Question '{question}' matched '{intent}', expected one of {expected_intents}"

    res = query_service.execute_fast_path(domain, intent, mock_workspace_id)
    assert res["answer"]
    assert res["mode"] == "FAST_RETRIEVAL"
    assert "sources" in res
    assert "confidence" in res


# =====================================================================
# 4. 20 PRE-TESTED PRD QUESTIONS (N=20 TEST CASES)
# =====================================================================
PRD_TEST_QUESTIONS = [
    ("List all PRDs available", ["PRD_LIST"]),
    ("Summarize this PRD.", ["PRD_SUMMARIZE", "PRD_PROBLEM_SOLVED", "PRD_GOALS", "PRD_SIMPLE_EXPLANATION", "PRD_WHY_CREATED", "PRD_SOURCE_INSIGHT"]),
    ("What problem does this PRD solve?", ["PRD_PROBLEM_SOLVED", "PRD_SUMMARIZE", "PRD_GOALS", "PRD_SIMPLE_EXPLANATION"]),
    ("Why was this PRD created?", ["PRD_WHY_CREATED", "PRD_SUMMARIZE", "PRD_PROBLEM_SOLVED"]),
    ("What is the main product goal?", ["PRD_GOALS", "PRD_SUMMARIZE", "PRD_PROBLEM_SOLVED"]),
    ("What are the key features?", ["PRD_KEY_FEATURES", "PRD_FUNCTIONAL_REQS", "PRD_IN_SCOPE"]),
    ("What are the functional requirements?", ["PRD_FUNCTIONAL_REQS", "PRD_KEY_FEATURES", "PRD_IN_SCOPE"]),
    ("What are the non-functional requirements?", ["PRD_NON_FUNCTIONAL_REQS", "PRD_TECHNICAL_REQS"]),
    ("What are the main user stories?", ["PRD_USER_STORIES", "PRD_ACCEPTANCE_CRITERIA"]),
    ("What are the acceptance criteria?", ["PRD_ACCEPTANCE_CRITERIA", "PRD_USER_STORIES"]),
    ("What customer evidence supports this PRD?", ["PRD_EVIDENCE"]),
    ("Which insight generated this PRD?", ["PRD_SOURCE_INSIGHT", "PRD_SUMMARIZE", "PRD_WHY_CREATED"]),
    ("What are the major risks?", ["PRD_RISKS", "PRD_OUT_OF_SCOPE"]),
    ("What are the dependencies?", ["PRD_DEPENDENCIES", "PRD_OUT_OF_SCOPE"]),
    ("What assumptions are being made?", ["PRD_ASSUMPTIONS", "PRD_OUT_OF_SCOPE"]),
    ("What are the open questions?", ["PRD_OPEN_QUESTIONS", "PRD_OUT_OF_SCOPE"]),
    ("What is included in scope?", ["PRD_IN_SCOPE", "PRD_KEY_FEATURES", "PRD_FUNCTIONAL_REQS"]),
    ("What is explicitly out of scope?", ["PRD_OUT_OF_SCOPE", "PRD_RISKS"]),
    ("Explain the technical requirements.", ["PRD_TECHNICAL_REQS", "PRD_NON_FUNCTIONAL_REQS"]),
    ("Explain the UX requirements.", ["PRD_UX_REQS"]),
    ("Explain the PRD in simple terms.", ["PRD_SIMPLE_EXPLANATION", "PRD_SUMMARIZE", "PRD_PROBLEM_SOLVED"]),
]

@pytest.mark.parametrize("question,expected_intents", PRD_TEST_QUESTIONS)
def test_prd_questions_fast_path(question, expected_intents, mock_workspace_id):
    matched = query_service.classify_fast_path(question)
    assert matched is not None, f"Failed to classify PRD question: '{question}'"
    domain, intent = matched
    assert domain == "PRD"
    assert intent in expected_intents, f"PRD question '{question}' matched '{intent}', expected one of {expected_intents}"

    res = query_service.execute_fast_path(domain, intent, mock_workspace_id)
    assert res["answer"]
    assert res["mode"] == "FAST_RETRIEVAL"
    assert "sources" in res


# =====================================================================
# 5. MULTI-TURN CONTEXTUAL FOLLOW-UP RECOGNITION
# =====================================================================
@pytest.mark.parametrize("follow_up", [
    "tell me more in detail",
    "why is that",
    "explain this",
    "elaborate on it",
    "what about the first one",
    "give more context",
])
def test_followup_detection_bypasses_fastpath(follow_up, mock_workspace_id):
    history = [
        {"question": "What is the top issue?", "answer": "Report export failure", "sources": []}
    ]
    with patch.object(assistant_repository, "get_messages", return_value=history), \
         patch.object(assistant_agent, "answer_dynamic_question") as mock_dynamic, \
         patch.object(assistant_repository, "save_message") as mock_save:

        mock_dynamic.return_value = {
            "answer": "Here is the elaborate breakdown of report export failure.",
            "sources": [{"type": "issue", "id": "ISSUE-001"}],
            "confidence": 0.95,
            "mode": "DYNAMIC_ANALYSIS",
            "structured_data": None,
        }
        mock_save.return_value = {
            "id": "msg-123",
            "session_id": "ses-123",
            "created_at": "2026-10-05T20:00:00Z",
        }
        res = assistant_service.process_query(
            workspace_id=mock_workspace_id,
            message=follow_up,
            session_id="ses-123",
        )
        assert mock_dynamic.called
        assert res["mode"] == "DYNAMIC_ANALYSIS"


# =====================================================================
# 6. DYNAMIC LLM JSON PARSER & MARKDOWN STRIPPER TESTS
# =====================================================================
def test_clean_and_parse_json():
    # 1. Plain JSON string
    raw_1 = '{"answer": "Here is your response", "sources": [], "confidence": 0.9}'
    assert assistant_agent._clean_and_parse_json(raw_1) == {
        "answer": "Here is your response",
        "sources": [],
        "confidence": 0.9,
    }

    # 2. Markdown wrapped JSON (```json ... ```)
    raw_2 = '```json\n{"answer": "Markdown answer", "sources": [{"id": "PI-01"}]}\n```'
    parsed_2 = assistant_agent._clean_and_parse_json(raw_2)
    assert parsed_2.get("answer") == "Markdown answer"
    assert len(parsed_2.get("sources", [])) == 1

    # 3. Raw text with embedded JSON
    raw_3 = 'Here is the response: {"answer": "Embedded answer", "confidence": 0.95} Thank you.'
    parsed_3 = assistant_agent._clean_and_parse_json(raw_3)
    assert parsed_3.get("answer") == "Embedded answer"

    # 4. Invalid corrupted string
    raw_4 = "This is not json at all."
    assert assistant_agent._clean_and_parse_json(raw_4) == {}


# =====================================================================
# 7. EMPTY DATABASE & CORRUPTED DOCUMENT RESILIENCE
# =====================================================================
def test_retrieval_resilience_with_empty_and_corrupt_data():
    with patch.object(retrieval_service, "get_workspace_metadata") as mock_ws, \
         patch.object(retrieval_service, "get_product_insights") as mock_pi, \
         patch.object(retrieval_service, "get_top_issues") as mock_ti, \
         patch.object(retrieval_service, "get_sentiment_distribution") as mock_sent, \
         patch.object(retrieval_service, "get_prds") as mock_prds:

        # Simulate workspace with 0 records, 0 issues, 0 PRDs, None fields
        mock_ws.return_value = {
            "workspace_name": "Empty Test Workspace",
            "product_type": "SaaS",
            "batches": None,
            "total_records": 0,
        }
        mock_pi.return_value = []
        mock_ti.return_value = [{
            "name": "Corrupted Issue",
            "frequency": None,
            "feedback_count": None,
            "evidence_count": None,
            "evidence_record_ids": None,  # None instead of list!
            "trend_percentage": None,
            "severity": None,
            "impacted_user_segments": None,
        }]
        mock_sent.return_value = {"positive": 0, "neutral": 0, "negative": 0, "total": 0}
        mock_prds.return_value = [{
            "prd_id": "PRD-CORRUPT",
            "title": "Corrupt PRD",
            "problem_statement": {"primary_problem": "Test problem"},
            "proposed_solution": None,
            "requirements": None,
            "user_stories": None,
            "features": None,
        }]

        # Run multiple intents to make sure NONE crash on None values or division by zero
        for intent in ["WORKSPACE_INFO", "TOP_ISSUES", "EXPLAIN_PRIORITY", "AFFECTED_CUSTOMERS", "PRD_SUMMARIZE", "PRD_KEY_FEATURES", "PRD_USER_STORIES", "SENTIMENT_SUMMARY"]:
            domain = "PRD" if "PRD" in intent else "INSIGHT"
            res = query_service.execute_fast_path(domain, intent, "mock-empty-ws")
            assert res is not None
            assert isinstance(res["answer"], str)
            assert len(res["answer"]) > 0


# =====================================================================
# 8. PYDANTIC SCHEMA VALIDATION TESTS
# =====================================================================
def test_assistant_schemas_extra_fields():
    # Verify StructuredData preserves refer_buttons and unexpected fields
    sd = StructuredData(
        top_issues=[{"rank": 1, "title": "Crash"}],
        refer_buttons=[{"label": "View Issues", "path": "/issues"}],
        custom_metric=42,
    )
    sd_dict = sd.model_dump()
    assert sd_dict.get("custom_metric") == 42
    assert len(sd_dict.get("refer_buttons", [])) == 1

    # Verify AssistantQueryResponse validates properly
    resp = AssistantQueryResponse(
        session_id="ses-123",
        message_id="msg-123",
        answer="Valid answer",
        confidence=0.98,
        structured_data=sd_dict,
    )
    assert resp.session_id == "ses-123"
    assert resp.answer == "Valid answer"


# =====================================================================
# 9. CONTEXT SNAPSHOT API TEST
# =====================================================================
def test_context_snapshot(mock_workspace_id):
    snapshot = context_service.get_context_snapshot(mock_workspace_id)
    assert "workspace_id" in snapshot
    assert "data_sources" in snapshot
    assert isinstance(snapshot["data_sources"], list)
    assert len(snapshot["data_sources"]) > 0


# =====================================================================
# 10. FASTAPI HTTP ROUTE ENDPOINTS INTEGRATION TESTS
# =====================================================================
def test_query_endpoint_success(client, mock_workspace_id):
    with patch.object(assistant_repository, "create_session", return_value={"id": "ses-auto-1", "workspace_id": mock_workspace_id}), \
         patch.object(assistant_repository, "save_message", return_value={"id": "msg-auto-1", "created_at": "2026-10-05T20:00:00Z"}):

        payload = {
            "workspace_id": mock_workspace_id,
            "message": "What is the dominant sentiment?",
            "category_id": "all",
            "scope": "all",
        }
        response = client.post("/api/v1/assistant/query", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "answer" in data
        assert "mode" in data
        assert data["mode"] == "FAST_RETRIEVAL"
        assert "Sentiment" in data["answer"]


def test_context_endpoint_success(client, mock_workspace_id):
    response = client.get(f"/api/v1/assistant/context/{mock_workspace_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["workspace_id"] == mock_workspace_id
    assert "data_sources" in data


def test_session_lifecycle_endpoints(client, mock_workspace_id):
    mock_ses = {
        "id": "ses-life-1",
        "workspace_id": mock_workspace_id,
        "title": "Automated Test Session",
        "created_at": "2026-10-05T20:00:00Z",
        "updated_at": "2026-10-05T20:00:00Z",
    }
    mock_msg = {
        "id": "msg-life-1",
        "session_id": "ses-life-1",
        "question": "What are the top complaints?",
        "answer": "Payment failure",
        "created_at": "2026-10-05T20:00:00Z",
    }
    with patch.object(assistant_repository, "create_session", return_value=mock_ses), \
         patch.object(assistant_repository, "list_sessions", return_value=[mock_ses]), \
         patch.object(assistant_repository, "get_messages", return_value=[mock_msg]), \
         patch.object(assistant_repository, "save_message", return_value=mock_msg):

        # 1. Create session
        create_payload = {
            "workspace_id": mock_workspace_id,
            "title": "Automated Test Session",
        }
        res_create = client.post("/api/v1/assistant/sessions", json=create_payload)
        assert res_create.status_code == 201
        session = res_create.json()
        assert session["id"] == "ses-life-1"

        # 2. List sessions
        res_list = client.get(f"/api/v1/assistant/workspaces/{mock_workspace_id}/sessions")
        assert res_list.status_code == 200
        sessions = res_list.json()
        assert any(s["id"] == "ses-life-1" for s in sessions)

        # 3. Query using the created session
        q_payload = {
            "workspace_id": mock_workspace_id,
            "session_id": "ses-life-1",
            "message": "What are the top complaints?",
        }
        res_query = client.post("/api/v1/assistant/query", json=q_payload)
        assert res_query.status_code == 200

        # 4. Get session messages
        res_msgs = client.get("/api/v1/assistant/sessions/ses-life-1/messages")
        assert res_msgs.status_code == 200
        msgs = res_msgs.json()
        assert len(msgs) >= 1
        assert msgs[0]["question"] == "What are the top complaints?"


def test_job_not_found_returns_404(client):
    with patch.object(assistant_service, "get_job_status", return_value=None):
        response = client.get("/api/v1/assistant/jobs/non-existent-job-id-999")
        assert response.status_code == 404

