"""Workflow execution engine wrapper"""

from app.core.logger import logger
from app.graph.startup_graph import StartupGraph


class WorkflowEngine:
    """Workflow execution engine wrapping the LangGraph Orchestrator"""

    def __init__(self):
        self.name = "WorkflowEngine"
        logger.info("Initializing WorkflowEngine")

    async def execute_workflow(self, workflow_name: str, params: dict) -> dict:
        """Execute specified workflow"""
        logger.info(f"Executing workflow: {workflow_name} with params keys: {list(params.keys())}")
        
        if workflow_name == "startup_generation":
            startup_id = params.get("startup_id")
            startup_info = params.get("startup_info", {})
            if not startup_id:
                raise ValueError("Missing 'startup_id' in workflow parameters")
                
            graph = StartupGraph()
            return await graph.execute(startup_id=startup_id, startup_info=startup_info)
        else:
            logger.warning(f"Unknown workflow name: {workflow_name}")
            return {"status": "error", "error": f"Unknown workflow name '{workflow_name}'"}
