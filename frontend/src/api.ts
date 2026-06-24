const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type DocType = "notes" | "slides" | "past_paper" | "exercises";
export type MaterialType =
  | "flashcards"
  | "summary"
  | "preexam"
  | "past_paper_analysis"
  | "practice_exam";

export interface UploadResult {
  session_id: number;
  files: { filename: string; doc_type: DocType }[];
}

export interface GenerateResult {
  session_id: number;
  material_ids: number[];
}

export interface Material {
  id: number;
  type: MaterialType;
  status: "pending" | "generating" | "done" | "error";
  content: string | null;
}

export async function uploadFiles(
  files: File[],
  docTypes: DocType[]
): Promise<UploadResult> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  docTypes.forEach((t) => form.append("doc_types", t));
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function generateMaterials(
  sessionId: number,
  types: MaterialType[]
): Promise<GenerateResult> {
  const params = new URLSearchParams({ session_id: String(sessionId) });
  types.forEach((t) => params.append("material_types", t));
  const res = await fetch(`${BASE}/generate?${params}`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMaterial(id: number): Promise<Material> {
  const res = await fetch(`${BASE}/material/${id}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function downloadUrl(id: number): string {
  return `${BASE}/material/${id}/download`;
}
