// src/utils/dosage.js
export const calculateDosage = (medication, age, weight, allergies = []) => {
  if (allergies.includes(medication.name)) return "⚠️ Avoid";
  if (!age || !weight) return medication.dosage;

  switch (medication.name) {
    case "Paracetamol":
      if (age < 12) return `${(weight * 15).toFixed(0)}mg every 6-8 hours`;
      return medication.dosage;
    case "Artemisinin Combination Therapy":
      return `${(weight * 4).toFixed(0)}mg twice daily for 3 days`;
    default:
      return medication.dosage;
  }
};
