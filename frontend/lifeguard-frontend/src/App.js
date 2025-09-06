import { useState } from "react";
import SymptomInput from "./SymptomInput";
import Predictions from "./Predictions";
import VisualSummary from "./VisualSummary";
import FollowUpQuestions from "./FollowUpQuestions";
import axios from "axios";

function App() {
  const [predictions, setPredictions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [userSymptoms, setUserSymptoms] = useState([]);
  const [followUpAnswers, setFollowUpAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [userAge, setUserAge] = useState("");
  const [userWeight, setUserWeight] = useState("");
  const [userAllergies, setUserAllergies] = useState("");


  const handleSubmitSymptoms = async (text) => {
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:8000/v1/assist", { text });
      setUserSymptoms(response.data.input_symptoms);
      setPredictions(response.data.top_predictions);
      setFollowUps(response.data.follow_up_questions);
      setFollowUpAnswers({}); 
    } catch (err) {
      console.error(err);
      alert("Error fetching predictions");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpAnswer = (symptom, answer) => {
    setFollowUpAnswers((prev) => ({ ...prev, [symptom]: answer }));
    setFollowUps((prev) => prev.filter((q) => q !== symptom));
  };

  const handleRecalibrate = async () => {
    try {
      const response = await axios.post("http://127.0.0.1:8000/v1/recalibrate", {
        initial_symptoms: userSymptoms,
        follow_up_answers: followUpAnswers,
      });
      setUserSymptoms(response.data.input_symptoms);
      setPredictions(response.data.top_predictions);
      setFollowUps(response.data.follow_up_questions);
      setFollowUpAnswers({}); 
    } catch (err) {
      console.error(err);
      alert("Error recalibrating predictions");
    }
  };

  const showRecalibrate =
    followUps.length === 0 && Object.keys(followUpAnswers).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-12">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-blue-800 animate-pulse">
          LifeGuard.ai
        </h1>
        <p className="text-gray-500 mt-2 text-lg">
          Enter your symptoms and get AI-driven insights instantly
        </p>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Symptom Input */}
        <SymptomInput onSubmit={handleSubmitSymptoms} />

        {/* Loading indicator */}
        {loading && (
          <div className="text-center text-gray-500 animate-pulse">
            Analyzing symptoms...
          </div>
        )}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
  <h3 className="font-semibold mb-2">Patient Info (Optional for customized dosage)</h3>
  <div className="flex flex-col md:flex-row gap-4">
    <input
      type="number"
      placeholder="Age (years)"
      value={userAge}
      onChange={(e) => setUserAge(e.target.value)}
      className="p-2 border rounded-md flex-1"
    />
    <input
      type="number"
      placeholder="Weight (kg)"
      value={userWeight}
      onChange={(e) => setUserWeight(e.target.value)}
      className="p-2 border rounded-md flex-1"
    />
    <input
      type="text"
      placeholder="Allergies (comma separated)"
      value={userAllergies}
      onChange={(e) => setUserAllergies(e.target.value)}
      className="p-2 border rounded-md flex-1"
    />
  </div>
</div>


        {/* Predictions */}
        {predictions.length > 0 && <Predictions
  predictions={predictions}
  userAge={userAge}
  userWeight={userWeight}
  userSymptoms={userSymptoms}
  userAllergies={userAllergies.split(",").map(a => a.trim())}
/>
}

        {/* Follow-up Questions */}
        {followUps.length > 0 && (
          <FollowUpQuestions followUps={followUps} onAnswer={handleFollowUpAnswer} />
        )}

        {/* Recalibrate Button */}
        {showRecalibrate && (
          <div className="text-center mt-4">
            <button
              onClick={handleRecalibrate}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md transition-all"
            >
              Recalibrate Predictions
            </button>
          </div>
        )}
      </div>

      {/* Visual Summary */}
      {predictions.length > 0 && <VisualSummary predictions={predictions} />}
    </div>
  );
}

export default App;
