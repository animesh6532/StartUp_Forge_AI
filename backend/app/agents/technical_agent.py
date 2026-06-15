"""Technical Architecture Agent"""

from app.core.logger import logger
from app.core.config import settings
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import json


class TechnicalAgent:
    """Agent for technical architectures, tech stacks, API designs, and infrastructure layouts"""

    def __init__(self):
        self.name = "TechnicalArchitectureAgent"
        self.description = "Designs tech stacks, system topologies, database structures, and scale roadmaps"
        
        if settings.OPENAI_API_KEY:
            self.llm = ChatOpenAI(
                openai_api_key=settings.OPENAI_API_KEY,
                model="gpt-4-turbo",
                temperature=0.7
            )
        else:
            self.llm = None

    async def execute(self, startup_info: dict) -> dict:
        """Execute technical architecture agent"""
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
                    "You are a stellar CTO and Principal AI System Architect. Design the backend system architecture for:\n\n"
                    "Name: {name}\n"
                    "Description: {desc}\n"
                    "Industry: {industry}\n"
                    "Provide a JSON response with the keys:\n"
                    "1. 'tech_stack' (dict with keys 'frontend', 'backend', 'database', 'caching', 'vector_store', 'deployment')\n"
                    "2. 'system_architecture_diagram' (string, textual or Mermaid.js formatted flow chart)\n"
                    "3. 'database_design_summary' (string explaining major tables and indexes)\n"
                    "4. 'mvp_roadmap' (list of strings, Y1 phases)"
                )
                prompt = prompt_template.format(name=name, desc=desc, industry=industry)
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
        
        stack = {
            "frontend": "Next.js 15 (React 19, TypeScript, TailwindCSS, Axios)",
            "backend": "FastAPI (Python 3.12, Uvicorn, SQLAlchemy)",
            "database": "PostgreSQL 16 (Relational schemas, connection pooled)",
            "caching": "Redis (Session tokens and credit tracker caching)",
            "vector_store": "Qdrant Vector Database (Embedding storage and search)",
            "deployment": "Docker, Nginx load balancer, AWS ECS Fargate, CloudFront CDN"
        }

        mermaid = (
            "graph TD\n"
            "    User[User Browser/App] -->|HTTPS/WS| Nginx[Nginx Load Balancer]\n"
            "    Nginx -->|Route Request| Frontend[Next.js App Server]\n"
            "    Nginx -->|Route API| Backend[FastAPI API Cluster]\n"
            "    Backend -->|Read/Write Session| Cache[(Redis Cache)]\n"
            "    Backend -->|Relational Queries| RDB[(PostgreSQL Primary)]\n"
            "    Backend -->|Vector Search| VDB[(Qdrant Vector DB)]\n"
            "    Backend -->|Background Tasks| Queue[Celery/Background Workers]\n"
            "    Queue -->|State Updates| RDB"
        )

        db_design = (
            "The database design centers on a robust relational Postgres schema. Core tables include: "
            "1. 'users' with indexes on 'email'. "
            "2. 'startups' (projects) linked to 'users' via a foreign key with cascade deletion. "
            "3. 'reports' holding complete JSON payloads, indexed by 'startup_id' and 'created_at'. "
            "4. 'executions' and 'subscriptions' tracking user billing and audit trails."
        )

        roadmap = [
            "Month 1: Core Database schema and Auth API setup. Complete mock state execution tests.",
            "Month 2: LangGraph node implementation. Integrate vector semantic indexers and PDF compilers.",
            "Month 3: Dark Mode dashboard front-end rollout. Connect Axios APIs and WebSockets.",
            "Month 4: Nginx configuration, Docker packaging, and AWS multi-zone staging deployment."
        ]

        return {
            "tech_stack": stack,
            "system_architecture_diagram": mermaid,
            "database_design_summary": db_design,
            "mvp_roadmap": roadmap
        }
