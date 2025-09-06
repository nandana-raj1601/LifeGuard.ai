# utils/nlp_parser.py
import re
from rapidfuzz import process

# Your existing symptom vocabulary
ALL_SYMPTOMS = [
    "fever", "cough", "shortness of breath", "fatigue",
    "headache", "chest pain", "sore throat", "loss of smell",
    "nausea", "vomiting", "diarrhea", "dizziness"
    # extend as needed
]

def extract_symptoms(text: str):
    """
    Extract symptoms from free-text input using fuzzy keyword matching.
    """
    tokens = re.findall(r"\w+", text.lower())
    matched = set()
    for token in tokens:
        match, score, _ = process.extractOne(token, ALL_SYMPTOMS)
        if score > 80:  # similarity threshold
            matched.add(match)
    return list(matched)
