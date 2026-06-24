from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select

from database import get_session
from models import StudyMaterial, UploadedFile
from services.ai import generate_material
from services.exporter import export_material

router = APIRouter(tags=["generate"])

VALID_TYPES = {"flashcards", "summary", "preexam", "past_paper_analysis", "practice_exam"}


@router.post("/generate")
async def generate(
    session_id: int,
    material_types: List[str],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session),
):
    invalid = set(material_types) - VALID_TYPES
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid material types: {invalid}")

    files = db.exec(select(UploadedFile).where(UploadedFile.session_id == session_id)).all()
    if not files:
        raise HTTPException(status_code=404, detail="Session not found or no files uploaded")

    def join_by_type(doc_type: str) -> str:
        return "\n\n".join(
            f"[{f.filename}]\n{f.parsed_text or ''}"
            for f in files if f.doc_type == doc_type
        )

    combined_text = "\n\n".join(
        f"[{f.doc_type.upper()} — {f.filename}]\n{f.parsed_text or ''}" for f in files
    )
    notes_text = join_by_type("notes")
    slides_text = join_by_type("slides")
    past_paper_text = join_by_type("past_paper")

    material_ids = []
    for mtype in material_types:
        mat = StudyMaterial(session_id=session_id, material_type=mtype, status="pending")
        db.add(mat)
        db.commit()
        db.refresh(mat)
        material_ids.append(mat.id)
        background_tasks.add_task(_run_generation, mat.id, mtype, combined_text, notes_text, slides_text, past_paper_text)

    return {"session_id": session_id, "material_ids": material_ids}


async def _run_generation(material_id: int, mtype: str, combined_text: str, notes_text: str, slides_text: str, past_paper_text: str):
    from database import engine
    from sqlmodel import Session

    with Session(engine) as db:
        mat = db.get(StudyMaterial, material_id)
        mat.status = "generating"
        db.add(mat)
        db.commit()

        try:
            content = await generate_material(mtype, combined_text, notes_text, slides_text, past_paper_text)
            mat.content = content
            mat.status = "done"
        except Exception as e:
            mat.status = "error"
            mat.content = str(e)

        db.add(mat)
        db.commit()


@router.get("/material/{material_id}")
def get_material(material_id: int, db: Session = Depends(get_session)):
    mat = db.get(StudyMaterial, material_id)
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    return {
        "id": mat.id,
        "type": mat.material_type,
        "status": mat.status,
        "content": mat.content,
    }


@router.get("/material/{material_id}/download")
def download_material(material_id: int, db: Session = Depends(get_session)):
    mat = db.get(StudyMaterial, material_id)
    if not mat or mat.status != "done":
        raise HTTPException(status_code=404, detail="Material not ready")

    pdf_bytes = export_material(mat)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{mat.material_type}.pdf"'},
    )
