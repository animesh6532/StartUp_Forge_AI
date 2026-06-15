"""Finance service coordinating forecasts, burn rates, runways, funding"""

from app.core.logger import logger
from app.agents.finance_agent import FinanceAgent
from typing import Dict, Any


class FinanceService:
    """Service coordinates financial projections and cash burn calculations using FinanceAgent"""

    def __init__(self):
        self.logger = logger
        self.agent = FinanceAgent()

    async def create_financial_projections(self, startup_info: dict) -> dict:
        """Generate 3-year ARR forecasts, margins, cost allocations utilizing FinanceAgent"""
        self.logger.info("Creating financial projections")
        finance_data = await self.agent.execute(startup_info)
        
        return {
            "projections": {
                "revenue_forecast_3y": finance_data.get("revenue_forecast_3y", {}),
                "cost_structure": finance_data.get("cost_structure", {}),
                "pricing_model": finance_data.get("pricing_model", []),
                "break_even_point": finance_data.get("break_even_point", "")
            }
        }

    async def calculate_runway(self, monthly_burn: float, cash_on_hand: float) -> dict:
        """Calculate startup runway in months, safety margins, and warning status thresholds"""
        self.logger.info(f"Calculating runway with burn rate: {monthly_burn}")
        if monthly_burn <= 0:
            months = 999.0
            status = "stable"
        else:
            months = round(cash_on_hand / monthly_burn, 1)
            if months < 6.0:
                status = "critical"
            elif months < 12.0:
                status = "warning"
            else:
                status = "stable"
                
        return {
            "runway_months": months,
            "cash_on_hand": cash_on_hand,
            "monthly_burn": monthly_burn,
            "status": status,
            "recommendation": "Initiate funding discussions immediately" if status == "critical" else "Monitor expenses regularly"
        }

    async def estimate_funding_needs(self, startup_info: dict) -> dict:
        """Estimate funding requirements based on budget tiers, industry CAGRs, and projections"""
        self.logger.info("Estimating funding needs")
        finance_data = await self.agent.execute(startup_info)
        budget = startup_info.get("budget", "Moderate")
        
        # Sizing and mapping rounds based on budget tiers
        if "low" in budget.lower() or "micro" in budget.lower():
            round_size = 150000
            round_name = "Pre-Seed Round"
            milestones = ["Complete MVP software beta", "Acquire first 100 paying customers"]
        elif "high" in budget.lower() or "million" in budget.lower():
            round_size = 1500000
            round_name = "Seed/Series A Round"
            milestones = ["Scale customer acquisition machinery", "Expand specialized AI engineering team"]
        else:
            round_size = 500000
            round_name = "Seed Round"
            milestones = ["Polish software architecture security", "Acquire first 500 active seat subscriptions"]

        return {
            "funding_estimate": {
                "round_type": round_name,
                "amount": round_size,
                "currency": "USD",
                "milestones_targeted": milestones,
                "break_even_projection": finance_data.get("break_even_point", "")
            }
        }
