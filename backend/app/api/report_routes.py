"""Report generation and export API routes"""

from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from app.schemas.report_schema import ReportCreate, ReportResponse
from app.models.report import Report
from app.models.startup import Startup
from app.models.user import User
from app.core.security import get_current_active_user
from app.database.database import get_async_db, SessionLocal
from app.repositories.report_repo import ReportRepository
from app.repositories.startup_repo import StartupRepository
from app.services.report_service import ReportService
from app.graph.startup_graph import StartupGraph
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import io

router = APIRouter()

# Dependencies
def get_startup_repository(db: AsyncSession = Depends(get_async_db)) -> StartupRepository:
    return StartupRepository(db)

def get_report_repository(db: AsyncSession = Depends(get_async_db)) -> ReportRepository:
    return ReportRepository(db)

def get_report_service(
    report_repo: ReportRepository = Depends(get_report_repository),
    startup_repo: StartupRepository = Depends(get_startup_repository)
) -> ReportService:
    return ReportService(report_repo, startup_repo)


async def run_generation_workflow(startup_id: str, report_id: str, db_session_factory=SessionLocal):
    """Background task to run the LangGraph workflow and update report status"""
    db = db_session_factory()
    try:
        # Fetch startup details
        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        if not startup:
            return
        
        # Update status
        startup.status = "processing"
        report = db.query(Report).filter(Report.id == report_id).first()
        if report:
            report.status = "processing"
        db.commit()

        # Run multi-agent orchestrator
        graph = StartupGraph()
        startup_info = {
            "name": startup.name,
            "description": startup.description,
            "industry": startup.industry,
            "budget": startup.budget,
            "country": startup.country,
            "target_audience": startup.target_audience,
        }
        
        result_state = await graph.execute(startup_id=startup_id, startup_info=startup_info)
        
        # Reload report in active session
        report = db.query(Report).filter(Report.id == report_id).first()
        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        
        if result_state.get("errors"):
            report.status = "failed"
            startup.status = "failed"
            report.report_data = {"errors": result_state.get("errors")}
        else:
            report.status = "completed"
            startup.status = "completed"
            # State results contains all detailed agent outputs
            report.report_data = result_state.get("results")
            
        from datetime import datetime
        report.completed_at = datetime.utcnow()
        db.commit()
        
    except Exception as e:
        db.rollback()
        report = db.query(Report).filter(Report.id == report_id).first()
        startup = db.query(Startup).filter(Startup.id == startup_id).first()
        if report:
            report.status = "failed"
            report.report_data = {"error": str(e)}
        if startup:
            startup.status = "failed"
        db.commit()
    finally:
        db.close()


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_report(
    report_data: ReportCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    report_service: ReportService = Depends(get_report_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Trigger background execution of multi-agent startup planner graph"""
    try:
        res = await report_service.generate_report(
            startup_id=report_data.startup_id,
            report_type=report_data.report_type,
            current_user=current_user,
            background_tasks=background_tasks,
            run_workflow_func=run_generation_workflow
        )
        # Log generation activity
        startup = await report_service.startup_repo.get_by_id(report_data.startup_id)
        startup_name = startup.name if startup else "Unknown Startup"
        from app.models.activity_log import ActivityLog
        db.add(ActivityLog(user_id=current_user.id, action="GENERATE_REPORT", description=f"Triggered autonomous venture pipeline for startup: '{startup_name}'"))
        await db.commit()
        return res
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_active_user),
    report_service: ReportService = Depends(get_report_service)
):
    """Retrieve detailed report results by ID"""
    try:
        return await report_service.get_report(report_id, current_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    startup_id: str = None,
    current_user: User = Depends(get_current_active_user),
    report_service: ReportService = Depends(get_report_service)
):
    """List generated reports (owners list their own, admins list all)"""
    return await report_service.list_reports(current_user, startup_id)


@router.get("/{report_id}/export")
async def export_report(
    report_id: str,
    format: str = "pdf",
    current_user: User = Depends(get_current_active_user),
    report_service: ReportService = Depends(get_report_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Export and download report as PDF, PPTX, or DOCX"""
    try:
        file_bytes, media_type, filename = await report_service.export_report(
            report_id=report_id,
            format=format,
            current_user=current_user
        )
        report = await report_service.get_report(report_id, current_user)
        startup = await report_service.startup_repo.get_by_id(report.startup_id)
        startup_name = startup.name if startup else "Unknown Startup"
        from app.models.activity_log import ActivityLog
        db.add(ActivityLog(user_id=current_user.id, action="EXPORT_REPORT", description=f"Exported {format.upper()} report for startup: '{startup_name}'"))
        await db.commit()
        return StreamingResponse(
            io.BytesIO(file_bytes),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
