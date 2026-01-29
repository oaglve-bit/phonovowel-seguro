
import React, { useMemo, useState, useEffect } from 'react';
import { AMERICAN_VOWELS } from '../constants';
import { VowelData } from '../types';

interface VowelMapProps {
  currentF1: number;
  currentF2: number;
  activeVowel?: VowelData;
  isHit: boolean;
  userRange: { minF1: number; maxF1: number; minF2: number; maxF2: number };
}

const VowelMap: React.FC<VowelMapProps> = ({ currentF1, currentF2, activeVowel, isHit, userRange }) => {
  const padding = 50;
  const width = 600;
  const height = 450;

  // We map the phonetic chart: F2 on X (High left, Low right), F1 on Y (Low top, High bottom)
  const f2Range = [userRange.maxF2, userRange.minF2]; 
  const f1Range = [userRange.minF1, userRange.maxF1];
  
  // Coordinate helpers
  const getX = (f2: number) => padding + ((f2 - f2Range[0]) / (f2Range[1] - f2Range[0])) * (width - 2 * padding);
  const getY = (f1: number) => padding + ((f1 - f1Range[0]) / (f1Range[1] - f1Range[0])) * (height - 2 * padding);

  // Filter to keep only "pure" sounds (monophthongs and semi-vowels), excluding diphthongs with trajectories
  const pureVowels = useMemo(() => Object.values(AMERICAN_VOWELS).filter(v => !v.trajectory), []);

  // Persistence trail for the red dot
  const [trail, setTrail] = useState<{x: number, y: number}[]>([]);
  useEffect(() => {
    if (currentF1 > 0) {
      const nx = getX(currentF2);
      const ny = getY(currentF1);
      setTrail(prev => [{x: nx, y: ny}, ...prev].slice(0, 5));
    } else {
      setTrail([]);
    }
  }, [currentF1, currentF2]);

  return (
    <div className="relative bg-slate-900/90 rounded-[40px] border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.4)] p-8 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h3 className="text-white font-black uppercase tracking-[0.4em] text-[11px]">Vowel Dispersion Fields (VFD)</h3>
          <span className="text-[9px] text-slate-500 font-mono mt-1">Dynamic Normalization Scaling Active</span>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isHit ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
          {isHit ? "Acoustic Lock" : "Scanning Spectrum..."}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-2xl font-mono">
        <defs>
          <filter id="cursorGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* AXIS LABELS & GRID */}
        {[200, 400, 600, 800, 950].map(f1 => (
          <g key={`f1-${f1}`}>
            <line x1={padding} y1={getY(f1)} x2={width - padding} y2={getY(f1)} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={padding - 10} y={getY(f1)} fill="#475569" fontSize="10" textAnchor="end" dominantBaseline="middle">{f1}</text>
          </g>
        ))}
        <text x={padding - 40} y={height / 2} fill="#475569" fontSize="11" fontWeight="bold" transform={`rotate(-90, ${padding-40}, ${height/2})`} textAnchor="middle">F1 (Hz)</text>

        {[2500, 2250, 2000, 1750, 1500, 1250, 1000, 750].map(f2 => (
          <g key={`f2-${f2}`}>
            <line x1={getX(f2)} y1={padding} x2={getX(f2)} y2={height - padding} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={getX(f2)} y={height - padding + 20} fill="#475569" fontSize="10" textAnchor="middle">{f2}</text>
          </g>
        ))}
        <text x={width / 2} y={height - 10} fill="#475569" fontSize="11" fontWeight="bold" textAnchor="middle">F2 (Hz)</text>

        {/* IPA TRAPEZOID FRAME */}
        <path 
          d={`M ${getX(2400)} ${getY(300)} L ${getX(800)} ${getY(300)} L ${getX(800)} ${getY(850)} L ${getX(1650)} ${getY(850)} Z`}
          fill="none" 
          stroke="#334155" 
          strokeWidth="1.5" 
          className="opacity-50"
        />
        <text x={width/2} y={padding - 20} fill="#64748b" fontSize="12" fontWeight="black" textAnchor="middle" className="uppercase tracking-[0.2em]">International Phonetic Alphabet</text>

        {/* VOWEL DISPERSION FIELDS (Pure Monophthongs + Semi-vowels only) */}
        {pureVowels.map((v, i) => {
          const isActive = activeVowel?.ipa === v.ipa;
          const rx = (v.widthF2 || 150) / (f2Range[0] - f2Range[1]) * (width - 2 * padding) / 2;
          const ry = (v.widthF1 || 100) / (f1Range[1] - f1Range[0]) * (height - 2 * padding) / 2;

          return (
            <g key={`${v.ipa}-${i}`} className="transition-all duration-300">
              <ellipse
                cx={getX(v.f2)}
                cy={getY(v.f1)}
                rx={Math.abs(rx)}
                ry={Math.abs(ry)}
                fill={isActive ? (isHit ? "rgba(16, 185, 129, 0.15)" : "rgba(14, 165, 233, 0.1)") : "rgba(30, 41, 59, 0.2)"}
                stroke={isActive ? (isHit ? "#10b981" : "#0ea5e9") : "#1e293b"}
                strokeWidth={isActive ? 2 : 0.8}
                className="transition-all duration-500"
              />
              <text
                x={getX(v.f2)}
                y={getY(v.f1)}
                fill={isActive ? (isHit ? "#10b981" : "#38bdf8") : "#475569"}
                fontSize={isActive ? "22" : "14"}
                fontWeight={isActive ? "900" : "500"}
                textAnchor="middle"
                dominantBaseline="middle"
                className="transition-all duration-300 pointer-events-none select-none"
              >
                {v.ipa}
              </text>
            </g>
          );
        })}

        {/* FREQUENCY CURSOR & TRAIL */}
        {currentF1 > 0 && (
          <g filter="url(#cursorGlow)">
            {trail.map((pt, i) => (
              <circle 
                key={i} 
                cx={pt.x} 
                cy={pt.y} 
                r={12 - i * 2} 
                fill="#f43f5e" 
                opacity={0.4 - i * 0.08} 
              />
            ))}
            <circle cx={getX(currentF2)} cy={getY(currentF1)} r="12" fill="#f43f5e" />
            <circle cx={getX(currentF2)} cy={getY(currentF1)} r="18" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.6">
              <animate attributeName="r" values="12;24;12" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>
      
      {/* Legend */}
      <div className="mt-8 flex justify-center gap-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded-sm bg-sky-500/20 border border-sky-500"></div> Dispersion Ellipse
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-[1px] border-b border-dashed border-slate-600"></div> Grid Reference
        </div>
      </div>
    </div>
  );
};

export default VowelMap;
