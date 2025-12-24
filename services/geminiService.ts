
import { GoogleGenAI } from "@google/genai";
import { Gate, NoiseConfig, SimulationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getQuantumInsights(
  gates: Gate[],
  noise: NoiseConfig,
  results: SimulationResult
): Promise<string> {
  const prompt = `
    As a Quantum Error Correction Expert, analyze this circuit and its noise profile:
    
    Circuit Gates: ${JSON.stringify(gates.map(g => ({ type: g.type, qubit: g.qubit })))}
    Noise Model: ${noise.type} with error rate ${noise.probability}
    Observed Fidelity: ${(results.fidelity * 100).toFixed(2)}%
    
    Please provide:
    1. A brief explanation of why this specific noise affects these gates.
    2. One concrete mitigation technique (e.g., Dynamical Decoupling, Error Mitigation, or specific Error Correcting Code).
    3. How the fidelity might change if the error rate is doubled.
    
    Keep the tone professional and academic yet accessible.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "I was unable to analyze the circuit at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to the quantum analysis engine. Please try again later.";
  }
}
