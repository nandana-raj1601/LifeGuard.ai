import { useState } from "react";
import diseaseData from "./diseases.json";
import { calculateDosage } from "./utils/dosage"; 

export default function Predictions({ predictions, userAge, userWeight, userAllergies, userSymptoms}) {
  const [flipped, setFlipped] = useState(null);

  const toggleFlip = (disease) => {
    setFlipped((prev) => (prev === disease ? null : disease));
  };

  const getDiseaseInfo = (disease) => {
    return diseaseData[disease] || { causes: "N/A", advice: "N/A", critical: false };
  };


  const handleFlag = (disease) => {
    const existingFlags = JSON.parse(localStorage.getItem("flags")) || [];
    existingFlags.push({
      disease,
      timestamp: new Date().toISOString(),
      userSymptoms: predictions.map(p => p.symptoms).flat() 
    });
    localStorage.setItem("flags", JSON.stringify(existingFlags));
    alert(`Flagged "${disease}" for review`);
  };
  const getCommonSymptoms = (diseaseSymptoms) => {
  if (!diseaseSymptoms || !userSymptoms) return [];
  return diseaseSymptoms.filter(symptom =>
    userSymptoms.map(s => s.toLowerCase()).includes(symptom.toLowerCase())
  );
};






  return (
    <div className="space-y-6 relative z-0">
      <h2 className="text-3xl font-bold text-gray-700 border-b pb-2 mb-4">
        Predicted Diseases
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {predictions.map((p) => {
          const isFlipped = flipped === p.disease;
          const info = getDiseaseInfo(p.disease);
          const commonSymptoms = getCommonSymptoms(info.symptoms || [], p.symptoms || []);


          return (
            <div
              key={p.disease}
              className={`perspective cursor-pointer ${
                isFlipped
                  ? "fixed top-1/2 left-1/2 w-96 h-96 -translate-x-1/2 -translate-y-1/2 scale-110 z-50"
                  : "relative w-full h-80 z-10"
              }`}
              onClick={() => !isFlipped && toggleFlip(p.disease)}
            >
              <div
                className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                  isFlipped ? "rotate-y-180" : ""
                }`}
              >
                {/* Front Side */}
                <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-white to-gray-100 rounded-2xl p-6 shadow-neumorphic hover:shadow-neumorphic-hover border border-gray-200 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                      {p.disease}
                    </h3>

                    {info.critical && (
                      <p className="text-red-600 font-bold mb-2">
                    Critical condition — refer to provider
                      </p>
                    )}
                    {/* Reason for prediction */}
{info.symptoms && info.symptoms.length > 0 && (
  <p className="text-gray-600 mb-2">
    <strong>Reason:</strong> Matches your symptoms: {getCommonSymptoms(info.symptoms).join(", ") || "—"}
  </p>
)}



                    <div className="mb-4">
                      <p className="text-gray-500 mb-1">
                        Confidence: {(p.confidence * 100).toFixed(1)}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-indigo-500 h-4 rounded-full transition-all duration-1000"
                          style={{ width: `${(p.confidence * 100).toFixed(1)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Medications */}
                    {!info.critical && p.medications.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-700 mb-2">Medications:</p>
                        <div className="flex flex-wrap gap-2">
                          {p.medications.map((m, idx) => {
                            const dosage = calculateDosage(m, userAge, userWeight, userAllergies);
                            const isAllergic = userAllergies.includes(m.name);
                            return (
                              <span
                                key={idx}
                                className={`px-3 py-1 rounded-full shadow-md text-sm font-semibold ${
                                  isAllergic
                                    ? "bg-red-500 text-white"
                                    : "bg-gradient-to-r from-green-400 to-green-600 text-white"
                                }`}
                                title={isAllergic ? "Allergic to this medication!" : ""}
                              >
                                {m.name} ({dosage})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  

                  {/* Flag button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlag(p.disease);
                    }}
                    className="mt-4 self-start bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg shadow-md transition-all"
                  >
                    ⚠️ Flag for review
                  </button>
                </div>

                {/* Back Side */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 flex flex-col">
                  <button
                    onClick={() => toggleFlip(p.disease)}
                    className="self-end text-gray-500 hover:text-gray-700 text-xl font-bold mb-2"
                  >
                    ×
                  </button>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                    {p.disease} - Details
                  </h3>

                  {info.critical && (
                    <p className="text-red-600 font-bold mb-2">
                      ⚠️ Critical condition — refer to provider
                    </p>
                  )}

                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">Causes:</span> {info.causes}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Advice:</span> {info.advice}
                  </p>
                  <p className="text-gray-600 mb-2">
                    <span className="font-semibold">Side effects:</span>{" "}
                    {info.medications.map((m) => m.sideEffects).join(", ")}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Precautions:</span>{" "}
                    {info.medications.map((m) => m.precautions).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlay */}
      {flipped && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setFlipped(null)}
        ></div>
      )}
    </div>
  );
}
