"""Startup Validator Agent"""

from app.core.logger import logger
from app.core.config import settings
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import json

class ValidatorAgent:
    """Agent for validating startup concept feasibility and structural parameters"""

    def __init__(self):
        self.name = "ValidatorAgent"
        self.description = "Validates startup viability, parameters alignment, and structural completeness"
        
        if settings.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model="gpt-4-turbo",
                temperature=0.7
            )
        else:
            self.llm = None

    async def execute(self, startup_info: dict) -> dict:
        """Execute validator agent"""
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
                    "You are a critical Startup Incubator Director. Validate this startup concept:\n\n"
                    "Name: {name}\n"
                    "Description: {desc}\n"
                    "Industry: {industry}\n"
                    "Budget: {budget}\n"
                    "Country: {country}\n"
                    "Target Audience: {target_audience}\n\n"
                    "Provide a JSON response with the keys:\n"
                    "1. 'is_viable' (boolean, be strict!)\n"
                    "2. 'viability_score' (float, 0-100)\n"
                    "3. 'critical_flaws' (list of strings outlining immediate structural threats)\n"
                    "4. 'suggested_pivots' (list of strings proposing better alternatives)"
                )
                prompt = prompt_template.format(
                    name=name, desc=desc, industry=industry, budget=budget, country=country, target_audience=target_audience
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
        
        # Naive validator rules matching co-founder critique
        weak_keywords = ["coffee shop", "drop shipping", " Uber for ", "delivery app", "laundry", "ecommerce store"]
        is_weak = any(kw in desc.lower() for kw in weak_keywords) or len(desc) < 40
        
        if is_weak:
            is_viable = False
            score = 35.0
            flaws = [
                "Extremely low barriers to entry; easily replicated overnight.",
                "High customer acquisition cost (CAC) relative to lifetime value (LTV).",
                "High reliance on thin-margin logistics or saturated physical channels."
            ]
            pivots = [
                f"Shift from running the operations directly to building a specialized vertical SaaS for the {industry} sector.",
                "Create a high-margin white-label software API instead of a consumer-facing service."
            ]
        else:
            is_viable = True
            score = 80.0
            flaws = [
                "Long sales cycle when selling B2B to target segments.",
                "Potential integration friction with existing database backends."
            ]
            pivots = [
                "Launch a lightweight developer API first to validate onboarding speed.",
                "Bundle core features as a browser extension MVP to bypass complex integrations."
            ]

        return {
            "is_viable": is_viable,
            "viability_score": score,
            "critical_flaws": flaws,
            "suggested_pivots": pivots
        }
