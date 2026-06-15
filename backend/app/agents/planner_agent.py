"""Planner agent for startup strategy and planning"""

from app.core.logger import logger
from app.core.config import settings
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import json


class PlannerAgent:
    """Agent for planning startup strategy, SWOT, and business model"""

    def __init__(self):
        self.name = "PlannerAgent"
        self.description = "Plans startup strategy, SWOT, and business model"
        
        # Configure ChatOpenAI if API Key is available
        if settings.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model="gpt-4-turbo",
                temperature=0.7
            )
        else:
            self.llm = None

    async def execute(self, startup_info: dict) -> dict:
        """Execute planner agent"""
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
                    "You are a Senior Startup Strategist and CTO. Plan the business model, SWOT analysis, "
                    "and core value proposition for this startup idea.\n\n"
                    "Name: {name}\n"
                    "Description: {desc}\n"
                    "Industry: {industry}\n"
                    "Budget: {budget}\n"
                    "Country: {country}\n"
                    "Target Audience: {target_audience}\n\n"
                    "Provide a JSON response with the keys:\n"
                    "1. 'value_proposition' (string)\n"
                    "2. 'swot' (dict with keys 'strengths', 'weaknesses', 'opportunities', 'threats' as lists of strings)\n"
                    "3. 'business_model' (string outlining key activities, key partners, key resources)\n"
                    "4. 'executive_summary' (string summary of the venture)"
                )
                prompt = prompt_template.format(
                    name=name, desc=desc, industry=industry, budget=budget, country=country, target_audience=target_audience
                )
                response = await self.llm.ainvoke(prompt)
                
                # Attempt to parse json
                try:
                    content = response.content.strip()
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    return json.loads(content)
                except Exception as parse_err:
                    logger.error(f"Error parsing LLM response for {self.name}: {parse_err}")
                    # Fallback to normal text mapping if json parsing failed
                    pass
            except Exception as llm_err:
                logger.error(f"Error calling LLM for {self.name}: {llm_err}")
                
        # High-Fidelity Procedural Generator (Fallback & Default Mode)
        logger.info(f"Using high-fidelity fallback generator for {self.name}")
        
        strengths = [
            f"Strong and tailored focus on the {industry} sector's underserved segments.",
            f"Highly localized model optimized for scalability within {country}.",
            f"Low-overhead startup model aligning perfectly with the {budget} budget structure."
        ]
        weaknesses = [
            f"Early-stage brand presence requiring robust initial trust-building in {country}.",
            f"Limited operational scale at launch within the {budget} constraint.",
            f"High dependency on swift adoption by {target_audience}."
        ]
        opportunities = [
            f"Capitalizing on the rapid shift and demand trends in {industry}.",
            f"Expanding services globally beyond the initial launch market in {country}.",
            f"Leveraging AI and automated assets to deliver services at a lower cost than legacy alternatives."
        ]
        threats = [
            "Rapid replication by incumbent competitors with massive capital reserves.",
            "Changing regulatory compliance standards regarding privacy and user data.",
            f"Dynamic shift in preferences among {target_audience}."
        ]
        
        value_prop = (
            f"For {target_audience} who are frustrated by legacy options in the {industry} space, "
            f"{name} is an automated, efficient platform that delivers comprehensive {desc} "
            f"at an accessible pricing tier, optimized specifically for the constraints and opportunities in {country}."
        )
        
        business_model = (
            f"The business operates on a Value-Driven structure. Key partners include technology infrastructure "
            f"providers and specialized local data source suppliers. Key activities focus on continuous optimization "
            f"of the AI multi-agent orchestrator and marketing directly to {target_audience} via online channels. "
            f"Key resources are our unique custom agent pipelines, brand credibility, and proprietary models."
        )
        
        exec_summary = (
            f"{name} is set to disrupt the {industry} landscape in {country} by delivering a unique, "
            f"state-of-the-art solution for {desc}. By focusing specifically on {target_audience} and utilizing "
            f"advanced automated venture-building capabilities, {name} achieves unprecedented efficiency "
            f"and cost savings, maximizing return on the initial {budget} budget allocation."
        )

        return {
            "value_proposition": value_prop,
            "swot": {
                "strengths": strengths,
                "weaknesses": weaknesses,
                "opportunities": opportunities,
                "threats": threats
            },
            "business_model": business_model,
            "executive_summary": exec_summary
        }
