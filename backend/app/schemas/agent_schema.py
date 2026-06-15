"""Agent, workflow, cofounder, dashboard and scoring schemas"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class AgentRunRequest(BaseModel):
    """Request schema for executing a standalone agent"""

    agent_role: str = Field(..., description="planner, market, competitor, finance, branding, website, technical, pitchdeck, reviewer")
    startup_info: Dict[str, Any] = Field(..., description="Startup metadata details (name, description, industry, etc.)")


class AgentRunResponse(BaseModel):
    """Response schema for standalone agent execution"""

    agent_role: str
    status: str
    output_data: Dict[str, Any]
    execution_time: float
    token_consumption: int


class WorkflowExecuteRequest(BaseModel):
    """Request schema for executing a full multi-agent workflow"""

    startup_id: str = Field(..., description="The ID of the startup idea to analyze")


class WorkflowExecuteResponse(BaseModel):
    """Response schema for multi-agent workflow execution"""

    workflow_run_id: str
    startup_id: str
    status: str
    execution_time: float
    token_consumption: int


class WorkflowRunResponse(BaseModel):
    """Response schema representing a historical workflow run"""

    id: str
    startup_id: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    execution_time: float
    token_consumption: int
    output_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class CofounderAnalyzeRequest(BaseModel):
    """Request schema for AI Co-founder analysis endpoint"""

    description: str = Field(..., description="The startup idea details to challenge")
    name: Optional[str] = "Stealth Startup"
    industry: Optional[str] = "Technology"
    country: Optional[str] = "United States"
    budget: Optional[str] = "Moderate"
    target_audience: Optional[str] = "General Consumers"


class CofounderAnalyzeResponse(BaseModel):
    """Response schema for AI Co-founder analysis endpoint"""

    should_build: bool = Field(..., description="Direct recommendation on whether the idea is worth building")
    opportunity_score: float = Field(..., description="Venture opportunity feasibility (0-100)")
    competition_score: float = Field(..., description="Strength and density of competitors (0-100)")
    market_saturation: str = Field(..., description="Detailed saturation qualitative analysis")
    risks: List[str] = Field(..., description="Identified critical venture risks")
    advantages: List[str] = Field(..., description="Strategic competitive advantages")
    better_alternatives: List[str] = Field(..., description="Pivots or alternatives to strengthen the model")
    critique: str = Field(..., description="Direct critique challenging weak ideas")


class DashboardMetricsResponse(BaseModel):
    """Response schema for operational dashboard analytics summary"""

    total_runs: int
    success_rate: float
    avg_execution_time: float
    total_tokens: int
    failed_runs: int


class AgentExecutionResponse(BaseModel):
    """Response schema representing an individual agent run in a workflow"""

    id: str
    workflow_run_id: str
    agent_role: str
    status: str
    execution_time: float
    token_consumption: int
    logs: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class StartupScoreRequest(BaseModel):
    """Request schema to trigger evaluations scoring"""

    startup_id: str


class StartupScoreResponse(BaseModel):
    """Response schema for evaluations scoring"""

    startup_id: str
    final_score: float
    scores: Dict[str, float]
    reasoning: Dict[str, str]
    overall_summary: str
    visualization: Dict[str, Any]


class CofounderChatRequest(BaseModel):
    """Request schema for conversational cofounder chat session"""

    startup_id: Optional[str] = Field(None, description="The ID of the startup idea")
    message: str = Field(..., description="The user message to the cofounder")
    chat_history: Optional[List[Dict[str, str]]] = Field(default=[], description="Past messages in session")


class CofounderChatResponse(BaseModel):
    """Response schema for conversational cofounder chat session response"""

    response: str = Field(..., description="The contextual cofounder reply")
