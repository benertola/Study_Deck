import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DocType, MaterialType } from "../api";
import { generateMaterials, uploadFiles } from "../api";
import MaterialSelector from "../components/MaterialSelector";
import UploadZone from "../components/UploadZone";

interface FileEntry {
  file: File;
  docType: DocType;
}

export default function UploadPage() {
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (fileEntries.length === 0) {
      setError("Please upload at least one file.");
      return;
    }
    if (selectedTypes.length === 0) {
      setError("Please select at least one study material type.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const uploadResult = await uploadFiles(
        fileEntries.map((e) => e.file),
        fileEntries.map((e) => e.docType)
      );

      const generateResult = await generateMaterials(uploadResult.session_id, selectedTypes);

      navigate("/study", {
        state: {
          sessionId: uploadResult.session_id,
          materialIds: generateResult.material_ids,
          materialTypes: selectedTypes,
        },
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Study Deck</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Upload your lecture materials and generate personalised study content.
        </p>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">1. Upload your files</h2>
          <UploadZone onFilesChange={setFileEntries} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">2. Choose study materials</h2>
          <MaterialSelector selected={selectedTypes} onChange={setSelectedTypes} />
        </section>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Generating..." : "Generate Study Materials"}
        </button>
      </div>
    </div>
  );
}
