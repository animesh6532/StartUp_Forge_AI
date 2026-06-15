"""GTM Strategy Agent"""

from app.core.logger import logger
from app.core.config import settings
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import json

class GTMStrategyAgent:
    """Agent for constructing Go-To-Market (GTM) strategies and marketing channels"""

    def __init__(self):
        self.name = "GTMStrategyAgent"
        self.description = "Generates go-to-market channels, customer acquisition timelines, and marketing actions"
        
        if settings.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model="gpt-4-turbo",
                temperature=0.7
            )
        else:
            self.llm = None

    async def execute(self, startup_info: dict) -> dict:
        """Execute GTM agent"""
        logger.info(f"Executing {self.name} for startup '{startup_info.get('name')}'")
        
        name = startup_info.get("name", "Startup")
        desc = startup_info.get("description", "")
        industry = startup_info.get("industry", "Technology")
        country = startup_info.get("country", "Global")
        target_audience = startup_info.get("target_audience", "General Public")

        if self.llm:
            try:
                prompt_template = PromptTemplate.from_template(
                    "You are a master Go-To-Market Growth Marketer. Formulate a launch strategy for this startup:\n\n"
                    "Name: {name}\n"
                    "Description: {desc}\n"
                    "Industry: {industry}\n"
                    "Country: {country}\n"
                    "Target Audience: {target_audience}\n\n"
                    "Provide a JSON response with the keys:\n"
                    "1. 'primary_channels' (list of strings outlining top channels to reach customers)\n"
                    "2. 'acquisition_timeline' (dict with keys 'month1_3', 'month4_6', 'month7_12' describing actions)\n"
                    "3. 'launch_tactics' (list of strings detailing product launch events, communities, or PR moves)"
                )
                prompt = prompt_template.format(
                    name=name, desc=desc, industry=industry, country=country, target_audience=target_audience
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
        
        channels = [
            f"Organic SEO optimization focusing on hyper-niche {industry} search keywords in {country}.",
            f"Direct cold email outreach and LinkedIn networking targeting {target_audience}.",
            f"Highly targeted Google Search and LinkedIn B2B paid advertising campaigns."
        ]
        
        timeline = {
            "month1_3": "Validate core messaging, establish Landing Page, set up early email waitlist, and list MVP on ProductHunt.",
            "month4_6": "Initiate B2B direct sales pipeline, run hyper-focused search ad campaigns, and host a community webinar.",
            "month7_12": "Expand marketing channels to podcasts, content marketing syndicates, and launch a referral rewards scheme."
        }
        
        tactics = [
            f"Launch on Product Hunt and coordinate beta tests with active directories of {target_audience}.",
            f"Deliver hyper-specific case studies showing 10x workflow efficiency inside the {industry} sector.",
            "Publish comparative teardowns against traditional, legacy market alternatives."
        ]

        return {
            "primary_channels": channels,
            "acquisition_timeline": timeline,
            "launch_tactics": tactics
        }
