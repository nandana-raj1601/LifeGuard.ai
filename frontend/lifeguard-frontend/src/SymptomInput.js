import { useState } from "react";

export default function SymptomInput({ onSubmit }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
      <input
        type="text"
        placeholder="Enter your symptoms..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 p-4 rounded-xl border border-gray-300 shadow-lg focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all duration-300 placeholder-gray-400"
      />
      <button
        type="submit"
        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-105 transform text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
      >
        Analyze
      </button>
    </form>
  );
}
