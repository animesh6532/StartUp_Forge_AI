"""Agent and workflow operations API routes"""

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.startup import Startup
from app.models.workflow_run import WorkflowRun
from app.models.agent_execution import AgentExecution
from app.models.report import Report
from app.models.activity_log import ActivityLog
from app.models.startup_score import StartupScore
from app.core.logger import logger
from app.services.memory_service import MemoryService
from app.services.scoring_engine import StartupScoringEngine
from app.graph.startup_graph import StartupGraph
from app.schemas.agent_schema import (
    AgentRunRequest, AgentRunResponse,
    WorkflowExecuteRequest, WorkflowExecuteResponse, WorkflowRunResponse,
    CofounderAnalyzeRequest, CofounderAnalyzeResponse,
    CofounderChatRequest, CofounderChatResponse,
    DashboardMetricsResponse, AgentExecutionResponse,
    StartupScoreRequest, StartupScoreResponse
)

# Import individual agents
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

import time
from datetime import datetime
from typing import List, Optional
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import json

router = APIRouter()


@router.post("/agents/run", response_model=AgentRunResponse, tags=["Agents"])
async def run_standalone_agent(
    req: AgentRunRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Execute a single specialized agent standalone (forces telemetry logging)"""
    role = req.agent_role.lower().strip()
    startup_info = req.startup_info
    
    # 1. Map agent role to correct agent instance
    agent_map = {
        "validator": ValidatorAgent,
        "planner": PlannerAgent,
        "market": MarketAgent,
        "competitor": CompetitorAgent,
        "finance": FinanceAgent,
        "branding": BrandingAgent,
        "gtm": GTMStrategyAgent,
        "website": WebsiteAgent,
        "technical": TechnicalAgent,
        "pitchdeck": PitchDeckAgent,
        "investor": InvestorReadinessAgent,
        "reviewer": ReviewerAgent
    }
    
    if role not in agent_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown agent role '{role}'. Supported roles: {list(agent_map.keys())}"
        )
        
    # Helper to calculate single node estimates
    start_time = time.time()
    
    # Satisfying the foreign key requirement by creating a single-agent workflow_run log
    temp_run = WorkflowRun(
        startup_id=startup_info.get("id") or db.query(Startup).first().id if db.query(Startup).first() else "dummy",
        status="completed",
        input_data=startup_info
    )
    db.add(temp_run)
    db.commit()
    db.refresh(temp_run)
    
    agent_exec = AgentExecution(
        workflow_run_id=temp_run.id,
        agent_role=role,
        status="running",
        logs=f"Standalone execution of {role} agent.",
        input_data=startup_info
    )
    db.add(agent_exec)
    db.commit()
    db.refresh(agent_exec)
    
    agent_inst = agent_map[role]()
    try:
        if role == "reviewer":
            # Reviewer expects all previous sections, mock them for standalone run if not provided
            all_inputs = startup_info.get("all_results", {
                "validator": {}, "planner": {}, "market": {}, "competitor": {},
                "finance": {}, "branding": {}, "gtm": {}, "website": {},
                "technical": {}, "pitchdeck": {}, "investor": {}
            })
            output = await agent_inst.execute(all_inputs, startup_info)
        else:
            output = await agent_inst.execute(startup_info)
            
        elapsed = time.time() - start_time
        in_len = len(str(startup_info))
        out_len = len(str(output))
        tokens = (in_len // 4) + (out_len // 4)
        
        agent_exec.status = "completed"
        agent_exec.output_data = output
        agent_exec.execution_time = elapsed
        agent_exec.token_consumption = tokens
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        return AgentRunResponse(
            agent_role=role,
            status="completed",
            output_data=output,
            execution_time=elapsed,
            token_consumption=tokens
        )
        
    except Exception as err:
        elapsed = time.time() - start_time
        agent_exec.status = "failed"
        agent_exec.logs = f"Error: {str(err)}"
        agent_exec.execution_time = elapsed
        agent_exec.completed_at = datetime.utcnow()
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Standalone agent execution failed: {str(err)}"
        )


async def run_workflow_bg(s_id: str, s_info: dict, r_run_id: str, r_id: str):
    """Helper background task to invoke graph execution"""
    graph = StartupGraph()
    await graph.execute(startup_id=s_id, startup_info=s_info, workflow_run_id=r_run_id, report_id=r_id)


@router.post("/workflows/execute", response_model=WorkflowExecuteResponse, tags=["Workflows"])
async def execute_workflow(
    req: WorkflowExecuteRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Trigger complete LangGraph orchestration pipeline for a startup concept"""
    startup = db.query(Startup).filter(Startup.id == req.startup_id).first()
    if not startup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup with ID '{req.startup_id}' not found"
        )
        
    if startup.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to this startup concept"
        )
        
    startup_info = {
        "name": startup.name,
        "description": startup.description,
        "industry": startup.industry,
        "budget": startup.budget,
        "country": startup.country,
        "target_audience": startup.target_audience
    }
    
    # 1. Create a WorkflowRun record with status "running"
    run_record = WorkflowRun(
        startup_id=startup.id,
        status="running",
        input_data=startup_info
    )
    db.add(run_record)
    
    # 2. Find or create a processing Report record
    report = db.query(Report).filter(Report.startup_id == startup.id).order_by(Report.created_at.desc()).first()
    if not report or report.status == "completed":
        report = Report(
            startup_id=startup.id,
            report_type="complete_plan",
            status="processing"
        )
        db.add(report)
    else:
        report.status = "processing"
        
    # Mark startup as processing
    startup.status = "processing"
    db.commit()
    db.refresh(run_record)
    db.refresh(report)
    
    # 3. Schedule execution in background
    background_tasks.add_task(run_workflow_bg, startup.id, startup_info, run_record.id, report.id)
    
    return WorkflowExecuteResponse(
        workflow_run_id=run_record.id,
        startup_id=startup.id,
        status="running",
        execution_time=0.0,
        token_consumption=0
    )


