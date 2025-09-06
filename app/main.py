from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
import joblib
import yaml
from utils.nlp_parser import extract_symptoms  # fuzzy NLP parser
import os

# --- Paths ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MED_FILE = os.path.join(BASE_DIR, "kb", "medications.yaml")

# --- Load ML model + feature list ---
try:
    model, feature_list = joblib.load(os.path.join(BASE_DIR, "model.joblib"))
except Exception as e:
    raise RuntimeError(f"Error loading model: {e}")

# --- Load medications KB ---
with open(MED_FILE) as f:
    MED_KB = yaml.safe_load(f)

MED_DICT = {d["disease"]: d["medications"] for d in MED_KB}

# --- Disease symptom mapping for follow-ups ---
DISEASE_SYMPTOMS = {
    "Tuberculosis": ["fever", "night sweats", "weight loss", "persistent cough", "fatigue"],
    "Pneumonia": ["fever", "chest pain", "difficulty breathing", "productive cough"],
    "COVID-19": ["fever", "dry cough", "loss of taste", "loss of smell", "fatigue"],
    "Influenza": ["fever", "body aches", "chills", "sore throat", "headache"],
    "Malaria": ["fever", "chills", "sweating", "headache", "nausea", "fatigue"],
    "Diabetes": ["excessive thirst", "frequent urination", "weight loss", "blurred vision", "fatigue"],
    "Hypertension": ["headaches", "dizziness", "nosebleeds", "shortness of breath", "chest discomfort"],
    "Migraine": ["pulsating headache", "nausea", "sensitivity to light", "sensitivity to sound", "aura"],
    "Gastroenteritis": ["diarrhea", "vomiting", "abdominal cramps", "nausea", "fever"],
    "Asthma": ["shortness of breath", "wheezing", "chest tightness", "coughing"],
    "Anemia": ["fatigue", "pale skin", "shortness of breath", "dizziness", "cold hands and feet"],
    "Appendicitis": ["abdominal pain", "nausea", "vomiting", "loss of appetite", "mild fever"],
}


# --- Symptom synonyms ---
SYMPTOM_SYNONYMS = {
    "high temperature": "fever",
    "tired": "fatigue",
    "short of breath": "shortness of breath",
    "stomach pain": "abdominal pain",
    "nauseous": "nausea",
}

# --- FastAPI setup ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request schema ---
class SymptomsRequest(BaseModel):
    symptoms: list[str] | None = None
    text: str | None = None

# --- Helper functions ---
def symptoms_to_vector(symptoms, feature_list):
    return [1 if f in symptoms else 0 for f in feature_list]

def generate_followups(top_predictions, user_symptoms):
    followups = set()
    for pred in top_predictions:
        disease = pred["disease"]
        for symptom in DISEASE_SYMPTOMS.get(disease, []):
            if symptom not in user_symptoms:
                followups.add(symptom)
    # Return list of symptoms (not full question)
    return list(followups)


def jaccard_similarity(list1, list2):
    s1, s2 = set(list1), set(list2)
    return len(s1 & s2) / len(s1 | s2) if s1 | s2 else 0

def similar_diseases(disease, threshold=0.15):
    target_symptoms = set(DISEASE_SYMPTOMS.get(disease, []))
    similar = []
    for other, symptoms in DISEASE_SYMPTOMS.items():
        if other == disease:
            continue
        score = jaccard_similarity(target_symptoms, symptoms)
        if score >= threshold:
            similar.append(other)
    return similar

# --- Endpoint ---
@app.post("/v1/assist")
def assist(request: SymptomsRequest):
    user_symptoms = []

    # Structured input
    if request.symptoms:
        user_symptoms.extend(request.symptoms)

    # Text input with fuzzy NLP
    if request.text:
        parsed = extract_symptoms(request.text)
        user_symptoms.extend(parsed)

        # Check synonyms
        for phrase, standard in SYMPTOM_SYNONYMS.items():
            if phrase in request.text.lower() and standard in feature_list:
                user_symptoms.append(standard)

    # Deduplicate
    user_symptoms = list(set(user_symptoms))

    if not user_symptoms:
        raise HTTPException(status_code=400, detail="No valid symptoms detected")

    # Vectorize
    X_input = [symptoms_to_vector(user_symptoms, feature_list)]

    try:
        probabilities = model.predict_proba(X_input)[0]
        top_indices = probabilities.argsort()[::-1][:3]

        top_predictions = []
        for i in top_indices:
            disease = model.classes_[i]
            confidence = float(probabilities[i])
            medications = MED_DICT.get(disease, [])
            top_predictions.append({
                "disease": disease,
                "confidence": confidence,
                "medications": medications
            })

        # Follow-ups & similar disease groups
        followup_questions = generate_followups(top_predictions, user_symptoms)
        similar_groups = {pred["disease"]: similar_diseases(pred["disease"]) for pred in top_predictions}

        return {
            "input_symptoms": user_symptoms,
            "top_predictions": top_predictions,
            "follow_up_questions": followup_questions,
            "similar_disease_groups": similar_groups
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
class RecalibrateRequest(BaseModel):
    initial_symptoms: list[str]
    follow_up_answers: dict[str, bool]

@app.post("/v1/recalibrate")
def recalibrate(request: RecalibrateRequest):
    # Start with initial symptoms
    updated_symptoms = set(request.initial_symptoms)

    # Add symptoms where user answered "Yes"
    for symptom, answer in request.follow_up_answers.items():
        if answer:
            updated_symptoms.add(symptom)

    updated_symptoms = list(updated_symptoms)

    # Vectorize
    X_input = [symptoms_to_vector(updated_symptoms, feature_list)]

    try:
        probabilities = model.predict_proba(X_input)[0]
        top_indices = probabilities.argsort()[::-1][:3]

        top_predictions = []
        for i in top_indices:
            disease = model.classes_[i]
            confidence = float(probabilities[i])
            medications = MED_DICT.get(disease, [])
            top_predictions.append({
                "disease": disease,
                "confidence": confidence,
                "medications": medications
            })

        # Updated follow-ups & similar disease groups
        followup_questions = generate_followups(top_predictions, updated_symptoms)
        similar_groups = {pred["disease"]: similar_diseases(pred["disease"]) for pred in top_predictions}

        return {
            "input_symptoms": updated_symptoms,
            "top_predictions": top_predictions,
            "follow_up_questions": followup_questions,
            "similar_disease_groups": similar_groups
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
