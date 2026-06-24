import json
import os
import anthropic

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 8096


async def generate_material(material_type: str, combined_text: str, notes_text: str, slides_text: str, past_paper_text: str, past_paper_solutions_text: str = "", exercises_text: str = "", additional_info: str = "") -> str:
    handlers = {
        "flashcards": _flashcards,
        "summary": _summary,
        "preexam": _preexam,
        "past_paper_analysis": _past_paper_analysis,
        "practice_exam": _practice_exam,
    }
    return await handlers[material_type](combined_text, notes_text, slides_text, past_paper_text, past_paper_solutions_text, exercises_text, additional_info)


def _additional_info_block(additional_info: str) -> str:
    if not additional_info.strip():
        return ""
    return f"""
IMPORTANT — STUDENT'S ADDITIONAL INFORMATION:
The student has provided the following context. Treat this as high-priority guidance and let it directly influence what you emphasise, prioritise, or adjust in your output:
\"\"\"{additional_info}\"\"\"
"""


async def _flashcards(text: str, notes: str, slides: str, past_papers: str, past_paper_solutions: str = "", exercises: str = "", additional_info: str = "") -> str:
    prompt = f"""You are a study assistant. Based on the lecture material below, create flashcards.
{_additional_info_block(additional_info)}
Return a JSON array of objects with exactly this shape:
[{{"question": "...", "answer": "..."}}]

Return ONLY the JSON array, no other text.

MATERIAL:
{text[:12000]}"""

    msg = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()
    json.loads(raw)
    return raw


async def _summary(text: str, notes: str, slides: str, past_papers: str, past_paper_solutions: str = "", exercises: str = "", additional_info: str = "") -> str:
    has_past_papers = bool(past_papers.strip()) or bool(past_paper_solutions.strip())

    past_paper_instruction = ""
    if has_past_papers:
        past_paper_instruction = """
Since past papers are provided:
- Analyse which topics appear most frequently in past exams. Mark each topic heading with one of: ⚠️ HIGH PRIORITY, 🔶 MEDIUM PRIORITY, or 🔹 LOW PRIORITY based on how often it is examined.
- Under each topic, add an ### Exam Example subsection with a real question pulled from the past papers on that topic, followed by a detailed model answer/solution.
- Add a brief note like "This topic has appeared in X past papers" where relevant.
"""
    else:
        past_paper_instruction = """
No past papers were provided, so do not include priority labels or exam examples.
"""

    prompt = f"""You are a study assistant creating detailed summary notes for a student.
{_additional_info_block(additional_info)}
Your job:
1. Cover EVERY topic from the lecture notes and slides — do not skip anything.
2. The notes and slides may overlap or repeat content. Use your judgment to merge them: if both say the same thing, say it once using the more detailed version. Do not duplicate content.
3. Organise everything by topic using ## Topic Name headers.
4. Under each topic write clear bullet points covering all key concepts, definitions, and explanations. Bold important terms.
5. If exercise/tutorial questions are provided, use them to enrich explanations — they often show how concepts are applied in practice.
{past_paper_instruction}

Use this structure for each topic:
## Topic Name [PRIORITY LABEL if past papers available]

### Key Concepts
- ...

### Exam Example [only if past papers available]
> **Q:** [exact or paraphrased question from past paper]
>
> **A:** [detailed model answer]

---

LECTURE NOTES:
{notes[:5000]}

LECTURE SLIDES:
{slides[:5000]}

EXERCISE / TUTORIAL QUESTIONS:
{exercises[:3000] if exercises.strip() else "None provided."}

PAST PAPERS (questions):
{past_papers[:2000] if has_past_papers else "None provided."}

PAST PAPER SOLUTIONS (mark schemes):
{past_paper_solutions[:2000] if past_paper_solutions.strip() else "None provided."}"""

    msg = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


async def _preexam(text: str, notes: str, slides: str, past_papers: str, past_paper_solutions: str = "", exercises: str = "", additional_info: str = "") -> str:
    prompt = f"""You are a study assistant. Based on the lecture material below, write concise pre-exam notes — the most important points a student should review in the final hour before their exam.
{_additional_info_block(additional_info)}
Use markdown: bullet points, bold for key terms. Be brief and scannable.

MATERIAL:
{text[:12000]}"""

    msg = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


async def _past_paper_analysis(text: str, notes: str, slides: str, past_papers: str, past_paper_solutions: str = "", exercises: str = "", additional_info: str = "") -> str:
    prompt = f"""You are a study assistant. Based on the past exam papers and their solutions below, analyse them and produce a report covering:
- Which topics or question types appear most frequently
- Which weeks/units/chapters are tested most often
- Any patterns in question structure or difficulty
- Common mistakes or key steps shown in the solutions
- Recommended focus areas for exam preparation
{_additional_info_block(additional_info)}
Use markdown with ## headers and tables where appropriate.

PAST PAPERS (questions):
{past_papers[:6000] if past_papers.strip() else "None provided."}

PAST PAPER SOLUTIONS:
{past_paper_solutions[:6000] if past_paper_solutions.strip() else "None provided."}"""

    msg = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


async def _practice_exam(text: str, notes: str, slides: str, past_papers: str, past_paper_solutions: str = "", exercises: str = "", additional_info: str = "") -> str:
    prompt = f"""You are a study assistant. Based on the lecture material, past papers and their solutions below, generate a practice exam.
{_additional_info_block(additional_info)}
Return a JSON array of objects with exactly this shape:
[{{"question": "...", "answer": "..."}}]

Include 10–15 questions covering key topics. Use the past paper solutions as a guide for what a high-quality answer looks like. Return ONLY the JSON array, no other text.

MATERIAL:
{text[:8000]}

PAST PAPER SOLUTIONS:
{past_paper_solutions[:4000] if past_paper_solutions.strip() else "None provided."}"""

    msg = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = msg.content[0].text.strip()
    json.loads(raw)
    return raw