@router.get("/workflows/history", response_model=List[WorkflowRunResponse], tags=["Workflows"])
async def get_workflow_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve history logs of past multi-agent workflow executions"""
    query = db.query(WorkflowRun).join(Startup)
    if current_user.role != "admin":
        query = query.filter(Startup.user_id == current_user.id)
        
    history = query.order_by(WorkflowRun.created_at.desc()).all()
    return history


@router.post("/cofounder/analyze", response_model=CofounderAnalyzeResponse, tags=["AI Co-Founder"])
async def analyze_idea_cofounder(
    req: CofounderAnalyzeRequest,
    current_user: User = Depends(get_current_active_user)
):
    """AI Co-Founder Mode: Evaluates, highlights risks, and challenges weak startup concepts"""
    desc = req.description.lower().strip()
    
    from app.core.config import settings
    scores_dict = None
    
    if settings.OPENAI_API_KEY:
        try:
            llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model="gpt-4-turbo",
                temperature=0.7
            )
            prompt_template = PromptTemplate.from_template(
                "You are an critical, realistic AI Co-Founder and veteran Startup CTO. Evaluate this startup idea:\n"
                "Idea: {desc}\n"
                "Industry: {industry}\n"
                "Country: {country}\n\n"
                "Your role is to challenge the user's idea, pointing out hard-hitting risks, "
                "defensive moats, scalability flaws, and market saturations. Challenge weak ideas instead of agreeing with everything!\n\n"
                "Provide a JSON response with the keys:\n"
                "1. 'should_build' (boolean, be highly selective! Only True for truly unique, robust concepts)\n"
                "2. 'opportunity_score' (float, 0-100)\n"
                "3. 'competition_score' (float, 0-100 representing competitors strength and saturation level)\n"
                "4. 'market_saturation' (string assessment)\n"
                "5. 'risks' (list of strings detail critical failure threats)\n"
                "6. 'advantages' (list of strings outlining defensive advantages)\n"
                "7. 'better_alternatives' (list of strings suggesting robust pivots or alternative approaches)\n"
                "8. 'critique' (string, direct critique challenging the business model, marketing channels, and capital demands)"
            )
            prompt = prompt_template.format(desc=req.description, industry=req.industry, country=req.country)
            response = await llm.ainvoke(prompt)
            
            content = response.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            scores_dict = json.loads(content)
        except Exception as e:
            logger.error(f"Error calling LLM for Co-founder analyze: {e}")

    # Fallback/Rule-Based Engine (Forces challenging weak ideas)
    if not scores_dict:
        # Check if the idea looks like a weak/saturated concept
        weak_keywords = ["coffee shop", "drop shipping", " Uber for ", "delivery app", "laundry", "ecommerce store", "restaurant", "clothing brand"]
        is_weak = any(kw in desc for kw in weak_keywords) or len(desc) < 40
        
        if is_weak:
            should_build = False
            opp_score = 38.5
            comp_score = 92.0
            saturation = "Extreme Saturation. Highly commoditized red-ocean space with minimal margins."
            risks = [
                "No defensibility or software moat; easy to copy by anyone overnight.",
                "Customer acquisition costs (CAC) will likely exceed Customer Lifetime Value (LTV).",
                "High platform dependencies (Shopify, App Store, Google SEO updates) or high local physical operational overhead."
            ]
            advantages = [
                "Familiar business model requiring low early customer education."
            ]
            better_alternatives = [
                "AI-driven predictive demand modeling software for existing local retail chains.",
                "B2B software-as-a-service (SaaS) simplifying inventory logistics for global drop-shippers, rather than running drop-shipping yourself.",
                "Automated white-label checkout APIs optimizing conversion speeds for niche local shops."
            ]
            critique = (
                "Honestly, this is a highly saturated model that will burn capital quickly. "
                "Starting a generic service or physical retail business faces brutal cost structures, "
                "while an 'Uber for X' app faces massive market coordination challenges and low repeat usage rates. "
                "You should pivot towards high-margin B2B SaaS software or developer tools in this vertical."
            )
        else:
            # More interesting / complex ideas
            should_build = True
            opp_score = 78.5
            comp_score = 42.0
            saturation = "Moderate Saturation. Emerging segment with a few early vertical SaaS players."
            risks = [
                "High capital expenditure (CapEx) or intense initial engineering R&D lifecycle.",
                "Long sales cycles targeting conservative B2B enterprise client buyers.",
                "Potential integration bottlenecks with legacy hardware databases."
            ]
            advantages = [
                "Highly defensive operational model with a strong proprietary database moat.",
                "Sticky customer onboarding process resulting in high retention rates."
            ]
            better_alternatives = [
                "Establish a developer API endpoint strategy first to seed early adoption.",
                "Launch a lightweight browser extension companion tool to validate user adoption before building robust backend integrations."
            ]
            critique = (
                "The core technology concept is solid and target customer segments show buying signals. "
                "However, you are underestimating the integration frictions of enterprise clients. "
                "Instead of building a massive end-to-end platform, launch a highly targeted MVP "
                "solving a single specific database mapping issue first, then cross-sell other dashboard nodes."
            )
            
        scores_dict = {
            "should_build": should_build,
            "opportunity_score": opp_score,
            "competition_score": comp_score,
            "market_saturation": saturation,
            "risks": risks,
            "advantages": advantages,
            "better_alternatives": better_alternatives,
            "critique": critique
        }
        
    return CofounderAnalyzeResponse(**scores_dict)


@router.post("/cofounder/chat", response_model=CofounderChatResponse, tags=["AI Co-Founder"])
async def chat_with_cofounder(
    req: CofounderChatRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """AI Co-Founder Chat: Conversation with a virtual partner using context from generated reports."""
    
    # 1. Fetch recent activity logs to answer "What tasks did I do recently?"
    recent_activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(5).all()
    activity_context = "\n".join([f"- {act.created_at.strftime('%Y-%m-%d %H:%M')}: {act.description} ({act.action})" for act in recent_activities])
    if not activity_context:
        activity_context = "No recent actions recorded."

    startup = None
    report_context = ""
    score_context = ""
    execution_context = ""
    
    # Check if a startup_id was provided
    s_id = req.startup_id
    if s_id and s_id.strip() and s_id.lower() != "null" and s_id.lower() != "undefined" and s_id.lower() != "dummy":
        startup = db.query(Startup).filter(Startup.id == s_id).first()
        if startup:
            # Check permissions
            if str(startup.user_id) != str(current_user.id) and current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Unauthorized access to this startup")
                
            # Get latest completed report
            report = db.query(Report).filter(
                Report.startup_id == startup.id,
                Report.status == "completed"
            ).order_by(Report.created_at.desc()).first()
            
            if report and report.report_data:
                data = report.report_data
                report_context = (
                    f"Here is what our startup planning agents have generated:\n"
                    f"- Executive Summary: {data.get('planner', {}).get('executive_summary', 'Pending')}\n"
                    f"- Value Proposition: {data.get('planner', {}).get('value_proposition', 'Pending')}\n"
                    f"- TAM: {data.get('market', {}).get('tam', 'Pending') or data.get('market', {}).get('tam_sam_som', {}).get('tam', 'Pending')}\n"
                    f"- SAM: {data.get('market', {}).get('sam', 'Pending') or data.get('market', {}).get('tam_sam_som', {}).get('sam', 'Pending')}\n"
                    f"- SOM: {data.get('market', {}).get('som', 'Pending') or data.get('market', {}).get('tam_sam_som', {}).get('som', 'Pending')}\n"
                    f"- Growth Rate: {data.get('market', {}).get('growth_rate', 'Pending')}\n"
                    f"- Key Competitors: {', '.join([c.get('name', '') for c in data.get('competitor', {}).get('competitors', [])]) or 'Pending'}\n"
                    f"- Financial Forecast (Break-even): {data.get('finance', {}).get('break_even_point', 'Pending')}\n"
                    f"- Pricing model: {json.dumps(data.get('finance', {}).get('pricing_model', []))}\n"
                    f"- Tech Stack: {json.dumps(data.get('technical', {}).get('tech_stack', {}))}\n"
                    f"- GTM Channels: {', '.join(data.get('gtm', {}).get('primary_channels', [])) or 'Pending'}\n"
                    f"- Brand Voice: {data.get('branding', {}).get('tone_of_voice', 'Pending')}\n"
                    f"- VC Thesis: {data.get('investor', {}).get('vc_investment_thesis', 'Pending')}\n"
                )
            else:
                report_context = "No completed plan reports are available yet. The founder has not run the Venture Studio pipelines."

            # Get startup score
            score = db.query(StartupScore).filter(StartupScore.startup_id == startup.id).first()
            if score:
                score_context = (
                    f"Startup Evaluation Scores:\n"
                    f"- Final Score: {score.final_score}/100\n"
                    f"- Innovation: {score.innovation_score}/100\n"
                    f"- Market Potential: {score.market_potential_score}/100\n"
                    f"- Execution Difficulty: {score.execution_difficulty_score}/100\n"
                    f"- Funding Readiness: {score.funding_readiness_score}/100\n"
                    f"- Scalability: {score.scalability_score}/100\n"
                    f"- Score details/reasoning: {json.dumps(score.reasoning)}\n"
                )
            else:
                score_context = "Venture evaluation score has not been calculated yet."

            # Fetch last run agent executions
            last_executions = db.query(AgentExecution).join(WorkflowRun).filter(
                WorkflowRun.startup_id == startup.id
            ).order_by(AgentExecution.created_at.desc()).limit(5).all()
            if last_executions:
                exec_list = []
                for ex in last_executions:
                    exec_list.append(f"Agent {ex.agent_role.upper()} ran with status '{ex.status}' at {ex.created_at.strftime('%Y-%m-%d %H:%M')} (took {ex.execution_time:.1f}s)")
                execution_context = "\n".join(exec_list)
            else:
                execution_context = "No agent workflow execution runs recorded."

    # Compose system instructions
    if startup:
        system_prompt = (
            "You are a critical, realistic AI Co-Founder and veteran Startup Advisor (not a generic ChatGPT clone). "
            "You ask hard questions, point out risks, scalability flaws, and business model threats instead of agreeing with everything.\n\n"
            f"Venture Details:\n"
            f"- Name: {startup.name}\n"
            f"- Industry: {startup.industry}\n"
            f"- Capital Budget: {startup.budget}\n"
            f"- Country: {startup.country}\n"
            f"- Target Audience: {startup.target_audience}\n"
            f"- Description: {startup.description}\n\n"
            f"Venture Score Context:\n{score_context}\n"
            f"Report Context Details:\n{report_context}\n"
            f"Venture Studio Agent Execution Logs:\n{execution_context}\n"
            f"User Recent Workspace Activities:\n{activity_context}\n\n"
            "Guidelines:\n"
            "1. Answer questions clearly based on the provided project metadata. If details like score, competitors, TAM, or budget are listed, refer to them. Never generate fake/hallucinated project data.\n"
            "2. If the user asks about recent activities, refer to 'User Recent Workspace Activities'.\n"
            "3. If the user asks about the last run agent, refer to 'Venture Studio Agent Execution Logs'.\n"
            "4. Keep answers concise, direct, helpful, and highly professional. Address the founder directly."
        )
    else:
        system_prompt = (
            "You are a critical, realistic AI Co-Founder and veteran Startup Advisor (not a generic ChatGPT clone). "
            "You welcome the user to StartupForge AI operating system. Suggest that they select or create a startup workspace from the dashboard to enable tailored venture concept strategy audits.\n\n"
            f"User Recent Workspace Activities:\n{activity_context}\n\n"
            "Guidelines:\n"
            "1. Answer general startup strategy, business model, TAM/SAM/SOM, or agent workflow questions.\n"
            "2. If the user asks about recent activities, refer to 'User Recent Workspace Activities'.\n"
            "3. Keep answers concise, professional, and invite them to open/create a startup concept workspace in the studio."
        )

    # Calling OpenAI if configured
    from app.core.config import settings
    if settings.OPENAI_API_KEY:
        try:
            llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model="gpt-4-turbo",
                temperature=0.7
            )
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            for msg in req.chat_history:
                role = "user" if msg.get("sender") == "user" else "assistant"
                messages.append({"role": role, "content": msg.get("text", "")})
            messages.append({"role": "user", "content": req.message})
            
            response = await llm.ainvoke(messages)
            return CofounderChatResponse(response=response.content.strip())
        except Exception as e:
            logger.error(f"Error calling LLM for Co-founder chat: {e}")

    # Fallback Responder: Handles key questions using actual database records
    msg_lower = req.message.lower()
    
    if not startup:
        if "recent" in msg_lower or "activity" in msg_lower or "tasks" in msg_lower or "todo" in msg_lower:
            reply = f"Looking at your workspace, here are the recent tasks you did recently:\n{activity_context}\n\nSelect a startup workspace from the dashboard to enable detailed concept strategy audits."
        else:
            reply = "Welcome to StartupForge AI! I am your AI Startup Advisor. Please open or create a startup workspace from the dashboard so that I can audit your venture score, TAM/SAM/SOM, competitor set, or technical architecture."
    else:
        if "score" in msg_lower:
            score_val = 80.0
            if score_context and "calculated" not in score_context:
                score_val = score.final_score
            reply = f"Our current startup evaluation score is **{score_val}%**. Here are the sub-scores we recorded:\n- Innovation: {score.innovation_score if score else 85.0}\n- Market Potential: {score.market_potential_score if score else 80.0}\n- Funding Readiness: {score.funding_readiness_score if score else 85.0}\n- Scalability: {score.scalability_score if score else 85.0}\n\nWe need to focus on resolving execution blockers to push this higher."
        elif "competitor" in msg_lower:
            if startup.reports and startup.reports[0].competitor_analysis:
                comp_list = startup.reports[0].competitor_analysis.get("competitors", [])
                comps_str = "\n".join([f"- **{c.get('name')}**: Pricing: {c.get('pricing')}, Share: {c.get('market_share')}" for c in comp_list])
                reply = f"We identified the following key competitors for **{startup.name}**:\n{comps_str}\n\nOur competitive advantage focuses on: {', '.join(startup.reports[0].competitor_analysis.get('competitive_advantages', []))}."
            else:
                reply = "No competitor data is available yet. Please run the Competitor Analysis agent from the Venture Studio tab."
        elif "market" in msg_lower or "insights" in msg_lower or "tam" in msg_lower:
            if startup.reports and startup.reports[0].market_research:
                mr = startup.reports[0].market_research
                tam_data = mr.get("tam_sam_som", {})
                reply = f"Here are the market research insights for **{startup.name}**:\n- **TAM**: {tam_data.get('tam', 'Pending')}\n- **SAM**: {tam_data.get('sam', 'Pending')}\n- **SOM**: {tam_data.get('som', 'Pending')}\n- **Growth Rate**: {mr.get('growth_rate', 'Pending')}\n\nKey Insights:\n" + "\n".join([f"- {ins}" for ins in mr.get("insights", [])[:3]])
            else:
                reply = "No market research details are available yet. Please trigger the Market Research agent in the studio."
        elif "budget" in msg_lower or "financial" in msg_lower:
            pricing_info = "Not configured."
            break_even = "Pending."
            if startup.reports and startup.reports[0].financial_model:
                fm = startup.reports[0].financial_model
                break_even = fm.get("break_even_point", "Pending")
                pricing_info = ", ".join([f"{p.get('plan_name')}: {p.get('price')}" for p in fm.get("pricing_model", [])])
            reply = f"For **{startup.name}**, you entered a capital budget plan of **{startup.budget}**.\n- Projected break-even point: '{break_even}'\n- Pricing tiers: {pricing_info}."
        elif "summarize" in msg_lower or "business plan" in msg_lower:
            if startup.reports and startup.reports[0].report_data:
                planner = startup.reports[0].report_data.get("planner", {})
                reply = f"Here is the business plan summary for **{startup.name}**:\n\n**Executive Summary**:\n{planner.get('executive_summary', 'Pending')}\n\n**Value Proposition**:\n{planner.get('value_proposition', 'Pending')}\n\n**Business Model**:\n{planner.get('business_model', 'Pending')}"
            else:
                reply = "No business plan summary is available yet. Please trigger the planning workflow."
        elif "pitch" in msg_lower or "pitch deck" in msg_lower or "investor" in msg_lower:
            if startup.reports and startup.reports[0].pitch_deck:
                slides = startup.reports[0].pitch_deck.get("slides", [])
                slides_str = "\n".join([f"Slide {s.get('slide_number')}: **{s.get('title')}** - {s.get('content')}" for s in slides[:4]])
                reply = f"Here is a summary of our investor pitch deck slides:\n{slides_str}\n\n(You can download the full PowerPoint PPTX file from the top export buttons)."
            else:
                reply = "No pitch deck slides have been generated yet. Please run the Pitch Deck agent in the Venture Studio."
        elif "improve" in msg_lower or "critique" in msg_lower:
            if startup.reports and startup.reports[0].report_data:
                reviewer = startup.reports[0].report_data.get("reviewer", {})
                imps = reviewer.get("suggested_improvements", [])
                reply = f"Based on the agent reviews, here is what we should improve next:\n" + "\n".join([f"- {imp}" for imp in imps]) + f"\n\nOverall Quality Assessment: {reviewer.get('qa_feedback', 'Pending')}"
            else:
                reply = "Quality critiques will be populated once we execute the full venture studio review pipeline."
        elif "recent" in msg_lower or "activity" in msg_lower or "tasks" in msg_lower:
            reply = f"Here are the recent workspace tasks you completed:\n{activity_context}"
        elif "agent" in msg_lower or "last" in msg_lower or "run" in msg_lower:
            if execution_context:
                reply = f"The last agents executed in our workspace are:\n{execution_context}"
            else:
                reply = "No agents have executed for this startup concept yet. Run workflow from the Venture Studio tab."
        else:
            reply = (
                f"As your co-founder, I'm fully aligned on building **{startup.name}** in the {startup.industry} space. "
                f"Our primary target audience is {startup.target_audience} in {startup.country}. "
                f"How should we proceed with refining our financial forecast, GTM strategy, or technical roadmap?"
            )
            
    return CofounderChatResponse(response=reply)


@router.get("/dashboard/metrics", response_model=DashboardMetricsResponse, tags=["Dashboard"])
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve operational dashboard timing and success metrics analytics"""
    runs = db.query(WorkflowRun).all()
    total = len(runs)
    
    if total == 0:
        return DashboardMetricsResponse(
            total_runs=0,
            success_rate=0.0,
            avg_execution_time=0.0,
            total_tokens=0,
            failed_runs=0
        )
        
    failed = db.query(WorkflowRun).filter(WorkflowRun.status == "failed").count()
    success = total - failed
    success_rate = round((success / total) * 100.0, 1)
    
    total_time = sum(r.execution_time or 0.0 for r in runs)
    avg_time = round(total_time / total, 1)
    
    total_tokens = sum(r.token_consumption or 0 for r in runs)
    
    return DashboardMetricsResponse(
        total_runs=total,
        success_rate=success_rate,
        avg_execution_time=avg_time,
        total_tokens=total_tokens,
        failed_runs=failed
    )


@router.get("/dashboard/executions", response_model=List[AgentExecutionResponse], tags=["Dashboard"])
async def get_dashboard_executions(
    workflow_run_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Retrieve individual agent step-by-step executions telemetry logs"""
    query = db.query(AgentExecution)
    if workflow_run_id:
        query = query.filter(AgentExecution.workflow_run_id == workflow_run_id)
    executions = query.order_by(AgentExecution.created_at.desc()).limit(100).all()
    return executions


@router.post("/startups/score", response_model=StartupScoreResponse, tags=["Startups"])
async def score_startup(
    req: StartupScoreRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Evaluate and score startup concept indices, saving score matrix inside the database"""
    # Permission verification
    startup = db.query(Startup).filter(Startup.id == req.startup_id).first()
    if not startup:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Startup concept with ID '{req.startup_id}' not found"
        )
        
    if startup.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to this startup concept"
        )
        
    scoring_engine = StartupScoringEngine()
    res = await scoring_engine.calculate_score(db, req.startup_id)
    return StartupScoreResponse(**res)
