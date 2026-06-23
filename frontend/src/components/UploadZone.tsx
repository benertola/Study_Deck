import { useRef, useState } from "react";
import type { DocType } from "../api";

interface FileEntry {
  file: File;
  docType: DocType;
}

interface Props {
  onFilesChange: (entries: FileEntry[]) => void;
}

const DOC_TYPE_OPTIONS: { value: DocType; label: string }[] = [
  { value: "notes", label: "Lecture Notes" },
  { value: "slides", label: "Slides" },
  { value: "past_paper", label: "Past Paper" },
];

export default function UploadZone({ onFilesChange }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const newEntries: FileEntry[] = Array.from(files).map((f) => ({
      file: f,
      docType: guessDocType(f.name),
    }));
    const updated = [...entries, ...newEntries];
    setEntries(updated);
    onFilesChange(updated);
  };

  const guessDocType = (name: string): DocType => {
    const lower = name.toLowerCase();
    if (lower.includes("slide") || lower.includes("pptx")) return "slides";
    if (lower.includes("past") || lower.includes("exam") || lower.includes("paper"))
      return "past_paper";
    return "notes";
  };

  const setDocType = (index: number, type: DocType) => {
    const updated = entries.map((e, i) => (i === index ? { ...e, docType: type } : e));
    setEntries(updated);
    onFilesChange(updated);
  };

  const remove = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onFilesChange(updated);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-gray-500 text-sm">
          Drag & drop files here, or <span className="text-indigo-600 font-medium">browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, PPTX, DOCX, TXT supported</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.pptx,.docx,.txt"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {entries.length > 0 && (
        <ul className="space-y-2">
          {entries.map((entry, i) => (
            <li
              key={i}
              className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2"
            >
              <span className="text-sm text-gray-700 flex-1 truncate">{entry.file.name}</span>
              <select
                value={entry.docType}
                onChange={(e) => setDocType(i, e.target.value as DocType)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {DOC_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
