import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import diseaseData from "./diseases.json";

export default function SummaryChart({ predictions }) {
  return (
    <div className="w-full h-96 bg-white rounded-2xl shadow-neumorphic p-4">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">
        Recalibration Summary
      </h2>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart width={500} height={300} data={predictions}>
  <XAxis dataKey="disease" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="confidence">
    {predictions.map((p, idx) => {
      const isCritical = diseaseData[p.disease]?.critical || false;
      return (
        <Cell
          key={`cell-${idx}`}
          fill={isCritical ? "#EF4444" : "#3B82F6"} // red if critical
        />
      );
    })}
  </Bar>
</BarChart>

      </ResponsiveContainer>
      <p className="mt-2 text-sm text-gray-500">
        Red bars indicate critical or life-threatening diseases. Consult a healthcare provider.
      </p>
    </div>
  );
}
