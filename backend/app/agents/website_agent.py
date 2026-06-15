"""Website Architecture and Copy Agent"""

from app.core.logger import logger
from app.core.config import settings
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import json


class WebsiteAgent:
    """Agent for planning landing page structure, copywriting, and sections"""

    def __init__(self):
        self.name = "WebsiteCopywritingAgent"
        self.description = "Creates high-conversion landing page layouts, headlines, and call-to-actions"
        
        if settings.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model="gpt-4-turbo",
                temperature=0.7
            )
        else:
            self.llm = None

    async def execute(self, startup_info: dict) -> dict:
        """Execute website copywriting agent"""
        logger.info(f"Executing {self.name} for startup '{startup_info.get('name')}'")
        
        name = startup_info.get("name", "Startup")
        desc = startup_info.get("description", "")
        industry = startup_info.get("industry", "Technology")
        budget = startup_info.get("budget", "Moderate")
        country = startup_info.get("country", "Global")
        target_audience = startup_info.get("target_audience", "General Public")

        if self.llm:
            try:
                prompt_template = PromptTemplate.from_template(
                    "You are a Conversion Rate Optimization (CRO) and UX Lead. Outline landing page structure for:\n\n"
                    "Name: {name}\n"
                    "Description: {desc}\n"
                    "Industry: {industry}\n"
                    "Target Audience: {target_audience}\n\n"
                    "Provide a JSON response with the keys:\n"
                    "1. 'hero_section' (dict with 'headline', 'subheadline', 'cta_button_text')\n"
                    "2. 'page_sections' (list of dicts, each with 'title', 'content_body', 'placement_order')\n"
                    "3. 'seo_meta' (dict with 'title_tag', 'meta_description', 'keywords')"
                )
                prompt = prompt_template.format(name=name, desc=desc, industry=industry, target_audience=target_audience)
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
        
        hero = {
            "headline": f"Revolutionize Your Approach to {industry} Autonomous Automation",
            "subheadline": f"Unlock maximum speed, cost savings, and 10x scale for {desc} - custom built for {target_audience} in {country}.",
            "cta_button_text": "Launch Your Portal Now"
        }

        sections = [
            {
                "title": "The Core Struggle We Resolve",
                "content_body": f"Managing complex manual workflows in {industry} takes weeks and costs thousands. "
                                f"With {name}, we automate the entire lifecycle, giving you back valuable time and cutting cost structures.",
                "placement_order": 1
            },
            {
                "title": "Features that Empowers You",
                "content_body": "Enjoy a gorgeous, investor-ready dark mode dashboard, complete API accessibility, "
                                "real-time multi-agent execution status checks, and instant secure PDF/PPTX report exports.",
                "placement_order": 2
            },
            {
                "title": "Real-time Verification Analytics",
                "content_body": "Track your credits and analytical metrics with absolute clarity, backed by robust encryption "
                                "and top-tier security standards.",
                "placement_order": 3
            }
        ]

        seo = {
            "title_tag": f"{name} - Autonomous {industry} Studio",
            "meta_description": f"Automated venture tools for {desc} targeting {target_audience} in {country}. Join today.",
            "keywords": [name, industry, "Automation", country, "Autonomous Studio"]
        }

        return {
            "hero_section": hero,
            "page_sections": sections,
            "seo_meta": seo
        }
