
import React, { useEffect, useState, useRef } from 'react';
import { PracticeWord, VowelData } from '../types';

interface TickerProps {
  words: PracticeWord[];
  speed: number;
  isRunning: boolean;
  onVowelHighlight: (vowel?: VowelData) => void;
  clearedWordIndex: number | null;
  onMiss: (index: number) => void;
}

const Ticker: React.FC<TickerProps> = ({ words, speed, isRunning, onVowelHighlight, clearedWordIndex, onMiss }) => {
  const [offset, setOffset] = useState(0);
  const [clearedGlobalIndices, setClearedGlobalIndices] = useState<Set<number>>(new Set());
  const [reportedMisses, setReportedMisses] = useState<Set<number>>(new Set());
  
  const markerX = 150; 
  const wordWidth = 300;
  const loopWidth = (words.length || 1) * wordWidth;

  // Track the last cleared index to prevent multiple triggers for the same hit
  const lastClearedRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset when word set changes (e.g., level change)
    setClearedGlobalIndices(new Set());
    setReportedMisses(new Set());
    setOffset(0);
    lastClearedRef.current = null;
  }, [words]);

  useEffect(() => {
    if (!isRunning) return;
    let animationId: number;
    const animate = () => {
      setOffset((prev) => prev + speed);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [speed, isRunning]);

  // Logic for highlighting and missing
  useEffect(() => {
    if (words.length === 0) return;
    
    // Calculate which word is currently at the marker
    const currentGlobalIndex = Math.floor((offset + markerX) / wordWidth);
    const relativeIndex = ((currentGlobalIndex % words.length) + words.length) % words.length;
    const word = words[relativeIndex];

    // Check for misses: if a word index passes the marker without being cleared
    const pastMarkerIndex = Math.floor((offset + markerX - 80) / wordWidth);
    if (pastMarkerIndex < currentGlobalIndex && !clearedGlobalIndices.has(pastMarkerIndex) && !reportedMisses.has(pastMarkerIndex)) {
      onMiss(((pastMarkerIndex % words.length) + words.length) % words.length);
      setReportedMisses(prev => new Set(prev).add(pastMarkerIndex));
    }

    // Highlight target vowel if word is at marker and not yet cleared
    if (word && word.vowels.length > 0 && !clearedGlobalIndices.has(currentGlobalIndex)) {
      onVowelHighlight(word.vowels[0]);
    } else {
      onVowelHighlight(undefined);
    }
  }, [offset, words, onVowelHighlight, clearedGlobalIndices, reportedMisses, onMiss, wordWidth]);

  // Logic for clearing (destroying) a word on hit
  useEffect(() => {
    if (clearedWordIndex !== null && words.length > 0) {
      const currentGlobalIndex = Math.floor((offset + markerX) / wordWidth);
      const relativeIndex = ((currentGlobalIndex % words.length) + words.length) % words.length;
      
      if (relativeIndex === clearedWordIndex && !clearedGlobalIndices.has(currentGlobalIndex)) {
        setClearedGlobalIndices(prev => new Set(prev).add(currentGlobalIndex));
      }
    }
  }, [clearedWordIndex, offset, words.length, wordWidth, clearedGlobalIndices]);

  return (
    <div className="relative h-64 bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700 shadow-inner group">
      <style>{`
        @keyframes word-shatter {
          0% { transform: scale(1) rotate(0deg); opacity: 1; filter: brightness(1) blur(0px); }
          20% { transform: scale(1.2) rotate(2deg); filter: brightness(2); }
          100% { transform: scale(0) rotate(15deg); opacity: 0; filter: brightness(5) blur(10px); }
        }
        .animate-shatter {
          animation: word-shatter 0.6s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;
          pointer-events: none;
        }
      `}</style>

      {/* Target Marker Line */}
      <div className="absolute left-[150px] top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 via-sky-500 to-amber-500 shadow-[0_0_20px_rgba(56,189,248,0.6)] z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-500 rounded-full blur-sm opacity-50 animate-pulse" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-500 rounded-full blur-sm opacity-50 animate-pulse" />
      </div>
      
      {/* Moving Word Strip */}
      <div 
        className="absolute flex items-center h-full whitespace-nowrap will-change-transform"
        style={{ transform: `translateX(${-offset % (loopWidth || 1)}px)` }}
      >
        {/* Render three sets for smooth infinite looping */}
        {[0, 1, 2].map(loop => (
          <React.Fragment key={`loop-${loop}`}>
            {words.map((word, wordIdx) => {
              const globalIdx = loop * words.length + wordIdx;
              const isCleared = clearedGlobalIndices.has(globalIdx);
              
              return (
                <div 
                  key={`${word.text}-${globalIdx}`} 
                  className={`flex flex-col items-center justify-center min-w-[300px] transition-opacity duration-500 ${isCleared ? 'animate-shatter' : 'opacity-100'}`}
                >
                  <span className="text-xl font-mono text-amber-500/80 mb-1 tracking-wider">/{word.phonetic}/</span>
                  <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg mb-2">{word.text}</span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">{word.intonation}</span>
                    <span className="text-xl bg-slate-700/80 backdrop-blur-md px-4 py-1.5 rounded-2xl text-slate-200 border border-white/10 shadow-xl">
                      {word.whatsUp}
                    </span>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-around">
        <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-sky-500/20 to-transparent" />
      </div>
    </div>
  );
};

export default Ticker;
