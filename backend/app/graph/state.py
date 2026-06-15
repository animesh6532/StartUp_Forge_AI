"""Workflow state management for LangGraph"""

from typing import Dict, Any, List, TypedDict, Annotated
import operator


def merge_errors(existing: List[str], new_val: List[str]) -> List[str]:
    """Helper to combine errors in parallel paths"""
    return existing + new_val

def merge_completed_steps(existing: List[str], new_val: List[str]) -> List[str]:
    """Helper to combine completed steps in parallel paths"""
    return list(set(existing + new_val))

class WorkflowState(TypedDict):
    """Workflow execution state passed between LangGraph nodes"""
    
    startup_id: str
    workflow_run_id: str  # Tracks operational intelligence run id
    startup_info: Dict[str, Any]  # name, description, industry, budget, country, target_audience
    
    # Executing steps trackers
    current_step: str
    completed_steps: Annotated[List[str], merge_completed_steps]
    
    # Outputs of specialized agents
    validator_result: Dict[str, Any]  # Startup Validator
    planner_result: Dict[str, Any]    # Startup Planner Strategy
    research_result: Dict[str, Any]   # Market Research / Research Agent
    competitor_result: Dict[str, Any] # Competitor Analysis
    finance_result: Dict[str, Any]    # Financial Projection
    branding_result: Dict[str, Any]   # Branding
    gtm_result: Dict[str, Any]        # GTM Strategy
    technical_result: Dict[str, Any]  # Technical Architecture
    pitchdeck_result: Dict[str, Any]  # Pitch Deck
    investor_result: Dict[str, Any]   # Investor Readiness
    website_result: Dict[str, Any]    # Landing Page Copywriting
    reviewer_result: Dict[str, Any]   # Reviewer (QA)
    
    # Combined compiled report
    final_report: Dict[str, Any]
    
    # State tracking and errors (merged in parallel nodes)
    errors: Annotated[List[str], merge_errors]
