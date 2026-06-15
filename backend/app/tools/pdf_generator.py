"""PDF generator tool utilizing ReportLab"""

from app.core.logger import logger
from typing import Dict, Any
import io

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak


class PDFGenerator:
    """Tool for compiling investor-grade PDF reports from multi-agent output data"""

    def __init__(self):
        self.logger = logger

    def generate_report_pdf(self, content: Dict[str, Any], startup_name: str) -> bytes:
        """Compile and assemble structured multi-page business plan report PDF"""
        self.logger.info(f"Assembling report PDF for startup: {startup_name}")
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )
        
        styles = getSampleStyleSheet()
        
        # Define high-end custom styles
        primary_color = colors.HexColor("#4F46E5")  # Indigo
        secondary_color = colors.HexColor("#0D9488")  # Teal
        dark_neutral = colors.HexColor("#111827")  # Deep Grey/Black
        light_neutral = colors.HexColor("#F3F4F6")  # Light Grey
        
        title_style = ParagraphStyle(
            name="DocTitle",
            parent=styles["Heading1"],
            fontSize=28,
            leading=34,
            textColor=primary_color,
            spaceAfter=15
        )
        
        subtitle_style = ParagraphStyle(
            name="DocSubtitle",
            parent=styles["Normal"],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#4B5563"),
            spaceAfter=30
        )
        
        h1_style = ParagraphStyle(
            name="SectionHeading",
            parent=styles["Heading2"],
            fontSize=18,
            leading=22,
            textColor=primary_color,
            spaceBefore=15,
            spaceAfter=10,
            keepWithNext=True
        )
        
        h2_style = ParagraphStyle(
            name="SubSectionHeading",
            parent=styles["Heading3"],
            fontSize=13,
            leading=16,
            textColor=secondary_color,
            spaceBefore=10,
            spaceAfter=6,
            keepWithNext=True
        )
        
        body_style = ParagraphStyle(
            name="CustomBody",
            parent=styles["BodyText"],
            fontSize=10,
            leading=14,
            textColor=dark_neutral,
            spaceAfter=8
        )
        
        bullet_style = ParagraphStyle(
            name="CustomBullet",
            parent=styles["Normal"],
            fontSize=9.5,
            leading=13,
            textColor=dark_neutral,
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=4
        )
        
        story = []
        
        # --- TITLE PAGE ---
        story.append(Spacer(1, 100))
        story.append(Paragraph(f"{startup_name}", title_style))
        story.append(Paragraph("Autonomous Multi-Agent Venture Plan", subtitle_style))
        story.append(Spacer(1, 40))
        
        # Summary Box
        summary_text = content.get("planner", {}).get("executive_summary", "Autonomous Venture Plan compiled by StartupForge AI.")
        summary_table = Table(
            [[Paragraph(f"<b>Executive Summary:</b><br/>{summary_text}", body_style)]],
            colWidths=[500]
        )
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), light_neutral),
            ('TOPPADDING', (0,0), (-1,-1), 15),
            ('BOTTOMPADDING', (0,0), (-1,-1), 15),
            ('LEFTPADDING', (0,0), (-1,-1), 15),
            ('RIGHTPADDING', (0,0), (-1,-1), 15),
            ('LINELEFT', (0,0), (0,-1), 4, primary_color),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E5E7EB")),
        ]))
        story.append(summary_table)
        story.append(PageBreak())
        
        # --- SECTION 1: VALUE & MODEL ---
        story.append(Paragraph("1. Core Business Strategy", h1_style))
        story.append(Spacer(1, 5))
        
        story.append(Paragraph("Value Proposition", h2_style))
        val_prop = content.get("planner", {}).get("value_proposition", "No value proposition defined.")
        story.append(Paragraph(val_prop, body_style))
        
        story.append(Paragraph("Business Model", h2_style))
        biz_model = content.get("planner", {}).get("business_model", "No business model defined.")
        story.append(Paragraph(biz_model, body_style))
        
        story.append(Paragraph("SWOT Analysis", h2_style))
        swot = content.get("planner", {}).get("swot", {})
        
        # Build clean SWOT lists
        for key in ["strengths", "weaknesses", "opportunities", "threats"]:
            story.append(Paragraph(f"<b>{key.capitalize()}:</b>", body_style))
            items = swot.get(key, [])
            for item in items:
                story.append(Paragraph(f"• {item}", bullet_style))
            story.append(Spacer(1, 5))
            
        story.append(PageBreak())
        
        # --- SECTION 2: MARKET RESEARCH ---
        story.append(Paragraph("2. Market Research & Competitors", h1_style))
        story.append(Spacer(1, 5))
        
        market = content.get("market", {})
        story.append(Paragraph("Market Projections", h2_style))
        story.append(Paragraph(market.get("growth_rate", ""), body_style))
        
        tam_sam_som = market.get("tam_sam_som", {})
        story.append(Paragraph(f"<b>TAM (Total Addressable Market):</b> {tam_sam_som.get('tam', '')}", body_style))
        story.append(Paragraph(f"<b>SAM (Serviceable Addressable Market):</b> {tam_sam_som.get('sam', '')}", body_style))
        story.append(Paragraph(f"<b>SOM (Serviceable Obtainable Market):</b> {tam_sam_som.get('som', '')}", body_style))
        
        story.append(Paragraph("Customer Pain Points", h2_style))
        for point in market.get("customer_pain_points", []):
            story.append(Paragraph(f"• {point}", bullet_style))
            
        story.append(Paragraph("Competitive Intelligence", h2_style))
        comp = content.get("competitor", {})
        story.append(Paragraph("Competitive Advantages:", body_style))
        for adv in comp.get("competitive_advantages", []):
            story.append(Paragraph(f"• {adv}", bullet_style))
            
        # Draw Competitors Table
        competitors_list = comp.get("competitors", [])
        if competitors_list:
            table_data = [["Competitor", "Market Share", "Pricing Strategy"]]
            for item in competitors_list:
                table_data.append([
                    item.get("name", ""),
                    item.get("market_share", ""),
                    item.get("pricing", "")
                ])
            comp_table = Table(table_data, colWidths=[150, 100, 250])
            comp_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), primary_color),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('BOTTOMPADDING', (0,0), (-1,0), 6),
                ('TOPPADDING', (0,0), (-1,0), 6),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_neutral]),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D1D5DB")),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 9),
            ]))
            story.append(Spacer(1, 10))
            story.append(comp_table)
            
        story.append(PageBreak())
        
        # --- SECTION 3: FINANCIALS & BILLING ---
        story.append(Paragraph("3. Financial Projections", h1_style))
        story.append(Spacer(1, 5))
        
        finance = content.get("finance", {})
        story.append(Paragraph(finance.get("break_even_point", ""), body_style))
        
        # Draw Projections Table
        rev_forecast = finance.get("revenue_forecast_3y", {})
        if rev_forecast:
            forecast_data = [
                ["Year 1 Projected Revenue", f"${rev_forecast.get('year1', 0):,}"],
                ["Year 2 Projected Revenue", f"${rev_forecast.get('year2', 0):,}"],
                ["Year 3 Projected Revenue", f"${rev_forecast.get('year3', 0):,}"]
            ]
            forecast_table = Table(forecast_data, colWidths=[250, 250])
            forecast_table.setStyle(TableStyle([
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#D1D5DB")),
                ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.white, light_neutral]),
                ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
                ('FONTSIZE', (0,0), (-1,-1), 10),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('LEFTPADDING', (0,0), (-1,-1), 10),
            ]))
            story.append(forecast_table)
            
        story.append(Paragraph("Pricing Plans", h2_style))
        pricing_plans = finance.get("pricing_model", [])
        for plan in pricing_plans:
            features_str = ", ".join(plan.get("features", []))
            story.append(Paragraph(f"<b>{plan.get('plan_name')}:</b> {plan.get('price')} / {plan.get('billing_period')}", body_style))
            story.append(Paragraph(f"<i>Features:</i> {features_str}", bullet_style))
            story.append(Spacer(1, 5))
            
        story.append(PageBreak())
        
        # --- SECTION 4: TECHNICAL ARCHITECTURE ---
        story.append(Paragraph("4. Technical Architecture & MVP Roadmap", h1_style))
        story.append(Spacer(1, 5))
        
        tech = content.get("technical", {})
        story.append(Paragraph("MVP Architecture Stack", h2_style))
        
        stack = tech.get("tech_stack", {})
        for layer, tech_item in stack.items():
            story.append(Paragraph(f"• <b>{layer.capitalize()}:</b> {tech_item}", bullet_style))
            
        story.append(Paragraph("Database & Security Summary", h2_style))
        story.append(Paragraph(tech.get("database_design_summary", ""), body_style))
        
        story.append(Paragraph("Development Roadmap Phases", h2_style))
        for step in tech.get("mvp_roadmap", []):
            story.append(Paragraph(f"• {step}", bullet_style))
            
        # Compile PDF
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
