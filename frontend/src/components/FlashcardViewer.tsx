import { useState } from "react";

interface Card {
  question: string;
  answer: string;
}

interface Props {
  content: string;
}

export default function FlashcardViewer({ content }: Props) {
  const cards: Card[] = JSON.parse(content);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[index];

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-gray-500">
        Card {index + 1} of {cards.length}
      </p>

      {/* Flip card */}
      <div
        className="w-full max-w-lg h-56 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex items-center justify-center p-6 bg-white border-2 border-indigo-200 rounded-2xl shadow-md"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-gray-800 text-center font-medium">{card.question}</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex items-center justify-center p-6 bg-indigo-600 rounded-2xl shadow-md"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-white text-center">{card.answer}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">Click card to flip</p>

      <div className="flex gap-4">
        <button
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            setFlipped(false);
          }}
          disabled={index === 0}
          className="px-5 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => {
            setIndex((i) => Math.min(cards.length - 1, i + 1));
            setFlipped(false);
          }}
          disabled={index === cards.length - 1}
          className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-40 hover:bg-indigo-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
