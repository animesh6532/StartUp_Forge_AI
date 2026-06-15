"""Service integration and document export tests"""

import pytest
from app.services.export_service import ExportService


def test_export_service_pdf():
    """Test that ExportService correctly builds ReportLab PDF bytes"""
    service = ExportService()
    startup_name = "HealthFlow AI"
    
    # Standard multi-agent compiled payload mock
    content = {
        "planner": {
            "executive_summary": "Testing active compilation pipeline.",
            "value_proposition": "Custom B2B automated charting.",
            "business_model": "Value-driven subscription.",
            "swot": {
                "strengths": ["Autonomous speed"],
                "weaknesses": ["Brand scale"],
                "opportunities": ["AI adoption"],
                "threats": ["Competitor reach"]
            }
        },
        "market": {
            "growth_rate": "CAGR of 14%",
            "tam_sam_som": {
                "tam": "$1.2B spend",
                "sam": "$200M target segment",
                "som": "$10M obtainable Year 1"
            },
            "customer_pain_points": ["Manual charting is slow"]
        },
        "competitor": {
            "competitive_advantages": ["10x cost savings"],
            "competitors": [
                {"name": "Incumbent Corp", "market_share": "50%", "pricing": "Enterprise"}
            ]
        },
        "finance": {
            "break_even_point": "Projected Month 8",
            "revenue_forecast_3y": {"year1": 150000, "year2": 500000, "year3": 2000000},
            "pricing_model": [
                {"plan_name": "Starter", "price": "$29", "billing_period": "monthly", "features": ["3 user seats"]}
            ]
        },
        "technical": {
            "tech_stack": {"frontend": "Next.js", "backend": "FastAPI"},
            "database_design_summary": "PostgreSQL tables",
            "mvp_roadmap": ["Month 1: Schema", "Month 2: Graph"]
        }
    }
    
    pdf_bytes = service.export_to_pdf(content, startup_name)
    
    assert pdf_bytes is not None
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    # PDF files start with the classic magic header '%PDF'
    assert pdf_bytes.startswith(b"%PDF")


def test_export_service_pptx():
    """Test that ExportService correctly builds python-pptx presentation bytes"""
    service = ExportService()
    startup_name = "HealthFlow AI"
    
    content = {
        "pitchdeck": {
            "slides": [
                {
                    "slide_number": 1,
                    "title": "Welcome Slide",
                    "subtitle": "Overview plan.",
                    "points": ["AI multi-agents workflow."],
                    "visual_guideline": "Indigo background."
                }
            ]
        }
    }
    
    ppt_bytes = service.export_to_pptx(content, startup_name)
    
    assert ppt_bytes is not None
    assert isinstance(ppt_bytes, bytes)
    assert len(ppt_bytes) > 0
    # Widescreen PPTX (zip file) starts with zip magic header 'PK'
    assert ppt_bytes.startswith(b"PK")


def test_export_service_docx():
    """Test that ExportService correctly builds clean Word/Text doc bytes"""
    service = ExportService()
    startup_name = "HealthFlow AI"
    
    content = {
        "planner": {
            "executive_summary": "Word document compilation test.",
            "swot": {"strengths": ["Testing"]}
        },
        "market": {"tam_sam_som": {}},
        "competitor": {"competitors": []},
        "finance": {"revenue_forecast_3y": {}},
        "technical": {"tech_stack": {}}
    }
    
    doc_bytes = service.export_to_docx(content, startup_name)
    
    assert doc_bytes is not None
    assert isinstance(doc_bytes, bytes)
    assert len(doc_bytes) > 0
