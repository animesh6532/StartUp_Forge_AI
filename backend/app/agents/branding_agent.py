"""Branding Strategy Agent"""

from app.core.logger import logger
from app.core.config import settings
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import json


class BrandingAgent:
    """Agent for brand strategy, naming ideas, logos direction, color palettes, and tone"""

    def __init__(self):
        self.name = "BrandingStrategyAgent"
        self.description = "Creates brand names, color palettes, slogan ideas, and visual identity guides"
        
        if settings.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model="gpt-4-turbo",
                temperature=0.7
            )
        else:
            self.llm = None

    async def execute(self, startup_info: dict) -> dict:
        """Execute branding strategy agent"""
        logger.info(f"Executing {self.name} for startup '{startup_info.get('name')}'")
        
        name = startup_info.get("name", "Startup")
        desc = startup_info.get("description", "")
        industry = startup_info.get("industry", "Technology")
        budget = startup_info.get("budget", "Moderate")
        country = startup_info.get("country", "Global")
        target_audience = startup_info.get("target_audience", "General Public")

        research_result = startup_info.get("research_result", {})
        competitor_result = startup_info.get("competitor_result", {})
        
        customer_segments = research_result.get("customer_segments", [])
        positioning_desc = competitor_result.get("positioning_matrix", {}).get("description", "")

        if self.llm:
            try:
                branding_context = ""
                if customer_segments:
                    branding_context += f"Target Customer Segments: {', '.join(customer_segments)}.\n"
                if positioning_desc:
                    branding_context += f"Market Positioning Focus: {positioning_desc}\n"

                prompt_template = PromptTemplate.from_template(
                    "You are a stellar Brand Director and Creative Director. Build a brand architecture for:\n\n"
                    "Name: {name}\n"
                    "Description: {desc}\n"
                    "Industry: {industry}\n"
                    "Target Audience: {target_audience}\n\n"
                    "{branding_context}"
                    "Provide a JSON response with the keys:\n"
                    "1. 'brand_slogans' (list of strings, creative taglines)\n"
                    "2. 'color_palette' (list of dicts, each with 'color_name', 'hex_code', 'usage')\n"
                    "3. 'tone_of_voice' (string, e.g. authoritative, friendly, premium)\n"
                    "4. 'brand_values' (list of strings representing the core beliefs of the venture)"
                )
                prompt = prompt_template.format(
                    name=name, desc=desc, industry=industry, target_audience=target_audience,
                    branding_context=branding_context
                )
                response = await self.llm.ainvoke(prompt)
                
                try:
                    content = response.content.strip()
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    return json.loads(content)
                except Exception as parse_err:
                    logger.error(f"Error parsing LLM response for {self.name}: {parse_err}")
            except Exception as llm_err:
                logger.error(f"Error calling LLM for {self.name}: {llm_err}")
                
        # High-Fidelity Fallback
        logger.info(f"Using high-fidelity fallback generator for {self.name}")
        
        slogans = [
            f"Powering the Future of {industry}.",
            f"Autonomous {industry} at Your Fingertips.",
            f"Simpler. Smarter. Scalable."
        ]

        palette = [
            {"color_name": "Premium Charcoal", "hex_code": "#1A1A24", "usage": "Backgrounds, Dark Mode containers"},
            {"color_name": "Electric Indigo", "hex_code": "#4F46E5", "usage": "Primary brand highlights, main call-to-actions"},
            {"color_name": "Vibrant Teal", "hex_code": "#0D9488", "usage": "Accent colors, highlights, success statuses"},
            {"color_name": "Soft Frost", "hex_code": "#F3F4F6", "usage": "Typography headers, bright highlights"}
        ]

        target_desc = f"key customer segments (including {', '.join(customer_segments[:2])})" if customer_segments else target_audience
        positioning_ref = f" Supporting the positioning: '{positioning_desc}'" if positioning_desc else ""

        tone = (
            f"The brand voice is Professional yet Futuristic. It speaks with absolute authority and conviction "
            f"to {target_desc}, conveying simplicity, speed, and modern innovation, removing complex "
            f"jargon and replacing it with reassuring data-backed solutions.{positioning_ref}"
        )

        values = [
            "Autonomous Excellence - Harnessing next-generation AI to deliver flawless efficiency.",
            "Client-First Simplicity - Making complex business processes understandable and easy to control.",
            f"Inclusive Scalability - Providing enterprise-grade {industry} power to founders on any budget."
        ]

        return {
            "brand_slogans": slogans,
            "color_palette": palette,
            "tone_of_voice": tone,
            "brand_values": values
        }
