from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


class UploadSession(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UploadedFile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="uploadsession.id")
    filename: str
    doc_type: str  # "notes" | "slides" | "past_paper"
    file_path: str
    parsed_text: Optional[str] = None


class StudyMaterial(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="uploadsession.id")
    material_type: str  # "flashcards" | "summary" | "preexam" | "past_paper_analysis" | "practice_exam"
    status: str = "pending"  # "pending" | "generating" | "done" | "error"
    content: Optional[str] = None  # JSON string for flashcards, markdown for others
    created_at: datetime = Field(default_factory=datetime.utcnow)
