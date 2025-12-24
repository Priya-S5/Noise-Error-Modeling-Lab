
export enum GateType {
  H = 'H',
  X = 'X',
  Y = 'Y',
  Z = 'Z',
  CNOT = 'CNOT',
  I = 'I'
}

export enum NoiseType {
  DEPOLARIZING = 'Depolarizing',
  AMPLITUDE_DAMPING = 'Amplitude Damping',
  PHASE_DAMPING = 'Phase Damping',
  BIT_FLIP = 'Bit Flip',
  PHASE_FLIP = 'Phase Flip'
}

export interface Gate {
  id: string;
  type: GateType;
  qubit: number;
  control?: number; // For CNOT
  time: number;
}

export interface SimulationResult {
  probabilities: Record<string, number>;
  noisyProbabilities: Record<string, number>;
  fidelity: number;
  qubitCount: number;
}

export interface NoiseConfig {
  type: NoiseType;
  probability: number; // 0 to 1
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
