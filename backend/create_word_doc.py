"""
create_word_doc.py
------------------
Generates the comprehensive Microsoft Word (.docx) specification document:
"Autonomous 3-Agent AI Pipeline: Architecture, Models, and Production Prompt Specification"
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """Set background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner margins of a table cell in dxa (1 pt = 20 dxa)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def add_callout(doc, text, title=None, border_color="2563EB", bg_color="F1F5F9"):
    """Adds a stylish callout box using a 1-cell table."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>'
        f'<w:top w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    
    if title:
        run_title = p.add_run(f"{title}\n")
        run_title.bold = True
        run_title.font.name = "Arial"
        run_title.font.size = Pt(10.5)
        run_title.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        
    run_text = p.add_run(text)
    run_text.font.name = "Arial"
    run_text.font.size = Pt(9.5)
    run_text.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    # Add spacing paragraph after table
    post_p = doc.add_paragraph()
    post_p.paragraph_format.space_before = Pt(0)
    post_p.paragraph_format.space_after = Pt(4)

def add_code_block(doc, code_str, bg_color="F8FAFC"):
    """Adds a code block container with monospaced font."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.cell(0, 0)
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="12" w:space="0" w:color="CBD5E1"/>'
        f'<w:top w:val="single" w:sz="12" w:space="0" w:color="CBD5E1"/>'
        f'<w:right w:val="single" w:sz="12" w:space="0" w:color="CBD5E1"/>'
        f'<w:bottom w:val="single" w:sz="12" w:space="0" w:color="CBD5E1"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.05
    
    run = p.add_run(code_str)
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    
    post_p = doc.add_paragraph()
    post_p.paragraph_format.space_before = Pt(0)
    post_p.paragraph_format.space_after = Pt(4)

def style_table_header(row, bg_hex="1E293B"):
    """Style the header row of a table."""
    for cell in row.cells:
        set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            for r in p.runs:
                r.bold = True
                r.font.name = "Arial"
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

def style_table_body(row, is_even=False):
    """Style body rows with alternating stripes."""
    bg_hex = "F8FAFC" if is_even else "FFFFFF"
    for cell in row.cells:
        set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        for p in cell.paragraphs:
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(9.0)
                r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

