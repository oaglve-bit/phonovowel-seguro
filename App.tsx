
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CEFRLevel, PracticeWord, VowelData, ScoreEntry, Gender, AgeGroup } from './types';
import { CEFR_DESCRIPTIONS, AMERICAN_VOWELS } from './constants';
import { getPracticeWords } from './services/geminiService';
import VowelMap from './components/VowelMap';
import Ticker from './components/Ticker';

const App: React.FC = () => {
  const [level, setLevel] = useState<CEFRLevel>(CEFRLevel.A1);
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<AgeGroup>('adult');
  const [words, setWords] = useState<PracticeWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [activeVowel, setActiveVowel] = useState<VowelData | undefined>();
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isExerciseRunning, setIsExerciseRunning] = useState(true);
  const [isHit, setIsHit] = useState(false);
  
  // Filtering state
  const [selectedPhonemes, setSelectedPhonemes] = useState<Set<string>>(new Set());
  
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);
  const [f1, setF1] = useState(0);
  const [f2, setF2] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | undefined>(undefined);
  const streamRef = useRef<MediaStream | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Calibrated to the provided IPA chart reference: F1 [150-950], F2 [600-2500]
  const baseRange = { minF1: 150, maxF1: 950, minF2: 600, maxF2: 2500 };
  
  const scaleFactor = useMemo(() => {
    let factor = 1.0;
    if (gender === 'female') factor *= 1.15;
    if (age === 'child') factor *= 1.55;
    return factor;
  }, [gender, age]);

  const userRange = useMemo(() => ({
    minF1: baseRange.minF1 * scaleFactor,
    maxF1: baseRange.maxF1 * scaleFactor,
    minF2: baseRange.minF2 * scaleFactor,
    maxF2: baseRange.maxF2 * scaleFactor,
  }), [scaleFactor]);

  const loadWords = async (lvl: CEFRLevel, phonemes: string[] = []) => {
    setLoading(true);
    try {
      const result = await getPracticeWords(lvl, phonemes);
      setWords(result.length > 0 ? result : [
        { text: "About", phonetic: "əbaʊt", whatsUp: "😑 b [😍😘] t", intonation: "━ (BOUT) ━", vowels: [{ ipa: 'ə', example: 'about', f1: 520, f2: 1550, widthF1: 250, widthF2: 450 }] },
        { text: "Bat", phonetic: "bæt", whatsUp: "b [😀+🤒] t", intonation: "━ (BAT) ━", vowels: [{ ipa: 'æ', example: 'bat', f1: 750, f2: 1850, widthF1: 280, widthF2: 550 }] },
        { text: "Beet", phonetic: "biːt", whatsUp: "b ii t", intonation: "━ (BEE) ━", vowels: [{ ipa: 'i', example: 'beet', f1: 300, f2: 2400, widthF1: 80, widthF2: 350 }] }
      ]);
    } catch (e) {
      console.error("Failed to load words", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      loadWords(level, Array.from(selectedPhonemes));
    }, 1200);

    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [level, selectedPhonemes]);

  const togglePhoneme = (ipa: string) => {
    setSelectedPhonemes(prev => {
      const next = new Set(prev);
      if (next.has(ipa)) next.delete(ipa);
      else next.add(ipa);
      return next;
    });
  };

  const levelPhonemes = useMemo(() => {
    const set = new Set<string>();
    words.forEach(w => w.vowels.forEach(v => set.add(v.ipa)));
    return Array.from(set);
  }, [words]);

  const handleMiss = useCallback((index: number) => {
    const word = words[index];
    if (word) {
      setScoreHistory(prev => [{ word: word.text, status: 'miss' as const, timestamp: Date.now() }, ...prev].slice(0, 50));
    }
  }, [words]);

  useEffect(() => {
    if (isHit && activeVowel) {
      const activeWord = words.find(w => w.vowels.some(v => v.ipa === activeVowel.ipa));
      if (activeWord) {
        setScoreHistory(prev => {
          const last = prev[0];
          if (last && last.word === activeWord.text && last.status === 'hit' && Date.now() - last.timestamp < 1000) return prev;
          return [{ word: activeWord.text, status: 'hit' as const, timestamp: Date.now() }, ...prev].slice(0, 50);
        });
      }
    }
  }, [isHit, activeVowel, words]);

  useEffect(() => {
    if (!isMicEnabled || !activeVowel || f1 === 0 || !isExerciseRunning) {
      setIsHit(false);
      return;
    }
    const h = activeVowel.f2 * scaleFactor; 
    const k = activeVowel.f1 * scaleFactor; 
    const a = ((activeVowel.widthF2 || 400) * scaleFactor) / 2; 
    const b = ((activeVowel.widthF1 || 300) * scaleFactor) / 2; 
    const dist = Math.pow(f2 - h, 2) / Math.pow(a, 2) + Math.pow(f1 - k, 2) / Math.pow(b, 2);
    setIsHit(dist <= 1.4);
  }, [f1, f2, activeVowel, isMicEnabled, isExerciseRunning, scaleFactor]);

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.15;
      source.connect(analyserRef.current);
      setIsMicEnabled(true);
      
      const process = () => {
        if (!analyserRef.current) return;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        const hzPerBin = (audioContextRef.current!.sampleRate / 2) / bufferLength;

        const findPeak = (min: number, max: number, prev?: number) => {
          let mV = 0, pI = -1;
          const sB = Math.floor(min / hzPerBin), eB = Math.floor(max / hzPerBin);
          for (let i = sB; i < eB; i++) {
            if (prev && i * hzPerBin < prev + (200 * scaleFactor)) continue;
            if (dataArray[i] > mV && dataArray[i] > dataArray[i-1] && dataArray[i] > dataArray[i+1]) { mV = dataArray[i]; pI = i; }
          }
          if (mV < 80) return 0;
          let sF = 0, sW = 0;
          for (let i = pI - 2; i <= pI + 2; i++) {
            const w = Math.pow(dataArray[i] || 0, 4);
            sF += (i * hzPerBin) * w; sW += w;
          }
          return sF / sW;
        };

        const dF1 = findPeak(200 * scaleFactor, 1000 * scaleFactor);
        if (dF1 > 0) {
          const dF2 = findPeak(Math.max(600 * scaleFactor, dF1 + (300 * scaleFactor)), 3000 * scaleFactor, dF1);
          if (dF2 > 0) { setF1(dF1); setF2(dF2); }
        } else { setF1(0); setF2(0); }
        rafIdRef.current = requestAnimationFrame(process);
      };
      process();
    } catch (err) { console.error("Mic access denied", err); }
  };

  const groupedVowels = useMemo(() => {
    const all = Object.values(AMERICAN_VOWELS);
    return {
      high: all.filter(v => v.f1 <= 420 && !v.trajectory),
      mid: all.filter(v => v.f1 > 420 && v.f1 <= 650 && !v.trajectory),
      low: all.filter(v => v.f1 > 650 && !v.trajectory),
      diphthongs: all.filter(v => v.trajectory)
    };
  }, []);

  const renderVowelButton = (v: VowelData) => {
    const isAvailable = levelPhonemes.includes(v.ipa);
    const isSelected = selectedPhonemes.has(v.ipa);
    return (
      <button
        key={v.ipa}
        onClick={() => togglePhoneme(v.ipa)}
        title={v.example}
        className={`
          flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-200
          ${isSelected 
            ? 'bg-sky-500 border-sky-400 text-slate-950 scale-105 shadow-[0_0_12px_rgba(14,165,233,0.4)]' 
            : isAvailable 
              ? 'bg-slate-800/60 border-white/5 text-slate-300 hover:border-sky-500/50 hover:bg-slate-800' 
              : 'bg-slate-900/40 border-transparent text-slate-600 opacity-40 hover:opacity-60'
          }
        `}
      >
        <span className="text-sm font-bold font-mono leading-none">{v.ipa}</span>
        <span className="text-[6px] font-black uppercase mt-0.5 truncate w-full text-center">{v.example}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30">
      <header className="border-b border-white/5 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-sky-900/20 -rotate-2">P</div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">PhonoVowel <span className="text-sky-400">Pro</span></h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Advanced Dispersion Mapping</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-2xl border border-white/5">
              {Object.values(CEFRLevel).map(lvl => <button key={lvl} onClick={() => setLevel(lvl)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${level === lvl ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20' : 'text-slate-500 hover:text-slate-200'}`}>{lvl}</button>)}
            </div>
            <div className="flex justify-center gap-4">
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5">
                {['male', 'female'].map(g => <button key={g} onClick={() => setGender(g as any)} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${gender === g ? 'bg-indigo-500 text-white' : 'text-slate-500'}`}>{g}</button>)}
              </div>
              <div className="flex bg-slate-800/50 p-1 rounded-lg border border-white/5">
                {['adult', 'child'].map(a => <button key={a} onClick={() => setAge(a as any)} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${age === a ? 'bg-indigo-500 text-white' : 'text-slate-500'}`}>{a}</button>)}
              </div>
            </div>
          </div>
          <div className="bg-slate-900/50 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-4">
            <span className="text-[8px] font-black text-slate-600 uppercase">Dynamics</span>
            <div className="flex items-center gap-2 bg-slate-950/50 p-1 rounded-lg">
              <button onClick={() => setSpeed(Math.max(1, speed - 1))} className="text-sky-500 font-black px-2">-</button>
              <span className="text-[9px] font-black w-14 text-center">{speed}X SPEED</span>
              <button onClick={() => setSpeed(Math.min(10, speed + 1))} className="text-sky-500 font-black px-2">+</button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-10 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <div className="flex flex-col gap-4">
              {/* ACCURATE BIOMETRIC FEED CONTAINER (Matched to screenshot) */}
              <div className="bg-[#050b18] p-8 md:p-12 rounded-[50px] border border-white/5 shadow-[0_0_60px_rgba(0,0,0,0.6)] flex flex-col min-h-[180px]">
                <div className="flex items-center gap-3 mb-8 px-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isMicEnabled ? 'bg-sky-500 animate-pulse shadow-[0_0_10px_#0ea5e9]' : 'bg-slate-800'}`}></div>
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Biometric Feed</h4>
                </div>
                
                {!isMicEnabled ? (
                  <button 
                    onClick={startMicrophone} 
                    className="w-full bg-white text-slate-950 font-black py-6 rounded-full hover:bg-slate-100 transition-all uppercase tracking-[0.1em] text-[15px] shadow-[0_10px_40px_rgba(255,255,255,0.05)] active:scale-95 flex items-center justify-center font-sans"
                  >
                    Activate Voice Interface
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-6 w-full mt-auto">
                    <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                      <span className="text-[9px] font-black text-slate-600 uppercase mb-2 tracking-widest">F1 Resonance</span>
                      <span className="text-4xl font-mono text-white font-black tracking-tighter">{Math.round(f1)}<span className="text-[14px] opacity-20 ml-1 font-sans">Hz</span></span>
                    </div>
                    <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                      <span className="text-[9px] font-black text-slate-600 uppercase mb-2 tracking-widest">F2 Advancement</span>
                      <span className="text-4xl font-mono text-white font-black tracking-tighter">{Math.round(f2)}<span className="text-[14px] opacity-20 ml-1 font-sans">Hz</span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <VowelMap currentF1={f1} currentF2={f2} activeVowel={activeVowel} isHit={isHit} userRange={userRange} />

            <div className="bg-slate-900/60 p-6 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Target Array Filter</h4>
                <button 
                  onClick={() => setSelectedPhonemes(new Set())}
                  className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${selectedPhonemes.size === 0 ? 'bg-sky-500 text-slate-950' : 'text-sky-400 border border-sky-400/20'}`}
                >
                  All Sounds
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-[8px] font-black text-slate-600 uppercase mb-2 tracking-widest px-1">High / Closed</h5>
                  <div className="grid grid-cols-5 gap-2">
                    {groupedVowels.high.map(renderVowelButton)}
                  </div>
                </div>
                <div>
                  <h5 className="text-[8px] font-black text-slate-600 uppercase mb-2 tracking-widest px-1">Mid Range</h5>
                  <div className="grid grid-cols-5 gap-2">
                    {groupedVowels.mid.map(renderVowelButton)}
                  </div>
                </div>
                <div>
                  <h5 className="text-[8px] font-black text-slate-600 uppercase mb-2 tracking-widest px-1">Low / Open</h5>
                  <div className="grid grid-cols-5 gap-2">
                    {groupedVowels.low.map(renderVowelButton)}
                  </div>
                </div>
                {groupedVowels.diphthongs.length > 0 && (
                  <div>
                    <h5 className="text-[8px] font-black text-slate-600 uppercase mb-2 tracking-widest px-1">Diphthongs</h5>
                    <div className="grid grid-cols-5 gap-2">
                      {groupedVowels.diphthongs.map(renderVowelButton)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-10">
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-[48px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] p-12 relative overflow-hidden">
              <div className="flex items-center justify-between mb-12">
                <div>
                   <h3 className="text-3xl font-black text-white italic tracking-tighter">Practicum Console</h3>
                   <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2">Vowel Accuracy Tracker</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => loadWords(level, Array.from(selectedPhonemes))}
                    className="group px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-3"
                  >
                    <span className="group-hover:rotate-180 transition-transform duration-500 inline-block">🔄</span>
                    Regenerate
                  </button>
                  <button 
                    onClick={() => setIsExerciseRunning(!isExerciseRunning)} 
                    className={`px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl ${isExerciseRunning ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-sky-500 text-slate-950 shadow-sky-500/40'}`}
                  >
                    {isExerciseRunning ? "Halt Training" : "Deploy Simulation"}
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div className="h-80 flex flex-col items-center justify-center gap-6 animate-pulse">
                  <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-600">Syncing with AI Array</span>
                </div>
              ) : (
                <Ticker 
                  words={words} 
                  speed={speed} 
                  isRunning={isExerciseRunning} 
                  onVowelHighlight={(v) => setActiveVowel(v)} 
                  clearedWordIndex={isHit && activeVowel ? words.findIndex(w => w.vowels.some(v => v.ipa === activeVowel.ipa)) : null} 
                  onMiss={handleMiss} 
                />
              )}
              <div className="mt-8 flex justify-center">
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 opacity-60 text-center">
                  {words.length === 0 ? "Array Empty - Please broaden filter criteria" : (isExerciseRunning ? "Simulation Active - Tracking AI Generated Array" : "Training Paused - Word Breaking Active")}
                </p>
              </div>
            </div>

            <div className="bg-slate-900/40 backdrop-blur-sm p-10 rounded-[40px] border border-white/5 h-[380px] flex flex-col shadow-inner overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Session Event Ledger</h4>
                <div className="flex gap-10">
                  <div className="flex flex-col items-center">
                    <span className="text-emerald-400 font-black text-3xl">{scoreHistory.filter(s => s.status === 'hit').length}</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Hits</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-rose-500 font-black text-3xl">{scoreHistory.filter(s => s.status === 'miss').length}</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">Misses</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
                {scoreHistory.map((entry, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${entry.status === 'hit' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${entry.status === 'hit' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_10px_currentColor]`}></div>
                      <span className="font-black text-sm text-white tracking-widest uppercase">{entry.word}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg ${entry.status === 'hit' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500/20 text-rose-500'}`}>{entry.status}</span>
                      <span className="text-[10px] font-mono text-slate-600">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER SECTION - RESTORED & CUSTOMIZED */}
      <footer className="mt-auto pb-16 pt-10 px-6 border-t border-white/5 bg-[#050b18]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
          <h2 className="text-[12px] md:text-[14px] font-black text-slate-600 uppercase tracking-[0.8em] mb-4">
            Acoustic Dispersion Visualization System V5.4
          </h2>
          <div className="flex flex-col items-center gap-1">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-1">
               Created and designed by Oswaldo A. González L. (Vzl⭐)
             </p>
             <span className="text-[9px] font-mono text-slate-700 tracking-widest mt-2">PLATFORM STABILITY: OPTIMAL // SECURE CONNECTION ESTABLISHED</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
