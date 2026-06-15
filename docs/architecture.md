# StartupForge-AI Architecture

## System Overview

StartupForge-AI is an AI-powered platform for comprehensive startup planning and analysis. The system uses a multi-agent architecture powered by LangChain and integrates with various services for research, analysis, and document generation.

## Architecture Components

### Backend Architecture

#### 1. API Layer (`/api`)
- **startup_routes.py**: CRUD operations for startups
- **report_routes.py**: Report generation and retrieval
- **auth_routes.py**: Authentication and authorization
- **health_routes.py**: Health checks and monitoring

#### 2. Core Services (`/core`)
- **config.py**: Configuration management
- **security.py**: JWT and security utilities
- **logger.py**: Logging configuration
- **constants.py**: Application constants

#### 3. Data Models (`/models`)
- **user.py**: User entity model
- **startup.py**: Startup entity model
- **report.py**: Report entity model
- **analysis.py**: Analysis entity model

#### 4. Agent System (`/agents`)
Multi-agent architecture with specialized agents:
- **planner_agent**: Startup planning and strategy
- **market_agent**: Market research and analysis
- **competitor_agent**: Competitor analysis
- **finance_agent**: Financial projections and planning
- **branding_agent**: Brand and identity strategy
- **website_agent**: Website planning and architecture
- **pitchdeck_agent**: Pitch deck generation strategy
- **technical_agent**: Technical architecture advice
- **reviewer_agent**: Quality assurance and review

#### 5. Workflow Engine (`/graph`)
- **startup_graph.py**: Graph-based workflow orchestration
- **workflow.py**: Workflow definition and execution
- **state.py**: Workflow state management

#### 6. Services Layer (`/services`)
- **startup_service.py**: Startup business logic
- **research_service.py**: Research coordination
- **finance_service.py**: Financial calculations
- **branding_service.py**: Branding strategy
- **pitch_service.py**: Pitch generation
- **export_service.py**: Export to PDF, PPTX

#### 7. Data Integration
- **vectorstore/qdrant_manager.py**: Vector database operations
- **vectorstore/embeddings.py**: Embedding generation
- **database/database.py**: ORM setup
- **database/session.py**: Session management

#### 8. Tools Layer (`/tools`)
- **web_search.py**: Web search capabilities
- **market_scraper.py**: Market data scraping
- **competitor_scraper.py**: Competitor information
- **ppt_generator.py**: PowerPoint generation
- **pdf_generator.py**: PDF generation
- **website_generator.py**: Website template generation

### Frontend Architecture

- **app/**: Next.js application structure
- **components/**: Reusable React components
- **hooks/**: Custom React hooks
- **services/**: API service layer
- **public/**: Static assets
- **styles/**: Global and component styles

## Data Flow

```
User Request
    ↓
[API Router] → [Auth Middleware]
    ↓
[Service Layer]
    ↓
[Agent System] ← [Vector Store]
    ↓
[Tools] (Web Search, Scraping, etc.)
    ↓
[Export Service] (PDF, PPTX)
    ↓
Response → Client
```

## Technology Stack

### Backend
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL
- **Vector DB**: Qdrant
- **AI/ML**: LangChain, OpenAI, Sentence Transformers
- **Document Generation**: python-pptx, ReportLab

### Frontend
- **Framework**: React/Next.js
- **Styling**: CSS/SCSS
- **HTTP Client**: Axios/Fetch

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Web Server**: Nginx
- **Cloud**: AWS

## Key Design Patterns

1. **Multi-Agent Architecture**: Specialized agents for different aspects of startup planning
2. **Workflow Graph**: DAG-based execution for complex multi-step processes
3. **Service-Oriented Design**: Separation of concerns with dedicated services
4. **Repository Pattern**: Database abstraction layer
5. **Factory Pattern**: Dynamic agent and tool creation

## Scalability Considerations

- Async/await patterns for I/O operations
- Connection pooling for database
- Caching with vector embeddings
- Horizontal scaling with Docker
- Load balancing with Nginx
