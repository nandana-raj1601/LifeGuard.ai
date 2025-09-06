import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
df = pd.read_csv("dataset.csv")

# Build symptom vocabulary
all_symptoms = sorted({s for row in df["symptoms"] for s in row.split(";")})
def vectorize(symptoms):
    return [1 if s in symptoms else 0 for s in all_symptoms]

X = [vectorize(row.split(";")) for row in df["symptoms"]]
y = df["disease"]

# Train model
model = RandomForestClassifier()
model.fit(X, y)

# Save model + symptoms
joblib.dump((model, all_symptoms), "model.joblib")
print("Model trained and saved with", len(all_symptoms), "symptoms!")
