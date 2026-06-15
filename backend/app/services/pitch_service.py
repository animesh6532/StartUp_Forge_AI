"""Pitch service coordinating pitch deck slides structures and caching"""

from app.core.logger import logger
from app.agents.pitchdeck_agent import PitchDeckAgent
from app.models.pitch_deck import PitchDeck
from sqlalchemy.orm import Session
from typing import Dict, Any


class PitchService:
    """Service coordinating investor-grade pitch deck configurations and storage caching"""

    def __init__(self):
        self.logger = logger
        self.agent = PitchDeckAgent()

    async def generate_pitch_deck(self, db: Session, startup_id: str, startup_info: dict) -> dict:
        """Fetch pitch deck from DB cache or generate fresh structures utilizing specialized agent"""
        self.logger.info(f"Generating pitch deck for startup: {startup_info.get('name')}")
        
        # Check cache database first
        cached_deck = db.query(PitchDeck).filter(PitchDeck.startup_id == startup_id).first()
        if cached_deck:
            self.logger.info("Returning cached investor slide deck data")
            return {"startup_id": startup_id, "slides": cached_deck.slides}

        # Fresh generation using the agent
        res = await self.agent.execute(startup_info)
        slides = res.get("slides", [])

        # Write to cache
        new_deck = PitchDeck(startup_id=startup_id, slides=slides)
        db.add(new_deck)
        db.commit()
        db.refresh(new_deck)

        return {"startup_id": startup_id, "slides": slides}

    async def generate_elevator_pitch(self, startup_info: dict) -> str:
        """Generate high-impact elevator pitch for elevator presentations"""
        self.logger.info("Generating elevator pitch")
        name = startup_info.get("name", "Venture")
        desc = startup_info.get("description", "innovative solutions")
        industry = startup_info.get("industry", "technology")
        audience = startup_info.get("target_audience", "customers")
        
        pitch = (
            f"Did you know that most {audience} waste hours dealing with legacy issues in the {industry} space? "
            f"At {name}, we are changing that by introducing a state-of-the-art automated platform that coordinates {desc}. "
            f"By leveraging advanced multi-agent algorithms, we allow users to execute processes 10x faster and at a fraction of the cost, "
            f"disrupting a multi-billion dollar market."
        )
        return pitch

    async def create_investor_summary(self, startup_info: dict) -> str:
        """Create compelling venture executive summaries for angel investor outreach"""
        self.logger.info("Creating investor summary")
        name = startup_info.get("name", "Venture")
        desc = startup_info.get("description", "innovative solutions")
        industry = startup_info.get("industry", "technology")
        budget = startup_info.get("budget", "Moderate")
        country = startup_info.get("country", "Global")
        
        summary = (
            f"Venture Overview: {name} is a high-growth startup positioned to disrupt the {industry} sector in {country}. "
            f"The company's core technology automates {desc}, offering a high-efficiency alternative to high-overhead service providers. "
            f"With a lean cost structure optimized for {budget} budgets, {name} targets strong recurring revenue streams "
            f"with a projected Month 8 break-even and rapid expansion potential."
        )
        return summary
