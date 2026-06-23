import os
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session

from database import get_session
from models import UploadSession, UploadedFile
from services.parser import parse_bytes

router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_EXTENSIONS = {".pdf", ".pptx", ".docx", ".txt"}


@router.post("")
async def upload_files(
    files: List[UploadFile] = File(...),
    doc_types: List[str] = Form(...),
    db: Session = Depends(get_session),
):
    if len(files) != len(doc_types):
        raise HTTPException(status_code=400, detail="files and doc_types length mismatch")

    session_obj = UploadSession()
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)

    uploaded = []
    for file, doc_type in zip(files, doc_types):
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

        data = await file.read()
        parsed_text = parse_bytes(file.filename, data)

        db_file = UploadedFile(
            session_id=session_obj.id,
            filename=file.filename,
            doc_type=doc_type,
            file_path="",
            parsed_text=parsed_text,
        )
        db.add(db_file)
        uploaded.append({"filename": file.filename, "doc_type": doc_type})

    db.commit()
    return {"session_id": session_obj.id, "files": uploaded}
