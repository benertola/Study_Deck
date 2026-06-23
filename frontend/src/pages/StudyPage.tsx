import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Material, MaterialType } from "../api";
import { getMaterial } from "../api";
import DownloadButton from "../components/DownloadButton";
import FlashcardViewer from "../components/FlashcardViewer";
import MarkdownViewer from "../components/MarkdownViewer";
import PracticeExamViewer from "../components/PracticeExamViewer";

const TAB_LABELS: Record<MaterialType, string> = {
  flashcards: "Flashcards",
  summary: "Summary Notes",
  preexam: "Pre-Exam Notes",
  past_paper_analysis: "Past Paper Analysis",
  practice_exam: "Practice Exam",
};

interface LocationState {
  sessionId: number;
  materialIds: number[];
  materialTypes: MaterialType[];
}

export default function StudyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [materials, setMaterials] = useState<Record<MaterialType, Material | null>>({} as Record<MaterialType, Material | null>);
  const [activeTab, setActiveTab] = useState<MaterialType | null>(null);

  useEffect(() => {
    if (!state) {
      navigate("/");
      return;
    }

    setActiveTab(state.materialTypes[0]);

    const poll = async () => {
      const results = await Promise.all(
        state.materialIds.map((id) => getMaterial(id))
      );
      const map: Partial<Record<MaterialType, Material>> = {};
      results.forEach((m) => {
        map[m.type as MaterialType] = m;
      });
      setMaterials(map as Record<MaterialType, Material | null>);

      const stillPending = results.some((m) => m.status === "pending" || m.status === "generating");
      if (stillPending) {
        setTimeout(poll, 2500);
      }
    };

    poll();
  }, []);

  if (!state) return null;

  const currentMaterial = activeTab ? materials[activeTab] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          &larr; New Session
        </button>
        <h1 className="text-lg font-bold text-gray-900">Study Deck</h1>
        <div className="w-24" />
      </header>

      {/* Tab bar */}
      <nav className="bg-white border-b border-gray-200 px-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {state.materialTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === type
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {TAB_LABELS[type]}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {!currentMaterial || currentMaterial.status === "pending" || currentMaterial.status === "generating" ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Generating your study material...</p>
          </div>
        ) : currentMaterial.status === "error" ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 text-sm">Generation failed. Please try again.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end">
              <DownloadButton materialId={currentMaterial.id} />
            </div>

            {activeTab === "flashcards" && <FlashcardViewer content={currentMaterial.content!} />}
            {activeTab === "practice_exam" && (
              <PracticeExamViewer content={currentMaterial.content!} />
            )}
            {(activeTab === "summary" ||
              activeTab === "preexam" ||
              activeTab === "past_paper_analysis") && (
              <MarkdownViewer content={currentMaterial.content!} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
