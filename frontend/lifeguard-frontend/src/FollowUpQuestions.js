import { useState } from "react";

export default function FollowUpQuestions({ followUps, onAnswer }) {
  const [answered, setAnswered] = useState({});
  const [clicked, setClicked] = useState({}); // track which button was clicked

  const handleClick = (symptom, answer) => {
    setClicked({ [symptom]: answer }); // show visual feedback
    setTimeout(() => {
      setAnswered(prev => ({ ...prev, [symptom]: answer })); // hide question
      setClicked(prev => ({ ...prev, [symptom]: undefined })); // reset
    }, 300); // 300ms delay for feedback
    onAnswer(symptom, answer); // update App state
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-700 border-b pb-2 mb-4">
        Follow-up Questions
      </h2>
      {followUps
        .filter(q => !answered[q])
        .map((q, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-neumorphic hover:shadow-neumorphic-hover p-5 flex justify-between items-center transition-all duration-300 border border-gray-200"
          >
            <span className="text-gray-700">{q}</span>
            <div className="flex gap-3">
              <button
                onClick={() => handleClick(q, true)}
                className={`bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold px-5 py-2 rounded-xl transition-all duration-300 ${
                  clicked[q] === true ? "scale-110 opacity-80" : "hover:scale-105"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleClick(q, false)}
                className={`bg-gradient-to-r from-red-400 to-red-600 text-white font-semibold px-5 py-2 rounded-xl transition-all duration-300 ${
                  clicked[q] === false ? "scale-110 opacity-80" : "hover:scale-105"
                }`}
              >
                No
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
