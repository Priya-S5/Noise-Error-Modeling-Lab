
import { Gate, GateType, NoiseType, SimulationResult, NoiseConfig } from '../types';

/**
 * Enhanced Quantum Density Matrix & State-Vector Simulator.
 * Supports up to 3 qubits with complex amplitude (phase) approximation.
 */
export class QuantumSimulator {
  private numQubits: number;

  constructor(numQubits: number) {
    this.numQubits = numQubits;
  }

  async simulate(gates: Gate[], noise: NoiseConfig): Promise<SimulationResult> {
    const states = Math.pow(2, this.numQubits);
    const sortedGates = [...gates].sort((a, b) => a.time - b.time);

    // Initial state-vector (Ideal)
    // We use a simplified state-vector simulation to track phases for the 'Wave' visualization
    let idealAmplitudes = new Array(states).fill(0).map(() => ({ real: 0, imag: 0 }));
    idealAmplitudes[0] = { real: 1, imag: 0 };

    // Apply gates to ideal state (simplified logic for H, X, CNOT)
    for (const gate of sortedGates) {
      idealAmplitudes = this.applyGate(idealAmplitudes, gate);
    }

    const idealProbs = idealAmplitudes.map(amp => amp.real ** 2 + amp.imag ** 2);
    
    // Apply Noise Model to probabilities
    const noisyDist = this.applyNoiseModel(idealProbs, noise, gates.length);
    const fidelity = this.calculateFidelity(idealProbs, noisyDist);

    return {
      probabilities: this.toDict(idealProbs),
      noisyProbabilities: this.toDict(noisyDist),
      fidelity: fidelity,
      qubitCount: this.numQubits
    };
  }

  private applyGate(amplitudes: {real: number, imag: number}[], gate: Gate) {
    const newAmps = amplitudes.map(a => ({ ...a }));
    const states = amplitudes.length;

    if (gate.type === GateType.X) {
      for (let i = 0; i < states; i++) {
        const mask = 1 << gate.qubit;
        const target = i ^ mask;
        if (i < target) {
          const temp = newAmps[i];
          newAmps[i] = newAmps[target];
          newAmps[target] = temp;
        }
      }
    } else if (gate.type === GateType.H) {
      const invSqrt2 = 1 / Math.sqrt(2);
      const mask = 1 << gate.qubit;
      const processed = new Set<number>();
      for (let i = 0; i < states; i++) {
        if (processed.has(i)) continue;
        const j = i ^ mask;
        const ampI = amplitudes[i];
        const ampJ = amplitudes[j];
        
        // H|0> = (|0>+|1>)/sqrt2, H|1> = (|0>-|1>)/sqrt2
        const isSet = (i & mask) !== 0;
        const low = isSet ? j : i;
        const high = isSet ? i : j;

        newAmps[low] = {
          real: (amplitudes[low].real + amplitudes[high].real) * invSqrt2,
          imag: (amplitudes[low].imag + amplitudes[high].imag) * invSqrt2
        };
        newAmps[high] = {
          real: (amplitudes[low].real - amplitudes[high].real) * invSqrt2,
          imag: (amplitudes[low].imag - amplitudes[high].imag) * invSqrt2
        };
        processed.add(low);
        processed.add(high);
      }
    } else if (gate.type === GateType.CNOT && gate.control !== undefined) {
      const controlMask = 1 << gate.control;
      const targetMask = 1 << gate.qubit;
      for (let i = 0; i < states; i++) {
        if ((i & controlMask) !== 0) {
          const target = i ^ targetMask;
          if (i < target) {
            const temp = newAmps[i];
            newAmps[i] = newAmps[target];
            newAmps[target] = temp;
          }
        }
      }
    }
    return newAmps;
  }

  private applyNoiseModel(ideal: number[], noise: NoiseConfig, gateCount: number): number[] {
    const p = noise.probability;
    const states = ideal.length;
    let result = [...ideal];

    // Cumulative error based on depth
    const totalError = 1 - Math.pow(1 - p, Math.max(1, gateCount));

    if (noise.type === NoiseType.DEPOLARIZING) {
      const uniform = 1 / states;
      result = result.map(val => val * (1 - totalError) + uniform * totalError);
    } else if (noise.type === NoiseType.BIT_FLIP) {
      const flipAmount = totalError * 0.4;
      for (let i = 0; i < states; i++) {
        const flipped = (states - 1) - i;
        result[i] = result[i] * (1 - flipAmount) + result[flipped] * flipAmount;
      }
    } else if (noise.type === NoiseType.AMPLITUDE_DAMPING) {
      // Moves everything towards |0...0>
      const decay = totalError * 0.8;
      result[0] += (1 - result[0]) * decay;
      for (let i = 1; i < states; i++) result[i] *= (1 - decay);
    } else {
      // Generic decoherence
      result = result.map(val => val * (1 - totalError) + (1/states) * totalError);
    }

    const sum = result.reduce((a, b) => a + b, 0);
    return result.map(v => v / (sum || 1));
  }

  private calculateFidelity(ideal: number[], noisy: number[]): number {
    let overlap = 0;
    for (let i = 0; i < ideal.length; i++) {
      overlap += Math.sqrt(ideal[i] * noisy[i]);
    }
    return Math.min(1, overlap * overlap);
  }

  private toDict(probs: number[]): Record<string, number> {
    const dict: Record<string, number> = {};
    const n = this.numQubits;
    probs.forEach((p, i) => {
      const bitstring = i.toString(2).padStart(n, '0');
      dict[bitstring] = p;
    });
    return dict;
  }
}
