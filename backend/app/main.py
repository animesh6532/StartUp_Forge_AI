"""FastAPI main application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.api import startup_routes, report_routes, auth_routes, health_routes, agent_routes
from app.core.logger import logger

app = FastAPI(
    title="StartupForge-AI API",
    description="AI-powered startup planning and analysis platform",
    version="0.1.0",
)

# Middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health_routes.router, prefix="/health")
app.include_router(auth_routes.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(startup_routes.router, prefix="/api/v1/startups", tags=["Startups"])
app.include_router(report_routes.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(agent_routes.router, prefix="/api/v1", tags=["Autonomous Venture Studio"])


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("Application startup")
    from app.database.database import init_db
    try:
        init_db()
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database tables: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("Application shutdown")


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "StartupForge-AI API",
        "version": "0.1.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=settings.DEBUG,
    )
