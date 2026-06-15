from app.repositories.report_repo import ReportRepository
from app.repositories.startup_repo import StartupRepository
from app.models.report import Report
from app.models.user import User
from app.services.export_service import ExportService
from fastapi import BackgroundTasks
from typing import List, Optional, Tuple

class ReportService:
    """Service for handling report-related workflows and exports"""

    def __init__(self, report_repo: ReportRepository, startup_repo: StartupRepository):
        self.report_repo = report_repo
        self.startup_repo = startup_repo

    async def get_report(self, report_id: str, current_user: User) -> Report:
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise ValueError(f"Report with ID '{report_id}' not found")
        
        # Verify startup ownership
        startup = await self.startup_repo.get_by_id(report.startup_id)
        if not startup:
            raise ValueError("Associated startup concept not found")
        if str(startup.user_id) != str(current_user.id) and current_user.role != "admin":
            raise PermissionError("Not authorized to access this report")
        return report

    async def generate_report(self, startup_id: str, report_type: str, current_user: User, background_tasks: BackgroundTasks, run_workflow_func) -> Report:
        startup = await self.startup_repo.get_by_id(startup_id)
        if not startup:
            raise ValueError(f"Startup idea with ID '{startup_id}' not found")
        if str(startup.user_id) != str(current_user.id) and current_user.role != "admin":
            raise PermissionError("Unauthorized to run analysis for this startup")

        new_report = Report(
            startup_id=startup.id,
            report_type=report_type,
            status="processing"
        )
        report = await self.report_repo.create(new_report)

        # Trigger background workflow
        background_tasks.add_task(
            run_workflow_func,
            startup_id=startup.id,
            report_id=report.id
        )
        return report

    async def list_reports(self, current_user: User, startup_id: Optional[str] = None, skip: int = 0, limit: int = 10) -> List[Report]:
        if current_user.role == "admin":
            return await self.report_repo.list_all(startup_id)
        return await self.report_repo.list_by_user_id(current_user.id, startup_id)

    async def export_report(self, report_id: str, format: str, current_user: User) -> Tuple[bytes, str, str]:
        report = await self.get_report(report_id, current_user)
        if report.status != "completed":
            raise ValueError(f"Report is in '{report.status}' state. Only completed reports can be exported.")

        startup = await self.startup_repo.get_by_id(report.startup_id)
        export_service = ExportService()

        filename_base = startup.name.replace(' ', '_')
        if format.lower() == "pdf":
            file_bytes = export_service.export_to_pdf(report.report_data, startup.name)
            return file_bytes, "application/pdf", f"{filename_base}_Business_Plan.pdf"
        elif format.lower() == "pptx":
            file_bytes = export_service.export_to_pptx(report.report_data, startup.name)
            return file_bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation", f"{filename_base}_Pitch_Deck.pptx"
        elif format.lower() == "docx":
            file_bytes = export_service.export_to_docx(report.report_data, startup.name)
            return file_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", f"{filename_base}_Business_Plan.docx"
        else:
            raise ValueError(f"Unsupported export format '{format}'. Supported: pdf, pptx, docx.")
