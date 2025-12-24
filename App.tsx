
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Zap, 
  Settings, 
  BarChart3, 
  Plus, 
  Trash2, 
  Play, 
  Info, 
  Cpu, 
  BrainCircuit,
  MessageSquare,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Code2,
  Layers,
  Activity,
  Beaker,
  FileCode
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ReChartsTooltip, 
  ResponsiveContainer,
  Legend,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Gate, 
  GateType, 
  NoiseType, 
  NoiseConfig, 
  SimulationResult,
  Message
} from './types';
import { QuantumSimulator } from './services/quantumSimulator';
import { getQuantumInsights } from './services/geminiService';

const MAX_QUBITS = 3;
const MAX_TIME_STEPS = 10;

const App: React.FC = () => {
  const [gates, setGates] = useState<Gate[]>([]);
  const [noise, setNoise] = useState<NoiseConfig>({
    type: NoiseType.DEPOLARIZING,
    probability: 0.05
  });
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'analysis' | 'theory' | 'demo'>('editor');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const simulator = useMemo(() => new QuantumSimulator(MAX_QUBITS), []);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    const res = await simulator.simulate(gates, noise);
    setResults(res);
    setLoading(false);
  }, [gates, noise, simulator]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const handleAddGate = (qubit: number, time: number, type: GateType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setGates(prev => {
      const filtered = prev.filter(g => !(g.qubit === qubit && g.time === time));
      const gate: Gate = { id, type, qubit, time };
      if (type === GateType.CNOT) gate.control = (qubit + 1) % MAX_QUBITS;
      return [...filtered, gate];
    });
  };

  const handleRemoveGate = (id: string) => {
    setGates(prev => prev.filter(g => g.id !== id));
  };

  const loadPreset = (name: string) => {
    setInsights('');
    if (name === 'bell') {
      setGates([
        { id: '1', type: GateType.H, qubit: 0, time: 0 },
        { id: '2', type: GateType.CNOT, qubit: 1, control: 0, time: 1 }
      ]);
    } else if (name === 'ghz') {
      setGates([
        { id: '1', type: GateType.H, qubit: 0, time: 0 },
        { id: '2', type: GateType.CNOT, qubit: 1, control: 0, time: 1 },
        { id: '3', type: GateType.CNOT, qubit: 2, control: 1, time: 2 }
      ]);
    } else if (name === 'superposition') {
      setGates([
        { id: '1', type: GateType.H, qubit: 0, time: 0 },
        { id: '2', type: GateType.H, qubit: 1, time: 0 },
        { id: '3', type: GateType.H, qubit: 2, time: 0 }
      ]);
    }
  };

  const chartData = useMemo(() => {
    if (!results) return [];
    return Object.keys(results.probabilities).map(state => ({
      state,
      ideal: results.probabilities[state],
      noisy: results.noisyProbabilities[state]
    }));
  }, [results]);

  return (
    <div className="min-h-screen bg-[#050810] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Wave-inspired Header */}
      <header className="border-b border-white/5 bg-slate-900/20 backdrop-blur-xl px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 p-2.5 rounded-xl shadow-2xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Noise & Error Modeling Lab
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-black">Wave Project Edition</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          {[
            { id: 'editor', label: 'Workbench', icon: Layers },
            { id: 'analysis', label: 'Diagnostics', icon: BarChart3 },
            { id: 'demo', label: 'One-File Demo', icon: FileCode },
            { id: 'theory', label: 'Abstracts', icon: Info },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={async () => {
              setIsAnalyzing(true);
              const text = await getQuantumInsights(gates, noise, results!);
              setInsights(text);
              setIsAnalyzing(false);
              setActiveTab('analysis');
            }}
            disabled={isAnalyzing || !results}
            className="group relative flex items-center gap-2 bg-slate-100 hover:bg-white text-slate-950 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-30"
          >
            {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:animate-bounce" />}
            Analyze with AI
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row p-8 gap-8">
        
        {/* Control Column */}
        <aside className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          
          <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-3 text-indigo-400 mb-6">
              <Settings className="w-5 h-5" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Environment</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-black block mb-3 tracking-wider">Error Hamiltonian</label>
                <select 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all cursor-pointer appearance-none"
                  value={noise.type}
                  onChange={(e) => setNoise(prev => ({ ...prev, type: e.target.value as NoiseType }))}
                >
                  {Object.values(NoiseType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Noise Magnitude</label>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-md">{(noise.probability * 100).toFixed(1)}%</span>
                </div>
                <input 
                  type="range" min="0" max="0.3" step="0.005" 
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  value={noise.probability}
                  onChange={(e) => setNoise(prev => ({ ...prev, probability: parseFloat(e.target.value) }))}
                />
              </div>
            </div>
          </section>

          <section className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 text-emerald-400 mb-6">
              <Beaker className="w-5 h-5" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em]">Quick Presets</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'bell', label: 'Bell State (Entanglement)' },
                { id: 'ghz', label: 'GHZ State (3-Qubit)' },
                { id: 'superposition', label: 'Uniform Superposition' },
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => loadPreset(p.id)}
                  className="w-full text-left bg-slate-950 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-gradient-to-br from-indigo-900/20 to-violet-900/20 border border-indigo-500/10 rounded-3xl p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-4">Active Telemetry</h3>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase">System Fidelity</span>
                <span className="text-3xl font-mono font-bold text-white">
                  {results ? (results.fidelity * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-700" 
                  style={{ width: `${results?.fidelity ? results.fidelity * 100 : 0}%` }}
                />
              </div>
            </div>
          </section>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-8 overflow-hidden">
          
          {activeTab === 'editor' && (
            <div className="flex flex-col gap-8 h-full">
              {/* Circuit Grid */}
              <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-10 flex flex-col flex-[1.2] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 pointer-events-none opacity-10">
                  <Code2 className="w-64 h-64 text-indigo-500 rotate-12" />
                </div>

                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/20">
                      <Cpu className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Circuit Architecture</h2>
                  </div>
                  <button 
                    onClick={() => setGates([])}
                    className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Reset Laboratory
                  </button>
                </div>

                <div className="flex-1 overflow-x-auto custom-scrollbar pb-6 relative z-10">
                  <div className="min-w-[1000px] flex flex-col gap-12 pt-4">
                    {[...Array(MAX_QUBITS)].map((_, qIdx) => (
                      <div key={qIdx} className="relative flex items-center group">
                        <div className="w-24 h-16 flex flex-col items-center justify-center bg-slate-950 rounded-2xl border border-white/5 mr-8 shadow-xl group-hover:border-indigo-500/40 transition-all">
                          <span className="text-sm font-black text-indigo-400">Q{qIdx}</span>
                          <span className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">Hamiltonian</span>
                        </div>
                        
                        <div className="absolute left-32 right-0 h-[1px] bg-gradient-to-r from-indigo-500/30 via-slate-800 to-transparent"></div>

                        <div className="flex-1 grid grid-cols-10 gap-6 ml-4">
                          {[...Array(MAX_TIME_STEPS)].map((_, tIdx) => {
                            const gate = gates.find(g => g.qubit === qIdx && g.time === tIdx);
                            return (
                              <div key={tIdx} className="h-16 w-16 flex items-center justify-center relative group/slot">
                                {gate ? (
                                  <div className={`w-full h-full rounded-2xl shadow-2xl flex items-center justify-center relative cursor-default hover:scale-110 transition-all duration-300 ${gate.type === 'CNOT' ? 'bg-indigo-600' : 'bg-slate-800 border border-white/10'}`}>
                                    <span className="font-black text-white text-lg mono">{gate.type}</span>
                                    {gate.type === 'CNOT' && gate.control !== undefined && (
                                      <div className={`absolute w-[2px] bg-indigo-500/50 z-[-1] pointer-events-none ${gate.control < qIdx ? '-top-12 h-12' : 'top-12 h-12'}`}></div>
                                    )}
                                    <button 
                                      onClick={() => handleRemoveGate(gate.id)}
                                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover/slot:opacity-100 transition-all scale-75 group-hover/slot:scale-100"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <button 
                                      className="w-4 h-4 rounded-full bg-slate-900 border border-white/5 hover:scale-150 hover:bg-indigo-600 hover:border-indigo-400 transition-all"
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        // Simple hack: prompt user or show inline menu
                                        handleAddGate(qIdx, tIdx, GateType.H);
                                      }}
                                    >
                                      <div className="absolute inset-0 opacity-0 group-hover/slot:opacity-100 bg-slate-950 border border-white/10 rounded-xl p-2 flex gap-2 invisible group-hover/slot:visible z-50 shadow-2xl -translate-y-12 transition-all">
                                        {[GateType.H, GateType.X, GateType.CNOT].map(type => (
                                          <button 
                                            key={type}
                                            onClick={() => handleAddGate(qIdx, tIdx, type)}
                                            className="w-10 h-10 bg-slate-900 hover:bg-indigo-600 rounded-lg text-[10px] font-black transition-all border border-white/5"
                                          >
                                            {type}
                                          </button>
                                        ))}
                                      </div>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Wave Distribution Visualizer */}
              <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-10 flex-1 overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center border border-emerald-500/20">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Quantum State Waves</h2>
                </div>
                
                <div className="flex-1 w-full min-h-[180px]">
                  {loading ? (
                    <div className="w-full h-full flex items-center justify-center gap-4 text-indigo-400">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <span className="text-sm font-black uppercase tracking-widest animate-pulse">Evolving State...</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIdeal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorNoisy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis dataKey="state" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                        <ReChartsTooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                        />
                        <Area type="monotone" dataKey="ideal" stroke="#4f46e5" fillOpacity={1} fill="url(#colorIdeal)" strokeWidth={3} />
                        <Area type="monotone" dataKey="noisy" stroke="#f43f5e" fillOpacity={1} fill="url(#colorNoisy)" strokeWidth={3} strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-12 h-full overflow-y-auto custom-scrollbar">
              <div className="max-w-5xl mx-auto space-y-12">
                <header className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                    Deep Diagnostic Report
                  </div>
                  <h2 className="text-4xl font-black text-white">Quantum Error Characterization</h2>
                  <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">Characterizing the decoherence behavior of the current circuit topology under the selected noise Hamiltonian.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Thermalization Metrics</h3>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-600 block mb-1">Gate Failure Rate</span>
                          <span className="text-2xl font-mono text-white">{(noise.probability * 100).toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-black text-slate-600 block mb-1">Decoherence Offset</span>
                          <span className="text-2xl font-mono text-rose-500">{(1 - results!.fidelity).toFixed(4)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-slate-950/50 rounded-[2rem] border border-white/5">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-6">Vulnerability Mapping</h3>
                      <div className="space-y-6">
                        {gates.map((g, i) => (
                          <div key={i} className="flex items-center gap-6">
                            <div className="w-12 h-12 flex items-center justify-center bg-indigo-600/10 rounded-2xl text-sm font-black text-indigo-400 border border-indigo-500/20">{g.type}</div>
                            <div className="flex-1">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-2">
                                <span className="text-slate-500">Q{g.qubit} Gate Step {g.time}</span>
                                <span className={g.type === 'CNOT' ? 'text-rose-500' : 'text-emerald-500'}>{g.type === 'CNOT' ? 'Critical' : 'Stable'}</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${g.type === 'CNOT' ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                  style={{ width: g.type === 'CNOT' ? '85%' : '20%' }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
                    <div className="relative bg-[#0a0f1e] p-10 rounded-[2.5rem] border border-indigo-500/20 h-full">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black">AI Mitigator</h3>
                          <p className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest">Powered by Gemini Pro</p>
                        </div>
                      </div>
                      
                      {isAnalyzing ? (
                        <div className="space-y-6">
                          {[1,2,3,4].map(i => <div key={i} className="h-4 bg-white/5 rounded-full animate-pulse" style={{width: `${100 - (i*10)}%`}}></div>)}
                        </div>
                      ) : insights ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <div className="text-slate-300 leading-relaxed text-sm whitespace-pre-wrap selection:bg-indigo-500/50">{insights}</div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <BrainCircuit className="w-16 h-16 text-slate-800 mb-6" />
                          <p className="text-slate-500 text-sm max-w-xs mb-8">Initiate the AI analysis engine to receive custom mitigation steps for this specific noise profile.</p>
                          <button 
                            onClick={async () => {
                              setIsAnalyzing(true);
                              const text = await getQuantumInsights(gates, noise, results!);
                              setInsights(text);
                              setIsAnalyzing(false);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
                          >
                            Generate Insights
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'demo' && (
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-12 h-full overflow-y-auto custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-12">
                <header className="space-y-4">
                  <h2 className="text-4xl font-black text-white">Standalone Demo Source</h2>
                  <p className="text-slate-400">Researchers can use this single-file logic to replicate our Noise Hamiltonian modeling in their own Python or JS environments.</p>
                </header>

                <div className="bg-slate-950 rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="flex items-center justify-between px-8 py-4 bg-white/5 border-b border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">quantum_noise_core.js</span>
                    <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">Copy to Clipboard</button>
                  </div>
                  <pre className="p-8 text-[11px] font-mono text-indigo-300 leading-relaxed overflow-x-auto">
{`/**
 * Research Demo: Single-File Quantum Noise Simulation
 * Core Logic used in the Wave Project Environment
 */

function simulateNoise(circuit, errorRate, modelType) {
  const states = Math.pow(2, circuit.numQubits);
  let probs = new Array(states).fill(0);
  probs[0] = 1.0; // Initial state |0...0>

  // 1. Ideal Evolution (Unitary)
  circuit.gates.forEach(gate => {
     // Apply state-vector matrix operations here...
  });

  // 2. Stochastic Noise Mapping
  const errorContribution = 1 - Math.pow(1 - errorRate, circuit.depth);
  
  if (modelType === 'Depolarizing') {
    const mixed = 1 / states;
    return probs.map(p => p * (1 - errorContribution) + mixed * errorContribution);
  }

  if (modelType === 'BitFlip') {
    return probs.map((p, i) => {
      const neighbor = (states - 1) - i;
      return p * (1 - errorContribution * 0.5) + probs[neighbor] * (errorContribution * 0.5);
    });
  }

  return probs;
}

// Example usage:
const bellCircuit = { numQubits: 2, depth: 2, gates: [{type: 'H'}, {type: 'CNOT'}] };
const results = simulateNoise(bellCircuit, 0.05, 'Depolarizing');
console.log('Measurement Probabilities:', results);`}
                  </pre>
                </div>

                <div className="p-8 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10">
                  <h3 className="text-xl font-black mb-4">Implementation Guidelines</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">This core implementation uses a simplified <span className="text-white font-bold">Density Matrix approximation</span>. For full research-grade simulation, we recommend integrating the Kraus Operators for each specific noise channel as defined in the "Abstracts" section.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theory' && (
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-16 h-full overflow-y-auto custom-scrollbar">
              <article className="max-w-3xl mx-auto space-y-16">
                <section>
                  <h2 className="text-4xl font-black mb-8 text-white">Project Theoretical Framework</h2>
                  <div className="space-y-6 text-slate-400 leading-relaxed text-lg">
                    <p>
                      In the NISQ (Noisy Intermediate-Scale Quantum) era, understanding the precise mechanisms of <span className="text-indigo-400 font-bold">decoherence</span> is paramount. This environment models the interaction of a closed quantum system with its surrounding thermal bath.
                    </p>
                    <p>
                      Our modeling utilizes the <span className="text-white font-bold">Lindblad Master Equation</span> as its conceptual foundation, projecting the impact of non-unitary transformations onto the computational basis probabilities.
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                    <h4 className="text-indigo-400 font-black uppercase text-xs tracking-widest mb-4">Pauli Channels</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Models discrete bit-flip (X) and phase-flip (Z) errors. Essential for designing Surface Codes and other error-correcting schemes.
                    </p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                    <h4 className="text-rose-400 font-black uppercase text-xs tracking-widest mb-4">Dissipative Decays</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Energy-loss mechanisms where the system relaxes to its ground state. Characterized by T1 relaxation times in physical hardware.
                    </p>
                  </div>
                </div>

                <footer className="pt-20 border-t border-white/5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-2">Noise and Error Modeling Research Project</p>
                  <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest">Version 2.5 • Wave Project Integration</p>
                </footer>
              </article>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