def build_document():
    doc = docx.Document()
    
    # Page setup - 0.8 inch margins
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(0.8)
        s.bottom_margin = Inches(0.8)
        s.left_margin = Inches(0.8)
        s.right_margin = Inches(0.8)
        
    # Styles setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Arial'
    normal_style.font.size = Pt(10)
    normal_style.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    # ── HEADER BANNER ──────────────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(10)
    title_p.paragraph_format.space_after = Pt(2)
    title_run = title_p.add_run("Autonomous 3-Agent AI Pipeline")
    title_run.font.name = "Arial"
    title_run.font.size = Pt(24)
    title_run.bold = True
    title_run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    sub_run = sub_p.add_run("Models, Model Providers, System Backstories, and Production Prompt Specification")
    sub_run.font.name = "Arial"
    sub_run.font.size = Pt(13)
    sub_run.bold = True
    sub_run.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    # Metadata Table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Platform / System", "AI-Driven Product Intelligence Platform (CrewAI + FastAPI + MongoDB)"),
        ("Active Model Provider", "Google AI / Google Cloud Platform (google-genai SDK)"),
        ("Active Primary Model", "Google Gemini 3.5 Flash-Lite (Configurable: gemini-2.0-flash, gemini-1.5-flash)"),
        ("Architecture Mode", "Deterministic 3-Stage Sequential Pipeline (Process.sequential)"),
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c1, c2 = row.cells[0], row.cells[1]
        c1.width = Inches(2.2)
        c2.width = Inches(4.3)
        set_cell_background(c1, "F1F5F9")
        set_cell_background(c2, "F8FAFC")
        set_cell_margins(c1, 80, 80, 100, 100)
        set_cell_margins(c2, 80, 80, 100, 100)
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(k)
        r1.bold = True
        r1.font.size = Pt(9)
        r1.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        p2 = c2.paragraphs[0]
        r2 = p2.add_run(v)
        r2.font.size = Pt(9)
        r2.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(12)
    
    # ── SECTION 1: EXECUTIVE SUMMARY & MASTER SEQUENCE ────────────────────────
    h1 = doc.add_heading("1. Executive Summary & Master Sequential Architecture", level=1)
    h1.style.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    doc.add_paragraph(
        "The AI-Driven Product Intelligence Platform automates the transformation of unstructured customer feedback "
        "into decision-grade, auditable Product Intelligence. The pipeline adheres to a strict 3-agent sequential workflow "
        "orchestrated via CrewAI (Process.sequential). Each agent operates within rigid analytical boundaries to prevent "
        "hallucination, retain end-to-end auditability, and ensure that product managers receive actionable, evidence-backed insights."
    )
    
    add_callout(
        doc,
        "Master Pipeline Flow:\n"
        "• Input: AI-Ready Preprocessed Feedback Records (Milestone 1 output)\n"
        "• Stage 1 (Agent 1): Feedback Analysis Agent → Extracts 10 granular dimensions per record under strict Do-Not-Infer policy\n"
        "• Stage 2 (Agent 2): Pattern & Trend Agent → Aggregates analyses into semantically cohesive issue & feature clusters\n"
        "• Stage 3 (Agent 3): Product Intelligence Agent → Synthesizes strategic insights containing 10 PM decision fields\n"
        "• Destination: MongoDB collections (ai_analyses, issue_clusters, feature_clusters, trend_metrics, product_insights)",
        title="MASTER SEQUENCE (ONE DETERMINISTIC FLOW)"
    )
    
    # ── SECTION 2: MODEL AND PROVIDER INFRASTRUCTURE ─────────────────────────
    h2 = doc.add_heading("2. AI Model and Provider Infrastructure", level=1)
    h2.style.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    doc.add_paragraph(
        "All three agents leverage Google's state-of-the-art Gemini multimodal and reasoning models, administered through "
        "the official Google GenAI SDK with structured schema enforcement."
    )
    
    model_table = doc.add_table(rows=6, cols=2)
    model_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    infra_rows = [
        ("Model Provider", "Google AI (Google Cloud Platform - Generative Language API)"),
        ("Python SDK", "google-genai (Official SDK: from google import genai)"),
        ("Production Model", "gemini-3.5-flash-lite (Cost-effective, sub-second latency, structured JSON native)"),
        ("Alternative Fallbacks", "gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro"),
        ("Execution Parameters", "Temperature: 0.1 – 0.2 (High determinism, low hallucination, strict schema adherence)\nTop-P: 0.95 | Structured Output: response_mime_type='application/json'"),
        ("Reliability & Resilience", "Exponential backoff retry with jitter, circuit breaker pattern, 429 quota exhaustion mitigation"),
    ]
    for i, (k, v) in enumerate(infra_rows):
        row = model_table.rows[i]
        c1, c2 = row.cells[0], row.cells[1]
        c1.width = Inches(2.2)
        c2.width = Inches(4.3)
        c1.paragraphs[0].text = k
        c2.paragraphs[0].text = v
        set_cell_background(c1, "F1F5F9" if i % 2 == 0 else "FFFFFF")
        set_cell_background(c2, "F8FAFC" if i % 2 == 0 else "FFFFFF")
        set_cell_margins(c1, 80, 80, 100, 100)
        set_cell_margins(c2, 80, 80, 100, 100)
        p1 = c1.paragraphs[0]
        if p1.runs:
            p1.runs[0].bold = True
            p1.runs[0].font.size = Pt(9)
            p1.runs[0].font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        p2 = c2.paragraphs[0]
        if p2.runs:
            p2.runs[0].font.size = Pt(9)
            p2.runs[0].font.color.rgb = RGBColor(0x33, 0x41, 0x55)
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # ── SECTION 3: AGENT 1 - FEEDBACK ANALYSIS AGENT ─────────────────────────
    h3 = doc.add_heading("3. Agent 1 – Feedback Analysis Agent Specification", level=1)
    h3.style.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    doc.add_paragraph(
        "Agent 1 is the atomic signal extraction specialist. It processes individual customer feedback records "
        "one by one (or in micro-batches) to extract truthful, granular classifications without extrapolating beyond the text."
    )
    
    add_callout(
        doc,
        "• Agent Name: Feedback Analysis Agent\n"
        "• Agent Role: Customer Feedback Analysis Specialist\n"
        "• Primary Model: Google Gemini 3.5 Flash-Lite (Google AI)\n"
        "• Primary Goal: Analyze individual customer feedback records and extract accurate, structured information "
        "about sentiment, intent, themes, pain points, issues, feature requests and product areas.\n"
        "• Target MongoDB Collection: ai_analyses",
        title="AGENT 1 METADATA & PROFILE",
        border_color="2563EB"
    )
    
    doc.add_heading("3.1 System Backstory & Operational Guardrails", level=2)
    add_callout(
        doc,
        "You are a customer feedback analysis specialist with expertise in interpreting unstructured customer feedback.\n\n"
        "Your responsibility is to extract truthful, granular product signals based strictly on the text provided, "
        "without inventing, hallucinating, or extrapolating information.\n\n"
        "Core Principles:\n"
        "1. Strict Do-Not-Infer Policy:\n"
        "   - Use only information explicitly contained in the supplied feedback record.\n"
        "   - Do not infer a feature request unless the customer explicitly requests or clearly proposes a change.\n"
        "   - Do not classify a bug solely because the customer's sentiment or experience is negative.\n"
        "   - Do not assign severity or emotional intensity unless directly supported by the feedback wording.\n"
        "   - Do not invent product areas, architectural causes, or technical root causes.\n"
        "   - Every extracted issue, pain point, and feature request must be traceable to the feedback text.\n"
        "   - If information is unavailable or absent, return an empty list or null rather than guessing.\n\n"
        "2. Distinct Classification Categories:\n"
        "   - Pain Point: The customer's emotional friction, barrier, or difficulty experienced (e.g. 'slow checkout experience').\n"
        "   - Issue: A concrete product bug, error, defect, or performance failure (e.g. 'gateway timeout error').\n"
        "   - Feature Request: An explicit request or suggestion for new, expanded, or altered capability (e.g. 'add dark mode'). "
        "If the customer is merely complaining about existing behavior, feature_requests must be empty [].\n\n"
        "You do not determine overall product priority, collective clusters, or roadmap decisions — you focus strictly "
        "on understanding the individual customer's statement.",
        title="AGENT 1 SYSTEM BACKSTORY"
    )
    
    doc.add_heading("3.2 CrewAI Task Definition (Task 1)", level=2)
    doc.add_paragraph(
        "• Description: Analyze individual customer feedback record {feedback_id} from dataset '{dataset_id}' "
        "across all 10 product dimensions without inferring unstated details. Validate against schema and persist to MongoDB.\n"
        "• Expected Output: A strictly valid JSON object containing verified 10-dimension classifications "
        "(sentiment, intent, theme, product_area, pain_points, issues, feature_requests, keywords, confidences) "
        "with zero hallucinated feature requests or technical assumptions."
    )
    
    doc.add_heading("3.3 Production Prompt Template", level=2)
    add_code_block(
        doc,
        'Analyze this customer feedback record and return a strictly valid JSON object.\n\n'
        'Allowed Themes: User Interface & UX, Performance & Speed, Bug / Error, Feature Request, '
        'Billing & Pricing, Customer Support, Onboarding, Mobile Experience, Integration & API, Other\n\n'
        'Record to analyze:\n'
        '{\n'
        '  "feedback_id": "{feedback_id}",\n'
        '  "feedback_text": "{feedback_text}",\n'
        '  "rating": {rating},\n'
        '  "module_context": "{module}",\n'
        '  "platform_context": "{platform}",\n'
        '  "customer_segment": "{customer_segment}"\n'
        '}\n\n'
        'Required JSON Schema:\n'
        '{\n'
        '  "feedback_id": "{feedback_id}",\n'
        '  "sentiment": "positive" | "negative" | "neutral" | "mixed",\n'
        '  "sentiment_confidence": 0.0 - 1.0,\n'
        '  "intent": "complaint" | "bug_report" | "feature_request" | "question" | "praise" | "general_feedback",\n'
        '  "intent_confidence": 0.0 - 1.0,\n'
        '  "theme": "string (broad category from Allowed Themes)",\n'
        '  "theme_confidence": 0.0 - 1.0,\n'
        '  "product_area": "string (specific sub-feature directly referenced in text)",\n'
        '  "pain_points": ["customer emotional friction or operational difficulty experienced"],\n'
        '  "issues": ["concrete product bugs, errors, defects, or performance failures"],\n'
        '  "feature_requests": ["explicit customer requests or proposals for new or altered capabilities"],\n'
        '  "keywords": ["specific analytical terms present in the text"],\n'
        '  "overall_confidence": 0.0 - 1.0\n'
        '}\n\n'
        'Operational "Do Not Infer" Policy & Strict Classification Rules:\n'
        '1. Use ONLY information explicitly stated in the supplied feedback record.\n'
        '2. Distinct Categories:\n'
        '   - pain_points: The customer\'s emotional friction or obstacle (e.g. "slow loading experience").\n'
        '   - issues: Concrete failure or defect (e.g. "timeout error on checkout").\n'
        '   - feature_requests: Explicit proposals for new/expanded features. DO NOT infer a feature request '
        'from negative experience alone. If none requested, return [].\n'
        '3. Do not classify a bug solely because the experience is negative.\n'
        '4. Do not invent product areas, architectural causes, or technical root causes.\n'
        '5. Every extracted issue, pain point, and feature request must be directly traceable to the feedback text.\n'
        '6. If information is unavailable or unstated, return an empty array [] rather than guessing.\n'
        '7. All confidence scores must be floating-point numbers between 0.0 and 1.0.'
    )
    
    # ── SECTION 4: AGENT 2 - PATTERN & TREND AGENT ───────────────────────────
    h4 = doc.add_heading("4. Agent 2 – Pattern & Trend Analysis Agent Specification", level=1)
    h4.style.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    doc.add_paragraph(
        "Agent 2 operates as the statistical aggregator and pattern discoverer. It takes the validated individual "
        "analyses produced by Agent 1 and groups them into normalized clusters and time-series trends without guessing or altering metrics."
    )
    
    add_callout(
        doc,
        "• Agent Name: PatternTrendAgent\n"
        "• Agent Role: Customer Pattern & Trend Analyst\n"
        "• Primary Model: Google Gemini 3.5 Flash-Lite (Google AI)\n"
        "• Primary Goal: Analyze validated individual feedback analyses to identify recurring issues, feature-request patterns, "
        "semantic clusters, themes, frequencies, trends, emerging problems and changes over time.\n"
        "• Target MongoDB Collections: issue_clusters, feature_clusters, trend_metrics, theme_patterns",
        title="AGENT 2 METADATA & PROFILE",
        border_color="0D9488"
    )
    
    doc.add_heading("4.1 System Backstory & Statistical Rules", level=2)
    add_callout(
        doc,
        "You are an expert product-data analyst specializing in customer feedback aggregation.\n\n"
        "You analyze collections of structured customer feedback to discover recurring problems, semantic relationships, "
        "feature demand, and changes over time.\n\n"
        "Core Analytical & Statistical Rules:\n"
        "1. Evidence & Threshold Discipline:\n"
        "   - Semantic similarity alone is INSUFFICIENT to establish a recurring product problem.\n"
        "   - Frequency baseline: 1 feedback signal = isolated issue; 2 similar feedback signals = possible pattern / emerging issue; "
        "confirmed recurring issue requires multi-signal verification.\n"
        "   - Do NOT invent or fabricate frequency counts, percentages, or metrics.\n"
        "   - Always rely on calculated frequencies and trend percentages provided by backend analytics tools.\n"
        "2. Grouping & Clustering Boundaries:\n"
        "   - Preserve the original customer feedback IDs supporting every cluster without exception.\n"
        "   - Do NOT merge issues merely because they occur in the same broad product area.\n"
        "   - Merge issues ONLY when their underlying customer problem or friction point is materially and functionally similar.\n"
        "   - Distinguish strictly between recurring issues and emerging issues using supplied time-series and velocity trends.\n"
        "3. Decision Boundaries:\n"
        "   - You do NOT make product-priority decisions, severity determinations, or roadmap trade-offs.\n"
        "   - You focus solely on factual clustering, frequency measurement, and pattern detection across the customer base.",
        title="AGENT 2 SYSTEM BACKSTORY"
    )
    
    doc.add_heading("4.2 CrewAI Task Definition (Task 2)", level=2)
    doc.add_paragraph(
        "• Description: Identify cross-customer patterns, recurring issues, feature demand backlogs, and trends "
        "for dataset '{dataset_id}' in workspace '{workspace_id}'. Use validated Agent 1 feedback analyses, compute frequencies "
        "and period velocity, and persist normalized clusters with auditable evidence IDs.\n"
        "• Expected Output: Normalized issue clusters, feature demand backlogs, theme patterns, and period velocity trends "
        "anchored to auditable customer feedback IDs and stored in MongoDB."
    )
    
    doc.add_heading("4.3 Production Prompt Template", level=2)
    add_code_block(
        doc,
        'You are analyzing multiple customer feedback records to perform semantic clustering.\n\n'
        'Allowed Themes: {taxonomy_list}\n\n'
        'Analyzed Records:\n'
        '[\n'
        '  {\n'
        '    "feedback_id": "FB001",\n'
        '    "sentiment": "negative",\n'
        '    "theme": "Performance & Speed",\n'
        '    "product_area": "Checkout",\n'
        '    "issues": ["Payment timeout on credit card submit"],\n'
        '    "feature_requests": []\n'
        '  }\n'
        ']\n\n'
        'Return a strictly valid JSON object grouping these items into semantically cohesive clusters:\n'
        '{\n'
        '  "issue_clusters": [\n'
        '    {\n'
        '      "cluster_id": "ISSUE-001",\n'
        '      "name": "Normalized issue name (e.g. Payment Gateway Timeouts)",\n'
        '      "related_issues": ["Issue phrase 1", "Issue phrase 2"],\n'
        '      "evidence_record_ids": ["FB001", "FB013"],\n'
        '      "confidence": 0.90\n'
        '    }\n'
        '  ],\n'
        '  "feature_clusters": [\n'
        '    {\n'
        '      "cluster_id": "FEATURE-001",\n'
        '      "name": "Normalized feature name (e.g. One-Click Card Retry)",\n'
        '      "related_requests": ["Request phrase 1", "Request phrase 2"],\n'
        '      "evidence_record_ids": ["FB009", "FB021"],\n'
        '      "confidence": 0.90\n'
        '    }\n'
        '  ]\n'
        '}\n\n'
        'Analytical & Statistical Rules:\n'
        '1. Semantic similarity alone is INSUFFICIENT to establish a recurring product problem.\n'
        '2. Group items ONLY when their underlying customer friction or requested capability is materially similar.\n'
        '3. Do NOT merge issues merely because they share a broad product area or theme.\n'
        '4. Preserving original evidence feedback IDs for every cluster is MANDATORY. Never invent feedback IDs.\n'
        '5. Do NOT fabricate frequency counts or percentages; cluster composition directly defines counts.\n'
        '6. Do NOT make product-priority decisions or assign severity levels (priority belongs to Agent 3 / PM).'
    )
    
    # ── SECTION 5: AGENT 3 - PRODUCT INTELLIGENCE AGENT ──────────────────────
    h5 = doc.add_heading("5. Agent 3 – Product Intelligence Agent Specification", level=1)
    h5.style.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    doc.add_paragraph(
        "Agent 3 is the strategic synthesis engine. It transforms raw clusters, frequency counts, and velocity metrics into "
        "decision-grade product intelligence for product managers. It operates with strict advisory-only guardrails to avoid "
        "overstepping into engineering or execution management."
    )
    
    add_callout(
        doc,
        "• Agent Name: ProductIntelligenceAgent\n"
        "• Agent Role: Senior Product Intelligence Strategist\n"
        "• Primary Model: Google Gemini 3.5 Flash-Lite (Google AI)\n"
        "• Primary Goal: Transform customer-feedback patterns, issue clusters, feature demand and trends into "
        "evidence-backed product intelligence that helps Product Managers understand what problems and opportunities deserve attention.\n"
        "• Target MongoDB Collection: product_insights",
        title="AGENT 3 METADATA & PROFILE",
        border_color="7C3AED"
    )
    
    doc.add_heading("5.1 System Backstory & Non-Execution Guardrails", level=2)
    add_callout(
        doc,
        "You are a senior product intelligence strategist with expertise in customer feedback, product analytics, "
        "issue prioritization, and opportunity identification.\n\n"
        "You translate customer problems, issue clusters, and behavioral patterns into actionable product intelligence insights.\n\n"
        "Core Operating Guardrails & Decision Boundaries:\n"
        "1. Strict Evidence & Truthfulness:\n"
        "   - All recommendations must be strictly evidence-backed.\n"
        "   - Every insight MUST contain at least one valid customer evidence feedback ID from the supplied clusters.\n"
        "   - Do NOT create an insight if there is insufficient evidence.\n"
        "   - Never invent or fabricate customer evidence or quotes.\n"
        "2. Scoring & Measurement Guardrails:\n"
        "   - Use the deterministic priority score (0–100) calculated by the backend scoring service.\n"
        "   - Do NOT invent, recalculate, or modify the deterministic priority score.\n"
        "   - Do NOT invent customer impact or business impact — ground both in observed feedback frequency and sentiment.\n"
        "   - root_cause status MUST be designated as 'hypothesis' with explicit confidence (unless verified by production telemetry).\n"
        "3. Non-Execution Boundaries (PM Advisory Only):\n"
        "   - You provide strategic, advisory intelligence for Product Manager review.\n"
        "   - Do NOT create PRDs (Product Requirement Documents).\n"
        "   - Do NOT create engineering tasks or tickets.\n"
        "   - Do NOT assign developers or sprint allocations.\n"
        "   - Do NOT unilaterally change roadmap status or make final product execution decisions.\n"
        "   - Recommendations are strictly advisory and require human PM approval before implementation.",
        title="AGENT 3 SYSTEM BACKSTORY"
    )
    
    doc.add_heading("5.2 CrewAI Task Definition (Task 3)", level=2)
    doc.add_paragraph(
        "• Description: Transform structured findings and clusters from Agent 2 for dataset '{dataset_id}' in workspace "
        "'{workspace_id}' into decision-grade Product Intelligence. Fetch issue/feature clusters, apply deterministic scoring "
        "without altering scores, formulate the 10 PM decision fields, and persist advisory insights.\n"
        "• Expected Output: Validated Product Intelligence insights stored in MongoDB with the 10 PM decision fields: "
        "business_impact, feature_opportunity, product_recommendation, root_cause hypothesis, affected_feature, "
        "auditable evidence, confidence, recommended_next_steps, priority, and trend."
    )
    
    doc.add_heading("5.3 The 10 Product Intelligence Decision Fields", level=2)
    
    fields_table = doc.add_table(rows=11, cols=3)
    fields_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    fields_data = [
        ("Field Name", "Type & Sub-structure", "PM Purpose & Verification Rule"),
        ("1. business_impact", "Object: {level, impact_areas, description}", "Quantifies user retention, conversion, and churn risks grounded in frequency."),
        ("2. feature_opportunity", "Object: {identified, area, opportunity, expected_value}", "Identifies net-new product opportunities derived from explicit customer suggestions."),
        ("3. product_recommendation", "Object: {action, rationale, priority}", "High-level strategic recommendation for PM roadmap consideration (advisory only)."),
        ("4. root_cause", "Object: {status='hypothesis', description, confidence}", "Exploratory UX/system hypothesis; strictly labeled as 'hypothesis'."),
        ("5. affected_feature", "String (e.g. 'Checkout & Gateway Subsystem')", "Pinpoints the exact product submodule directly referenced in feedback."),
        ("6. evidence_record_ids", "List[str] (e.g. ['FB001', 'FB013'])", "Immutable list of raw feedback IDs supporting this finding (zero hallucinated IDs)."),
        ("7. confidence", "Float (0.0 to 1.0)", "Model-assessed synthesis confidence based on cluster volume and consistency."),
        ("8. recommended_next_steps", "List[str] (e.g. ['Run A/B test', 'Audit logs'])", "Actionable, non-engineering discovery steps recommended for PM review."),
        ("9. priority_score & level", "Integer (0-100) & Enum (low, medium, high, critical)", "Deterministic weighted score calculated by backend service; cannot be overwritten."),
        ("10. trend & severity", "Enum (rising, stable, declining) & (low, medium, high, critical)", "Directional trajectory and severity classification based on empirical metrics."),
    ]
    # Header row
    for idx, h_text in enumerate(fields_data[0]):
        fields_table.rows[0].cells[idx].paragraphs[0].text = h_text
    style_table_header(fields_table.rows[0])

    for i, (f_name, f_type, f_desc) in enumerate(fields_data[1:], start=1):
        row = fields_table.rows[i]
        c1, c2, c3 = row.cells[0], row.cells[1], row.cells[2]
        c1.width = Inches(1.8)
        c2.width = Inches(2.2)
        c3.width = Inches(2.5)
        c1.paragraphs[0].text = f_name
        c2.paragraphs[0].text = f_type
        c3.paragraphs[0].text = f_desc
        style_table_body(row, is_even=(i % 2 == 0))
        if c1.paragraphs[0].runs:
            c1.paragraphs[0].runs[0].bold = True
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    doc.add_heading("5.4 Production Prompt Template", level=2)
    add_code_block(
        doc,
        'You are a Senior Product Intelligence Strategist.\n'
        'Transform these customer feedback patterns, clusters, and trends into high-impact, '
        'decision-grade product intelligence insights for the PM Dashboard.\n\n'
        'Pattern Data:\n'
        '{\n'
        '  "issue_clusters": [...],\n'
        '  "feature_clusters": [...],\n'
        '  "trends": [...]\n'
        '}\n\n'
        'Return a strictly valid JSON object with the following schema:\n'
        '{\n'
        '  "insights": [\n'
        '    {\n'
        '      "insight_id": "PI-001",\n'
        '      "insight_type": "HIGH_PRIORITY_ISSUE" | "EMERGING_ISSUE" | "RECURRING_ISSUE" | "PRODUCT_OPPORTUNITY" | "HIGH_DEMAND_FEATURE" | "NEGATIVE_TREND" | "POSITIVE_TREND" | "CUSTOMER_EXPERIENCE_RISK",\n'
        '      "title": "Concise, actionable executive headline",\n'
        '      "summary": "Executive problem or opportunity synthesis",\n'
        '      "product_area": "Target product area (e.g., search, onboarding, checkout, ui_ux)",\n'
        '      "affected_feature": "Specific feature component name e.g. Product Search & Filter Engine",\n'
        '      "severity": "low" | "medium" | "high" | "critical",\n'
        '      "priority_level": "low" | "medium" | "high" | "critical",\n'
        '      "customer_impact": {\n'
        '        "level": "low" | "medium" | "high" | "critical",\n'
        '        "description": "Concrete user pain point or friction description"\n'
        '      },\n'
        '      "business_impact": {\n'
        '        "level": "low" | "medium" | "high" | "critical",\n'
        '        "impact_areas": ["user_retention", "task_completion", "conversion_rate"],\n'
        '        "description": "Quantified risk or opportunity to business metrics and retention"\n'
        '      },\n'
        '      "root_cause": {\n'
        '        "status": "hypothesis",\n'
        '        "description": "Underlying UX, architectural, or workflow hypothesis",\n'
        '        "confidence": 0.75\n'
        '      },\n'
        '      "feature_opportunity": {\n'
        '        "identified": true,\n'
        '        "area": "Search Usability",\n'
        '        "opportunity": "Smart autocomplete & typo-tolerant product discovery",\n'
        '        "expected_value": "Expected uplift in conversion and drop in abandoned queries"\n'
        '      },\n'
        '      "product_recommendation": {\n'
        '        "action": "Strategic PM decision recommendation",\n'
        '        "rationale": "Evidence-backed rationale justifying this action",\n'
        '        "priority": "high" | "medium" | "low"\n'
        '      },\n'
        '      "recommended_next_steps": [\n'
        '        "1. Instrument query drop-off telemetry",\n'
        '        "2. Prototype filter state persistence",\n'
        '        "3. Run A/B usability test with affected customer segment"\n'
        '      ],\n'
        '      "evidence_record_ids": ["FB001", "FB013"],\n'
        '      "recommended_action": "Strategic product recommendation for PM review"\n'
        '    }\n'
        '  ]\n'
        '}\n\n'
        'Core Operating Guardrails & Decision Boundaries:\n'
        '1. Evidence Integrity: Every insight MUST contain at least one valid customer evidence feedback ID '
        'from the supplied clusters. Never invent feedback IDs.\n'
        '2. Evidence Consistency: If frequency == 1, insight_type MUST NOT be \'RECURRING_ISSUE\'. Use \'EMERGING_ISSUE\' or \'CUSTOMER_EXPERIENCE_RISK\'.\n'
        '3. Hypothesis Labeling: root_cause status MUST be designated as \'hypothesis\' with explicit confidence score (0.0 to 1.0).\n'
        '4. Advisory Scope Only:\n'
        '   - Recommendations are advisory and require human PM approval.\n'
        '   - Recommendations must be strategic product decisions, NOT developer bug fixes or task tickets.\n'
        '   - Do NOT create PRDs, development tasks, sprint assignments, or alter roadmap status.\n'
        '5. Deterministic Alignment: Do NOT override or alter the deterministic priority score; ground all '
        'business and customer impacts strictly in the provided cluster metrics.'
    )
    
    # ── SECTION 6: COMPARATIVE SYNTHESIS MATRIX ──────────────────────────────
    h6 = doc.add_heading("6. Comparative Synthesis Matrix Across All 3 Agents", level=1)
    h6.style.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    doc.add_paragraph(
        "The following matrix summarizes the distinct roles, input contracts, models, outputs, and guardrails across the pipeline:"
    )
    
    comp_table = doc.add_table(rows=4, cols=5)
    comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    comp_data = [
        ("Agent", "Model & Provider", "Inputs Received", "Outputs Produced", "Primary Guardrail / Boundary"),
        ("Agent 1\nFeedback Analysis", "Gemini 3.5 Flash-Lite\n(Google AI)", "Single feedback record + allowed taxonomy", "10-dimension classification JSON (sentiment, intent, theme, pain_points, issues, features)", "Strict 'Do Not Infer' policy; no hallucinated features or bugs from negative sentiment."),
        ("Agent 2\nPattern & Trend", "Gemini 3.5 Flash-Lite\n(Google AI)", "Collection of validated Agent 1 analyses", "Issue clusters, feature clusters, trend metrics, theme patterns", "Semantic similarity alone != recurring bug; 1=isolated, 2=emerging, multi=recurring; preserve evidence IDs."),
        ("Agent 3\nProduct Intelligence", "Gemini 3.5 Flash-Lite\n(Google AI)", "Clusters, trends, deterministic priority scores", "Decision-grade Product Insights with 10 decision fields", "PM advisory only; no PRD/ticket creation; deterministic scores unmodifiable; mandatory evidence IDs."),
    ]
    for idx, h_text in enumerate(comp_data[0]):
        comp_table.rows[0].cells[idx].paragraphs[0].text = h_text
    style_table_header(comp_table.rows[0])
    for i, (a, m, inp, out, g) in enumerate(comp_data[1:], start=1):
        row = comp_table.rows[i]
        for idx, text in enumerate([a, m, inp, out, g]):
            row.cells[idx].paragraphs[0].text = text
        style_table_body(row, is_even=(i % 2 == 0))
        if row.cells[0].paragraphs[0].runs:
            row.cells[0].paragraphs[0].runs[0].bold = True
        
    doc.add_paragraph().paragraph_format.space_after = Pt(10)
    
    # ── SECTION 7: OPERATIONAL RESILIENCE & DATABASE SCHEMA ───────────────────
    h7 = doc.add_heading("7. Operational Resilience & Database Persistence", level=1)
    h7.style.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
    
    doc.add_paragraph(
        "1. Sequential State Machine: The pipeline transitions through discrete workflow states: "
        "UPLOADED → VALIDATED → PREPROCESSED → AI_ANALYSIS → AGENT_1_COMPLETED → AGENT_2_COMPLETED → "
        "AGENT_3_COMPLETED → INTELLIGENCE_READY → COMPLETED.\n"
        "2. Independent Stage Retry: If an individual agent encounters a transient rate limit (429) or network issue, "
        "the orchestrator supports retry_stage(job_id, stage_name) without re-executing previously completed stages.\n"
        "3. Live Workflow Synchronization: The workflow_service.sync_dataset_workflow_step method automatically syncs "
        "step status, completion metrics, and timestamps to the workspace dataset state on every stage completion.\n"
        "4. Auditability & Evidence Lineage: Every cluster and insight maintains an immutable evidence_record_ids array "
        "referencing raw customer feedback records, ensuring full provenance for executive scrutiny."
    )
    
    return doc

if __name__ == "__main__":
    doc = build_document()
    
    # Save to both target locations
    path1 = r"d:\PROJECTS\AI-driven-product\AI-driven-product\AI_Agents_Model_and_Prompts_Specification.docx"
    path2 = r"d:\PROJECTS\AI-driven-product\AI-driven-product\BACKEND\AI_Agents_Model_and_Prompts_Specification.docx"
    
    doc.save(path1)
    doc.save(path2)
    print(f"Document successfully created at:\n1. {path1}\n2. {path2}")
