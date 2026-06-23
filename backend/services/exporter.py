import io
import json

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER


def export_material(mat) -> bytes:
    if mat.material_type in ("flashcards", "practice_exam"):
        return _export_qa_pdf(mat.content, mat.material_type)
    else:
        return _export_markdown_pdf(mat.content)


def _export_qa_pdf(content: str, mtype: str) -> bytes:
    items = json.loads(content)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    center = ParagraphStyle("center", parent=styles["Normal"], alignment=TA_CENTER, fontSize=14)
    label = ParagraphStyle("label", parent=styles["Normal"], fontSize=10, textColor="grey")

    story = []
    for i, item in enumerate(items, 1):
        story.append(Spacer(1, 3 * cm))
        story.append(Paragraph(f"{'Card' if mtype == 'flashcards' else 'Question'} {i}", label))
        story.append(Spacer(1, 0.5 * cm))
        story.append(Paragraph(item["question"], center))
        story.append(PageBreak())

        story.append(Spacer(1, 3 * cm))
        story.append(Paragraph("Answer", label))
        story.append(Spacer(1, 0.5 * cm))
        story.append(Paragraph(item["answer"], center))
        story.append(PageBreak())

    doc.build(story)
    return buf.getvalue()


def _export_markdown_pdf(content: str) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm)
    styles = getSampleStyleSheet()
    story = []

    for line in content.splitlines():
        if line.startswith("## "):
            story.append(Paragraph(line[3:], styles["Heading2"]))
        elif line.startswith("# "):
            story.append(Paragraph(line[2:], styles["Heading1"]))
        elif line.startswith("- ") or line.startswith("* "):
            story.append(Paragraph(f"• {line[2:]}", styles["Normal"]))
        elif line.strip() == "":
            story.append(Spacer(1, 0.3 * cm))
        else:
            story.append(Paragraph(line, styles["Normal"]))

    doc.build(story)
    return buf.getvalue()
