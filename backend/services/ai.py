import json
import os
import anthropic

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

MODEL = "claude-sonnet-4-6"
MAX_TOKENS = 4096


async def generate_material(material_type: str, combined_text: str) -> str:
    handlers = {
        "flashcards": _flashcards,
        "summary": _summary,
        "preexam": _preexam,
        "past_paper_analysis": _past_paper_analysis,
        "practice_exam": _practice_exam,
    }
    return await handlers[material_type](combined_text)


async def _flashcards(text: str) -> str:
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
    # Validate it's parseable JSON
    json.loads(raw)
    return raw


async def _summary(text: str) -> str:
    prompt = f"""You are a study assistant. Based on the lecture material below, write a detailed summary of all key concepts, organised by topic with headers.

Use markdown formatting with ## headers, bullet points, and bold for key terms.

MATERIAL:
{text[:12000]}"""

    msg = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


async def _preexam(text: str) -> str:
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


async def _past_paper_analysis(text: str) -> str:
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


async def _practice_exam(text: str) -> str:
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
