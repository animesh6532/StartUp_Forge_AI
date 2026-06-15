"""Agent integration and execution tests"""

import pytest
from app.agents.planner_agent import PlannerAgent
from app.agents.market_agent import MarketAgent
from app.agents.competitor_agent import CompetitorAgent


@pytest.mark.asyncio
async def test_planner_agent():
    """Test planner agent returns correct structured strategy keys"""
    agent = PlannerAgent()
    startup_info = {
        "name": "HealthFlow AI",
        "description": "Autonomous medical charting SaaS for local practitioners",
        "industry": "Digital Health",
        "budget": "Low",
        "country": "United States",
        "target_audience": "Freelance nurses and local clinics"
    }
    
    res = await agent.execute(startup_info)
    
    assert res is not None
    assert "value_proposition" in res
    assert "swot" in res
    assert "business_model" in res
    assert "executive_summary" in res
    assert len(res["swot"]["strengths"]) > 0


@pytest.mark.asyncio
async def test_market_agent():
    """Test market agent compiles addressable size estimates"""
    agent = MarketAgent()
    startup_info = {
        "name": "AgriDrone",
        "description": "Drone imagery analytics for crop hydration levels",
        "industry": "AgTech",
        "budget": "Moderate",
        "country": "India",
        "target_audience": "Medium scale farmers and cooperatives"
    }
    
    res = await agent.execute(startup_info)
    
    assert res is not None
    assert "tam_sam_som" in res
    assert "market_trends" in res
    assert "customer_pain_points" in res
    assert "growth_rate" in res
    assert "tam" in res["tam_sam_som"]


@pytest.mark.asyncio
async def test_competitor_agent():
    """Test competitor agent builds positioning matrix and listing"""
    agent = CompetitorAgent()
    startup_info = {
        "name": "CyberLock",
        "description": "One-click encryption tunnels for remote developers",
        "industry": "Cybersecurity",
        "budget": "High",
        "country": "Global",
        "target_audience": "Freelance remote engineers"
    }
    
    res = await agent.execute(startup_info)
    
    assert res is not None
    assert "competitors" in res
    assert "competitive_advantages" in res
    assert "positioning_matrix" in res
    assert len(res["competitors"]) > 0
