"""Export service coordinating PDF, PPTX, and DOCX generators"""

from app.core.logger import logger
from app.tools.pdf_generator import PDFGenerator
from app.tools.ppt_generator import PPTGenerator
from typing import Dict, Any
import io


class ExportService:
    """Service layer that delegates document building to specific format tools"""

    def __init__(self):
        self.logger = logger
        self.pdf_generator = PDFGenerator()
        self.ppt_generator = PPTGenerator()

    def export_to_pdf(self, content: dict, startup_name: str) -> bytes:
        """Coordinate PDF compilation"""
        self.logger.info(f"ExportService: Triggering PDF compilation for: {startup_name}")
        return self.pdf_generator.generate_report_pdf(content, startup_name)

    def export_to_pptx(self, content: dict, startup_name: str) -> bytes:
        """Coordinate PPTX compilation"""
        self.logger.info(f"ExportService: Triggering PPTX compilation for: {startup_name}")
        return self.ppt_generator.generate_pitch_deck(content, startup_name)

    def export_to_docx(self, content: dict, startup_name: str) -> bytes:
        """Coordinate DOCX compilation (generates clean Word-compatible RTF/Text business layout)"""
        self.logger.info(f"ExportService: Triggering DOCX compilation for: {startup_name}")
        
        # Assemble highly structured, tabbed text that import seamlessly as a clean document
        doc_stream = io.StringIO()
        doc_stream.write(f"====================================================\n")
        doc_stream.write(f"        {startup_name.upper()} BUSINESS PLAN\n")
        doc_stream.write(f"====================================================\n\n")
        
        doc_stream.write(f"EXECUTIVE SUMMARY:\n")
        doc_stream.write(f"{content.get('planner', {}).get('executive_summary', 'No summary defined.')}\n\n")
        
        doc_stream.write(f"VALUE PROPOSITION:\n")
        doc_stream.write(f"{content.get('planner', {}).get('value_proposition', '')}\n\n")
        
        doc_stream.write(f"BUSINESS MODEL:\n")
        doc_stream.write(f"{content.get('planner', {}).get('business_model', '')}\n\n")
        
        doc_stream.write(f"SWOT ANALYSIS:\n")
        swot = content.get("planner", {}).get("swot", {})
        for key in ["strengths", "weaknesses", "opportunities", "threats"]:
            doc_stream.write(f"  {key.capitalize()}:\n")
            for item in swot.get(key, []):
                doc_stream.write(f"    - {item}\n")
        doc_stream.write(f"\n")
        
        doc_stream.write(f"MARKET PROJECTIONS & SIZE:\n")
        market = content.get("market", {})
        doc_stream.write(f"  Growth Projected: {market.get('growth_rate', '')}\n")
        tam = market.get("tam_sam_som", {})
        doc_stream.write(f"  TAM: {tam.get('tam', '')}\n")
        doc_stream.write(f"  SAM: {tam.get('sam', '')}\n")
        doc_stream.write(f"  SOM: {tam.get('som', '')}\n\n")
        
        doc_stream.write(f"COMPETITIVE ANALYSIS:\n")
        comp = content.get("competitor", {})
        for item in comp.get("competitors", []):
            doc_stream.write(f"  Competitor: {item.get('name')} (Market Share: {item.get('market_share')})\n")
            doc_stream.write(f"    Pricing Strategy: {item.get('pricing')}\n")
            doc_stream.write(f"    Strengths: {item.get('strengths')}\n")
            doc_stream.write(f"    Weaknesses: {item.get('weaknesses')}\n\n")
            
        doc_stream.write(f"FINANCIAL FORECAST & PLANS:\n")
        finance = content.get("finance", {})
        rev = finance.get("revenue_forecast_3y", {})
        doc_stream.write(f"  Projected Year 1 Revenue: ${rev.get('year1', 0):,}\n")
        doc_stream.write(f"  Projected Year 2 Revenue: ${rev.get('year2', 0):,}\n")
        doc_stream.write(f"  Projected Year 3 Revenue: ${rev.get('year3', 0):,}\n")
        doc_stream.write(f"  Break-even forecast: {finance.get('break_even_point')}\n\n")
        
        doc_stream.write(f"TECHNICAL MVP ROADMAP Stack:\n")
        tech = content.get("technical", {})
        for layer, tech_item in tech.get("tech_stack", {}).items():
            doc_stream.write(f"  - {layer.capitalize()}: {tech_item}\n")
        doc_stream.write(f"\n")
        
        doc_stream.write(f"Compiled on StartupForge AI - Autonomous Venture Studio.\n")
        
        file_bytes = doc_stream.getvalue().encode("utf-8")
        doc_stream.close()
        
        return file_bytes
