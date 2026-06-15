"""Startup orchestration workflow using LangGraph"""

from typing import Any

from app.core.logger import logger
from app.graph.state import WorkflowState
from langgraph.graph import StateGraph, END

# Import specialized agents
from app.agents.planner_agent import PlannerAgent
from app.agents.market_agent import MarketAgent
from app.agents.competitor_agent import CompetitorAgent
from app.agents.finance_agent import FinanceAgent
from app.agents.branding_agent import BrandingAgent
from app.agents.website_agent import WebsiteAgent
from app.agents.technical_agent import TechnicalAgent
from app.agents.pitchdeck_agent import PitchDeckAgent
from app.agents.reviewer_agent import ReviewerAgent
from app.agents.validator_agent import ValidatorAgent
from app.agents.gtm_agent import GTMStrategyAgent
from app.agents.investor_agent import InvestorReadinessAgent

import asyncio
import time
from datetime import datetime
from app.database.session import get_session
from app.models.workflow_run import WorkflowRun
from app.models.agent_execution import AgentExecution
from app.services.memory_service import MemoryService


# Helper to estimate tokens dynamically
def estimate_tokens(input_val: Any, output_val: Any) -> int:
    """Estimated token count using character lengths mapping rules"""
    in_len = len(str(input_val)) if input_val else 0
    out_len = len(str(output_val)) if output_val else 0
    return (in_len // 4) + (out_len // 4)


def build_agent_payload(state: WorkflowState, context: str) -> dict:
    """Helper to construct full payload including all upstream results for context-aware execution"""
    return {
        **state["startup_info"],
        "memory_context": context,
        "validator_result": state.get("validator_result", {}),
        "planner_result": state.get("planner_result", {}),
        "research_result": state.get("research_result", {}),
        "competitor_result": state.get("competitor_result", {}),
        "finance_result": state.get("finance_result", {}),
        "branding_result": state.get("branding_result", {}),
        "gtm_result": state.get("gtm_result", {}),
        "technical_result": state.get("technical_result", {}),
        "pitchdeck_result": state.get("pitchdeck_result", {}),
        "investor_result": state.get("investor_result", {}),
        "website_result": state.get("website_result", {})
    }


# Define Node Functions

async def validator_node(state: WorkflowState) -> dict:
    """Validator Agent execution node with telemetry and DB fallback"""
    logger.info("LangGraph Node: executing validator_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="validator",
        status="running",
        logs="Startup Validator agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = ValidatorAgent()
    try:
        res = await agent.execute(state["startup_info"])
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(state["startup_info"], res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Startup Validator agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        return {
            "validator_result": res,
            "completed_steps": ["validator"],
            "current_step": "planner"
        }
    except Exception as e:
        logger.error(f"Validator Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Validator node failure: {str(e)}"]}
    finally:
        db.close()


async def planner_node(state: WorkflowState) -> dict:
    """Planner Agent execution node with telemetry and DB fallback"""
    logger.info("LangGraph Node: executing planner_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="planner",
        status="running",
        logs="Planner agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = PlannerAgent()
    try:
        res = await agent.execute(state["startup_info"])
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(state["startup_info"], res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Planner agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        return {
            "planner_result": res,
            "completed_steps": ["planner"],
            "current_step": "research"
        }
    except Exception as e:
        logger.error(f"Planner Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Planner node failure: {str(e)}"]}
    finally:
        db.close()


async def research_node(state: WorkflowState) -> dict:
    """Market Research / Research Agent execution node with semantic memory integration and telemetry"""
    logger.info("LangGraph Node: executing research_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="research",
        status="running",
        logs="Research agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = MarketAgent()
    try:
        memory_service = MemoryService()
        context = await memory_service.get_context_injection(db, state["startup_info"])
        info_payload = build_agent_payload(state, context)
        
        res = await agent.execute(info_payload)
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(info_payload, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Research agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        # Save output to memory
        await memory_service.save_memory(
            db=db,
            content=f"Research for {state['startup_info'].get('name')}: TAM/SAM/SOM: {res.get('tam_sam_som', {})}. Growth rate: {res.get('growth_rate')}.",
            startup_id=state["startup_id"],
            meta_data={"agent": "research", "run_id": run_id}
        )
        
        return {"research_result": res, "completed_steps": ["research"], "current_step": "competitor"}
    except Exception as e:
        logger.error(f"Research Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Research node failure: {str(e)}"]}
    finally:
        db.close()


async def competitor_node(state: WorkflowState) -> dict:
    """Competitor Analysis execution node with semantic memory integration and telemetry"""
    logger.info("LangGraph Node: executing competitor_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="competitor",
        status="running",
        logs="Competitor analysis agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = CompetitorAgent()
    try:
        memory_service = MemoryService()
        context = await memory_service.get_context_injection(db, state["startup_info"])
        info_payload = build_agent_payload(state, context)
        
        res = await agent.execute(info_payload)
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(info_payload, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Competitor analysis agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        # Save output to memory
        await memory_service.save_memory(
            db=db,
            content=f"Competitive Analysis for {state['startup_info'].get('name')}: Advantages: {', '.join(res.get('competitive_advantages', []))}.",
            startup_id=state["startup_id"],
            meta_data={"agent": "competitor", "run_id": run_id}
        )
        
        return {"competitor_result": res, "completed_steps": ["competitor"], "current_step": "finance"}
    except Exception as e:
        logger.error(f"Competitor Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Competitor node failure: {str(e)}"]}
    finally:
        db.close()


async def finance_node(state: WorkflowState) -> dict:
    """Financial planning execution node with semantic memory integration and telemetry"""
    logger.info("LangGraph Node: executing finance_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="finance",
        status="running",
        logs="Finance planning agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = FinanceAgent()
    try:
        memory_service = MemoryService()
        context = await memory_service.get_context_injection(db, state["startup_info"])
        info_payload = build_agent_payload(state, context)
        
        res = await agent.execute(info_payload)
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(info_payload, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Finance planning agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        # Save output to memory
        await memory_service.save_memory(
            db=db,
            content=f"Financial forecast for {state['startup_info'].get('name')}: Break-even: {res.get('break_even_point')}. Revenue Y1-3 ARR: {res.get('revenue_forecast_3y')}.",
            startup_id=state["startup_id"],
            meta_data={"agent": "finance", "run_id": run_id}
        )
        
        return {"finance_result": res, "completed_steps": ["finance"], "current_step": "branding"}
    except Exception as e:
        logger.error(f"Finance Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Finance node failure: {str(e)}"]}
    finally:
        db.close()


async def branding_node(state: WorkflowState) -> dict:
    """Branding strategy execution node with semantic memory integration and telemetry"""
    logger.info("LangGraph Node: executing branding_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="branding",
        status="running",
        logs="Branding agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = BrandingAgent()
    try:
        memory_service = MemoryService()
        context = await memory_service.get_context_injection(db, state["startup_info"])
        info_payload = build_agent_payload(state, context)
        
        res = await agent.execute(info_payload)
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(info_payload, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Branding agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        # Save output to memory
        await memory_service.save_memory(
            db=db,
            content=f"Branding guidelines for {state['startup_info'].get('name')}: Brand voice: {res.get('tone_of_voice')}. taglines: {', '.join(res.get('brand_slogans', []))}.",
            startup_id=state["startup_id"],
            meta_data={"agent": "branding", "run_id": run_id}
        )
        
        return {"branding_result": res, "completed_steps": ["branding"], "current_step": "gtm"}
    except Exception as e:
        logger.error(f"Branding Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Branding node failure: {str(e)}"]}
    finally:
        db.close()


async def gtm_node(state: WorkflowState) -> dict:
    """GTM Strategy execution node with semantic memory integration and telemetry"""
    logger.info("LangGraph Node: executing gtm_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="gtm",
        status="running",
        logs="GTM strategy agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = GTMStrategyAgent()
    try:
        memory_service = MemoryService()
        context = await memory_service.get_context_injection(db, state["startup_info"])
        info_payload = build_agent_payload(state, context)
        
        res = await agent.execute(info_payload)
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(info_payload, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "GTM strategy agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        return {"gtm_result": res, "completed_steps": ["gtm"], "current_step": "technical"}
    except Exception as e:
        logger.error(f"GTM Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"GTM node failure: {str(e)}"]}
    finally:
        db.close()


async def website_node(state: WorkflowState) -> dict:
    """Website layout copywriting execution node with semantic memory integration and telemetry"""
    logger.info("LangGraph Node: executing website_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="website",
        status="running",
        logs="Website copywriting agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = WebsiteAgent()
    try:
        memory_service = MemoryService()
        context = await memory_service.get_context_injection(db, state["startup_info"])
        info_payload = build_agent_payload(state, context)
        
        res = await agent.execute(info_payload)
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(info_payload, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Website copywriting agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        # Save generated website to generated_websites table
        from app.models.generated_website import GeneratedWebsite
        existing_website = db.query(GeneratedWebsite).filter(GeneratedWebsite.startup_id == state["startup_id"]).first()
        if existing_website:
            existing_website.website_data = res
        else:
            new_site = GeneratedWebsite(startup_id=state["startup_id"], website_data=res)
            db.add(new_site)
        db.commit()
        
        return {"website_result": res, "completed_steps": ["website"], "current_step": "investor"}
    except Exception as e:
        logger.error(f"Website Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Website node failure: {str(e)}"]}
    finally:
        db.close()


async def technical_node(state: WorkflowState) -> dict:
    """Technical Architecture design execution node with semantic memory integration and telemetry"""
    logger.info("LangGraph Node: executing technical_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="technical",
        status="running",
        logs="Technical architecture agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = TechnicalAgent()
    try:
        memory_service = MemoryService()
        context = await memory_service.get_context_injection(db, state["startup_info"])
        info_payload = build_agent_payload(state, context)
        
        res = await agent.execute(info_payload)
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(info_payload, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Technical architecture agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        # Save output to memory
        await memory_service.save_memory(
            db=db,
            content=f"Technical architecture Stack for {state['startup_info'].get('name')}: Stack: {res.get('tech_stack')}. Roadmap: {res.get('mvp_roadmap')}.",
            startup_id=state["startup_id"],
            meta_data={"agent": "technical", "run_id": run_id}
        )
        
        return {"technical_result": res, "completed_steps": ["technical"], "current_step": "website"}
    except Exception as e:
        logger.error(f"Technical Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Technical node failure: {str(e)}"]}
    finally:
        db.close()


async def pitchdeck_node(state: WorkflowState) -> dict:
    """Pitch deck planning execution node with semantic memory integration and telemetry"""
    logger.info("LangGraph Node: executing pitchdeck_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="pitchdeck",
        status="running",
        logs="Pitch deck planner agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = PitchDeckAgent()
    try:
        memory_service = MemoryService()
        context = await memory_service.get_context_injection(db, state["startup_info"])
        info_payload = build_agent_payload(state, context)
        
        res = await agent.execute(info_payload)
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(info_payload, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Pitch deck planner agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        # Save generated deck to pitch_decks table
        from app.models.pitch_deck import PitchDeck
        existing_deck = db.query(PitchDeck).filter(PitchDeck.startup_id == state["startup_id"]).first()
        if existing_deck:
            existing_deck.slides = res.get("slides", [])
        else:
            new_deck = PitchDeck(startup_id=state["startup_id"], slides=res.get("slides", []))
            db.add(new_deck)
        db.commit()
        
        return {"pitchdeck_result": res, "completed_steps": ["pitchdeck"], "current_step": "reviewer"}
    except Exception as e:
        logger.error(f"Pitch Deck Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Pitchdeck node failure: {str(e)}"]}
    finally:
        db.close()


async def investor_node(state: WorkflowState) -> dict:
    """Investor Readiness evaluation node with telemetry and DB fallback"""
    logger.info("LangGraph Node: executing investor_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="investor",
        status="running",
        logs="Investor Readiness agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = InvestorReadinessAgent()
    try:
        inputs = build_agent_payload(state, "")
        res = await agent.execute(inputs)
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(inputs, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Investor Readiness agent completed execution."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        # Save score metrics
        from app.models.startup_score import StartupScore
        existing_score = db.query(StartupScore).filter(StartupScore.startup_id == state["startup_id"]).first()
        score_val = 80.0
        if "seed" in str(res.get("readiness_level", "")).lower():
            score_val = 85.0
        elif "pre-seed" in str(res.get("readiness_level", "")).lower():
            score_val = 70.0
            
        if existing_score:
            existing_score.final_score = score_val
            existing_score.reasoning = res
        else:
            new_score = StartupScore(
                startup_id=state["startup_id"],
                innovation_score=85.0,
                market_potential_score=80.0,
                execution_difficulty_score=75.0,
                funding_readiness_score=score_val,
                scalability_score=85.0,
                final_score=score_val,
                reasoning=res
            )
            db.add(new_score)
        db.commit()
        
        return {
            "investor_result": res,
            "completed_steps": ["investor"],
            "current_step": "pitchdeck"
        }
    except Exception as e:
        logger.error(f"Investor Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Investor node failure: {str(e)}"]}
    finally:
        db.close()


async def reviewer_node(state: WorkflowState) -> dict:
    """Quality assurance, synthesis and compilation node with telemetry"""
    logger.info("LangGraph Node: executing reviewer_node")
    db = get_session()
    start_time = time.time()
    run_id = state["workflow_run_id"]
    
    agent_exec = AgentExecution(
        workflow_run_id=run_id,
        agent_role="reviewer",
        status="running",
        logs="Reviewer/QA agent execution initiated.",
        input_data=state["startup_info"]
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent = ReviewerAgent()
    try:
        # Enrich finance result for frontend compatibility
        fin_res = dict(state.get("finance_result", {}))
        if "revenue_forecast_3y" in fin_res:
            y1 = fin_res.get("revenue_forecast_3y", {}).get("year1")
            if y1:
                fin_res["year_1_revenue"] = y1
                fin_res["revenue_year_1"] = y1

        # Aggregate all results into a single object for review
        all_results = {
            "validator": state.get("validator_result", {}),
            "planner": state.get("planner_result", {}),
            "planner_result": state.get("planner_result", {}),
            "research": state.get("research_result", {}),
            "market": state.get("research_result", {}),
            "competitor": state.get("competitor_result", {}),
            "finance": fin_res,
            "branding": state.get("branding_result", {}),
            "branding_result": state.get("branding_result", {}),
            "gtm": state.get("gtm_result", {}),
            "gtm_result": state.get("gtm_result", {}),
            "website": state.get("website_result", {}),
            "website_result": state.get("website_result", {}),
            "technical": state.get("technical_result", {}),
            "technical_result": state.get("technical_result", {}),
            "investor": state.get("investor_result", {}),
            "investor_result": state.get("investor_result", {}),
            "pitchdeck": state.get("pitchdeck_result", {}),
            "pitchdeck_result": state.get("pitchdeck_result", {})
        }
        res = await agent.execute(all_results, state["startup_info"])
        
        # Compile final compiled master plan
        final_report = {
            **all_results,
            "reviewer": res
        }
        
        elapsed = time.time() - start_time
        tokens = estimate_tokens(all_results, res)
        
        agent_exec.status = "completed"
        agent_exec.output_data = res
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.logs = "Reviewer/QA agent completed execution successfully."
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        # Save compiled overview in memory
        memory_service = MemoryService()
        await memory_service.save_memory(
            db=db,
            content=f"Final QA feedback for {state['startup_info'].get('name')}: {res.get('qa_feedback')}. Suggestions: {', '.join(res.get('suggested_improvements', []))}.",
            startup_id=state["startup_id"],
            meta_data={"agent": "reviewer", "run_id": run_id}
        )
        
        return {
            "reviewer_result": res,
            "final_report": final_report,
            "completed_steps": ["reviewer"],
            "current_step": "completed"
        }
    except Exception as e:
        logger.error(f"Reviewer Node Error: {e}")
        db.rollback()
        agent_exec.status = "failed"
        agent_exec.logs = f"Execution failed: {str(e)}"
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        return {"errors": [f"Reviewer node failure: {str(e)}"]}
    finally:
        db.close()


class StartupGraph:
    """DAG-based Startup Venture orchestration graph built with LangGraph"""

    def __init__(self):
        self.workflow = StateGraph(WorkflowState)
        
        # Add Nodes
        self.workflow.add_node("validator", validator_node)
        self.workflow.add_node("planner", planner_node)
        self.workflow.add_node("research", research_node)
        self.workflow.add_node("competitor", competitor_node)
        self.workflow.add_node("finance", finance_node)
        self.workflow.add_node("branding", branding_node)
        self.workflow.add_node("gtm", gtm_node)
        self.workflow.add_node("website", website_node)
        self.workflow.add_node("technical", technical_node)
        self.workflow.add_node("pitchdeck", pitchdeck_node)
        self.workflow.add_node("investor", investor_node)
        self.workflow.add_node("reviewer", reviewer_node)
        
        # Define DAG Connections
        self.workflow.set_entry_point("validator")
        
        self.workflow.add_edge("validator", "planner")
        self.workflow.add_edge("planner", "research")
        self.workflow.add_edge("research", "competitor")
        self.workflow.add_edge("competitor", "finance")
        self.workflow.add_edge("finance", "branding")
        self.workflow.add_edge("branding", "gtm")
        self.workflow.add_edge("gtm", "technical")
        self.workflow.add_edge("technical", "website")
        self.workflow.add_edge("website", "investor")
        self.workflow.add_edge("investor", "pitchdeck")
        self.workflow.add_edge("pitchdeck", "reviewer")
        
        # Reviewer concludes graph
        self.workflow.add_edge("reviewer", END)
        
        # Compile Graph
        self.app = self.workflow.compile()
        logger.info("LangGraph workflow compiled successfully")
 
    async def execute(self, startup_id: str, startup_info: dict, workflow_run_id: str = None, report_id: str = None) -> dict:
        """Execute startup analysis workflow and monitor live agent execution metrics in the DB"""
        logger.info(f"Triggering execution of compiled LangGraph workflow for startup: {startup_id}")
        
        db = get_session()
        
        if not workflow_run_id:
            # Create a WorkflowRun record
            run_record = WorkflowRun(
                startup_id=startup_id,
                status="running",
                input_data=startup_info
            )
            db.add(run_record)
            db.commit()
            db.refresh(run_record)
            workflow_run_id = run_record.id
        else:
            run_record = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_run_id).first()
            if run_record:
                run_record.status = "running"
                db.commit()
                
        start_time = time.time()
        
        # Initialize blank state structure
        initial_state: WorkflowState = {
            "startup_id": startup_id,
            "workflow_run_id": workflow_run_id,
            "startup_info": startup_info,
            "current_step": "validator",
            "completed_steps": [],
            "validator_result": {},
            "planner_result": {},
            "research_result": {},
            "competitor_result": {},
            "finance_result": {},
            "branding_result": {},
            "gtm_result": {},
            "website_result": {},
            "technical_result": {},
            "pitchdeck_result": {},
            "investor_result": {},
            "reviewer_result": {},
            "final_report": {},
            "errors": []
        }

        # Invoke the graph compiled app
        try:
            logger.info(f"Invoking LangGraph App for Run ID {workflow_run_id}...")
            result = await self.app.ainvoke(initial_state)
            
            # Retrieve sub-executions to compute aggregate runtime metrics
            db.refresh(run_record)
            sub_runs = db.query(AgentExecution).filter(AgentExecution.workflow_run_id == workflow_run_id).all()
            
            total_tokens = sum(r.token_consumption or 0 for r in sub_runs)
            elapsed_time = time.time() - start_time
            
            errors = result.get("errors", [])
            if errors:
                run_record.status = "failed"
            else:
                run_record.status = "completed"
                
            run_record.output_data = result.get("final_report", {})
            run_record.execution_time = elapsed_time
            run_record.token_consumption = total_tokens
            run_record.completed_at = datetime.utcnow()
            db.commit()

            # Save individual agent results to Report table columns
            from app.models.report import Report
            from app.models.startup import Startup
            
            report = None
            if report_id:
                report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                # Fallback: find latest report for this startup
                report = db.query(Report).filter(Report.startup_id == startup_id).order_by(Report.created_at.desc()).first()
            if not report:
                # Create a new report
                report = Report(
                    startup_id=startup_id,
                    report_type="complete_plan",
                    status="completed"
                )
                db.add(report)
                db.commit()
                db.refresh(report)

            startup = db.query(Startup).filter(Startup.id == startup_id).first()
            if startup:
                if errors:
                    startup.status = "failed"
                else:
                    startup.status = "completed"

            if errors:
                report.status = "failed"
                report.report_data = {"errors": errors}
            else:
                report.status = "completed"
                report.report_data = result.get("final_report", {})
                
                # Update the 9 columns explicitly
                report.market_research = result.get("research_result")
                report.competitor_analysis = result.get("competitor_result")
                report.financial_model = result.get("finance_result")
                report.branding_strategy = result.get("branding_result")
                report.gtm_plan = result.get("gtm_result")
                report.technical_architecture = result.get("technical_result")
                report.website_copy = result.get("website_result")
                report.investor_readiness = result.get("investor_result")
                report.pitch_deck = result.get("pitchdeck_result")
                
            report.completed_at = datetime.utcnow()
            db.commit()
            
            return {
                "startup_id": startup_id,
                "workflow_run_id": workflow_run_id,
                "startup_info": startup_info,
                "results": result.get("final_report", {}),
                "errors": errors
            }
            
        except Exception as graph_err:
            logger.error(f"Critical workflow graph failure: {graph_err}")
            db.rollback()
            
            elapsed_time = time.time() - start_time
            run_record.status = "failed"
            run_record.output_data = {"error": str(graph_err)}
            run_record.execution_time = elapsed_time
            run_record.completed_at = datetime.utcnow()
            db.commit()
            
            # Fail all running agent executions
            active_runs = db.query(AgentExecution).filter(
                AgentExecution.workflow_run_id == workflow_run_id,
                AgentExecution.status == "running"
            ).all()
            for ar in active_runs:
                ar.status = "failed"
                ar.logs = f"Aborted due to system graph failure: {str(graph_err)}"
                ar.completed_at = datetime.utcnow()
            db.commit()

            # Mark report and startup as failed
            from app.models.report import Report
            from app.models.startup import Startup
            report = None
            if report_id:
                report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                report = db.query(Report).filter(Report.startup_id == startup_id).order_by(Report.created_at.desc()).first()
            if report:
                report.status = "failed"
                report.report_data = {"error": str(graph_err)}
                report.completed_at = datetime.utcnow()
            startup = db.query(Startup).filter(Startup.id == startup_id).first()
            if startup:
                startup.status = "failed"
            db.commit()
            
            return {
                "startup_id": startup_id,
                "workflow_run_id": workflow_run_id,
                "startup_info": startup_info,
                "results": {},
                "errors": [f"System graph failure: {str(graph_err)}"]
            }
        finally:
            db.close()
