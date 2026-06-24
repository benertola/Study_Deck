import json
import os
import anthropic

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 8096


async def generate_material(material_type: str, combined_text: str, notes_text: str, slides_text: str, past_paper_text: str) -> str:
    handlers = {
        "flashcards": _flashcards,
        "summary": _summary,
        "preexam": _preexam,
        "past_paper_analysis": _past_paper_analysis,
        "practice_exam": _practice_exam,
    }
    return await handlers[material_type](combined_text, notes_text, slides_text, past_paper_text)


async def _flashcards(text: str, notes: str, slides: str, past_papers: str) -> str:
    prompt = f"""You are a study assistant. Based on the lecture material below, create flashcards.

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


async def _summary(text: str, notes: str, slides: str, past_papers: str) -> str:
    has_past_papers = bool(past_papers.strip())

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

Your job:
1. Cover EVERY topic from the lecture notes and slides — do not skip anything.
2. The notes and slides may overlap or repeat content. Use your judgment to merge them: if both say the same thing, say it once using the more detailed version. Do not duplicate content.
3. Organise everything by topic using ## Topic Name headers.
4. Under each topic write clear bullet points covering all key concepts, definitions, and explanations. Bold important terms.
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
{notes[:6000]}

LECTURE SLIDES:
{slides[:6000]}

PAST PAPERS:
{past_papers[:4000] if has_past_papers else "None provided."}"""

    msg = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


async def _preexam(text: str, notes: str, slides: str, past_papers: str) -> str:
    prompt = f"""You are a study assistant. Based on the lecture material below, write concise pre-exam notes — the most important points a student should review in the final hour before their exam.

Use markdown: bullet points, bold for key terms. Be brief and scannable.

MATERIAL:
{text[:12000]}"""

    msg = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


async def _past_paper_analysis(text: str, notes: str, slides: str, past_papers: str) -> str:
    prompt = f"""You are a study assistant. Based on the past exam papers included in the material below, analyse the papers and produce a report covering:
- Which topics or question types appear most frequently
- Which weeks/units/chapters are tested most often
- Any patterns in question structure or difficulty
- Recommended focus areas for exam preparation

Use markdown with ## headers and tables where appropriate.

MATERIAL:
{text[:12000]}"""

    msg = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


async def _practice_exam(text: str, notes: str, slides: str, past_papers: str) -> str:
    prompt = f"""You are a study assistant. Based on the lecture material and past papers below, generate a practice exam.

Return a JSON array of objects with exactly this shape:
[{{"question": "...", "answer": "..."}}]

Include 10–15 questions covering key topics. Return ONLY the JSON array, no other text.

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
