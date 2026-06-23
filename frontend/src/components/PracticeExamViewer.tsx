import { useState } from "react";

interface QA {
  question: string;
  answer: string;
}

interface Props {
  content: string;
}

export default function PracticeExamViewer({ content }: Props) {
  const items: QA[] = JSON.parse(content);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <ol className="space-y-4 text-left">
      {items.map((item, i) => (
        <li key={i} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
          <p className="font-medium text-gray-800 mb-3">
            {i + 1}. {item.question}
          </p>
          {revealed.has(i) ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">{item.answer}</p>
            </div>
          ) : (
            <button
              onClick={() => toggle(i)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Show answer
            </button>
          )}
          {revealed.has(i) && (
            <button
              onClick={() => toggle(i)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Hide
            </button>
          )}
        </li>
      ))}
    </ol>
  );
}
