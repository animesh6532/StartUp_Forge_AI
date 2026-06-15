"""Report schema"""

from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class ReportCreate(BaseModel):
    """Report creation schema"""

    startup_id: str
    report_type: str


class ReportResponse(BaseModel):
    """Report response schema"""

    id: str
    startup_id: str
    report_type: str
    status: str
    report_data: Optional[Any] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
