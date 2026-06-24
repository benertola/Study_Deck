import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MaterialType } from "../api";
import { generateMaterials, uploadFiles } from "../api";
import MaterialSelector from "../components/MaterialSelector";
import UploadZone from "../components/UploadZone";

export default function UploadPage() {
  const [notesFiles, setNotesFiles] = useState<File[]>([]);
  const [slidesFiles, setSlidesFiles] = useState<File[]>([]);
  const [pastPaperFiles, setPastPaperFiles] = useState<File[]>([]);
  const [exerciseFiles, setExerciseFiles] = useState<File[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    const totalFiles = notesFiles.length + slidesFiles.length + pastPaperFiles.length + exerciseFiles.length;
    if (totalFiles === 0) {
      setError("Please upload at least one file.");
      return;
    }
    if (selectedTypes.length === 0) {
      setError("Please select at least one study material type.");
      return;
    }
    const needsPastPapers = selectedTypes.includes("past_paper_analysis") || selectedTypes.includes("practice_exam");
    if (needsPastPapers && pastPaperFiles.length === 0) {
      setError("Past Paper Analysis and Practice Exam require at least one past paper to be uploaded.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allFiles = [...notesFiles, ...slidesFiles, ...pastPaperFiles, ...exerciseFiles];
      const allTypes = [
        ...notesFiles.map(() => "notes" as const),
        ...slidesFiles.map(() => "slides" as const),
        ...pastPaperFiles.map(() => "past_paper" as const),
        ...exerciseFiles.map(() => "exercises" as const),
      ];

      const uploadResult = await uploadFiles(allFiles, allTypes);
      const generateResult = await generateMaterials(uploadResult.session_id, selectedTypes, additionalInfo);

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
          <div className="grid grid-cols-1 gap-4">
            <UploadZone
              label="Lecture Notes"
              description="Word docs, PDFs or text files of your lecture notes"
              files={notesFiles}
              onFilesChange={setNotesFiles}
            />
            <UploadZone
              label="Lecture Slides"
              description="PowerPoint or PDF slides from your lectures"
              files={slidesFiles}
              onFilesChange={setSlidesFiles}
            />
            <UploadZone
              label="Past Papers"
              description="Previous exam papers for analysis and practice"
              files={pastPaperFiles}
              onFilesChange={setPastPaperFiles}
            />
            <UploadZone
              label="Exercise / Tutorial Questions"
              description="Worksheet or tutorial questions and solutions"
              files={exerciseFiles}
              onFilesChange={setExerciseFiles}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-gray-800 mb-1">2. Additional information <span className="text-gray-400 font-normal">(optional)</span></h2>
          <p className="text-xs text-gray-400 mb-3">Anything the AI should know — lecturer hints, topic weightings, what to prioritise, etc.</p>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder='e.g. "The lecturer said Topic 3 will definitely be on the exam." or "Tutorial questions are more important than past papers this year."'
            rows={4}
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-white"
          />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">3. Choose study materials</h2>
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
