import type { MaterialType } from "../api";

const OPTIONS: { value: MaterialType; label: string; description: string }[] = [
  { value: "flashcards", label: "Flashcards", description: "Flip-through Q&A cards" },
  { value: "summary", label: "Detailed Summary", description: "Comprehensive notes from all materials" },
  { value: "preexam", label: "Pre-Exam Notes", description: "Quick-scan cheat sheet for exam day" },
  {
    value: "past_paper_analysis",
    label: "Past Paper Analysis",
    description: "Topic frequency & exam patterns",
  },
  {
    value: "practice_exam",
    label: "Practice Exam",
    description: "AI-generated practice questions",
  },
];

interface Props {
  selected: MaterialType[];
  onChange: (types: MaterialType[]) => void;
}

export default function MaterialSelector({ selected, onChange }: Props) {
  const toggle = (type: MaterialType) => {
    if (selected.includes(type)) {
      onChange(selected.filter((t) => t !== type));
    } else {
      onChange([...selected, type]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {OPTIONS.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
              active
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-indigo-300 bg-white"
            }`}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggle(opt.value)}
              className="mt-1 accent-indigo-600"
            />
            <div>
              <p className="font-medium text-gray-800 text-sm">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
