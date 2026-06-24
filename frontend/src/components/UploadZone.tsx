import { useRef, useState } from "react";

interface Props {
  label: string;
  description: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export default function UploadZone({ label, description, files, onFilesChange }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: FileList | File[]) => {
    const merged = [...files, ...Array.from(incoming)];
    onFilesChange(merged);
  };

  const remove = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
      >
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 mb-2">{description}</p>
        <span className="text-xs text-indigo-600 font-medium">Click or drag files here</span>
        <p className="text-xs text-gray-400 mt-1">PDF, PPTX, DOCX, TXT</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.pptx,.docx,.txt"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-600 flex-1 truncate">{f.name}</span>
              <button
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-500 transition-colors text-base leading-none"
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
