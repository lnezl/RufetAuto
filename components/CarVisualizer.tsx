
import React, { useState } from 'react';
import { CarSystem } from '../types';
import { AlertCircle, Shield } from 'lucide-react';

interface Props {
  errorStats: Partial<Record<CarSystem, number>>;
  onSelectSystem?: (system: CarSystem) => void;
  accentColor?: string;
  isClearing?: boolean;
  systemLabels?: Record<CarSystem, string>;
  vehicleModel?: string;
}

export const CarVisualizer: React.FC<Props> = ({ 
  errorStats, 
  onSelectSystem, 
  accentColor = '#ef4444', 
  isClearing,
  systemLabels,
  vehicleModel = 'sedan'
}) => {
  const [hoveredSystem, setHoveredSystem] = useState<CarSystem | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const isSystemActive = (sys: CarSystem) => (errorStats[sys] || 0) > 0;

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getStyle = (sys: CarSystem) => {
    const active = !isClearing && isSystemActive(sys);
    const hovered = hoveredSystem === sys;
    
    return {
      fill: active 
        ? (hovered ? hexToRgba(accentColor, 0.7) : hexToRgba(accentColor, 0.45)) 
        : (hovered ? 'rgba(63, 63, 70, 0.5)' : 'rgba(39, 39, 42, 0.3)'),
      stroke: active 
        ? (hovered ? '#ffffff' : accentColor) 
        : (hovered ? '#71717a' : '#27272a'),
      strokeWidth: active ? (hovered ? '3' : '2') : '1.5',
      filter: active && hovered ? 'url(#activeGlow)' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  const getLabel = (sys: CarSystem) => {
    return systemLabels ? systemLabels[sys] : sys;
  };

  // Determine body type from model name
  const modelLower = vehicleModel.toLowerCase();
  let bodyType: 'suv' | 'sedan' | 'wagon' = 'sedan';
  if (modelLower.includes('x5') || modelLower.includes('x3') || modelLower.includes('q7') || modelLower.includes('suv') || modelLower.includes('jeep')) bodyType = 'suv';
  else if (modelLower.includes('touring') || modelLower.includes('avant') || modelLower.includes('wagon') || modelLower.includes('estate')) bodyType = 'wagon';

  const bodyPaths = {
    sedan: "M40 300 L100 300 Q130 220 220 220 Q310 220 340 300 L660 300 Q690 220 780 220 Q870 220 900 300 L960 300 L965 260 Q965 240 940 220 L840 160 L750 145 Q740 145 720 120 L650 100 Q550 80 400 80 L220 100 Q120 130 60 210 L45 250 Z",
    suv: "M40 300 L100 300 Q130 220 220 220 Q310 220 340 300 L660 300 Q690 220 780 220 Q870 220 900 300 L960 300 L965 240 Q965 200 900 180 L880 100 Q850 60 700 60 L300 65 Q180 80 100 130 L45 220 Z",
    wagon: "M40 300 L100 300 Q130 220 220 220 Q310 220 340 300 L660 300 Q690 220 780 220 Q870 220 900 300 L960 300 L965 240 Q965 200 930 140 L900 90 Q850 70 750 75 L300 80 Q150 100 80 150 L45 220 Z"
  };

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto aspect-[21/9] flex items-center justify-center p-4 bg-white/5 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-visible group/container"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredSystem(null)}
    >
      {/* Tooltip */}
      {hoveredSystem && !isClearing && (
        <div 
          className="fixed pointer-events-none z-[100] px-4 py-2 bg-zinc-950/90 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3"
          style={{ 
            left: mousePos.x + 20, 
            top: mousePos.y + 20,
            position: 'absolute'
          }}
        >
          <div 
            className={`p-1.5 rounded-lg`}
            style={{ 
              backgroundColor: isSystemActive(hoveredSystem) ? hexToRgba(accentColor, 0.2) : 'rgba(39, 39, 42, 0.5)',
              color: isSystemActive(hoveredSystem) ? accentColor : '#71717a'
            }}
          >
            {hoveredSystem === CarSystem.AIRBAGS ? <Shield className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">{getLabel(hoveredSystem)}</p>
            <p className="text-sm font-bold text-white">
              {isSystemActive(hoveredSystem) 
                ? `${errorStats[hoveredSystem]} errors`
                : 'System normal'}
            </p>
          </div>
        </div>
      )}

      <svg
        viewBox="0 0 1000 400"
        className="w-full h-full drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#18181b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#27272a" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Dynamic Vehicle Silhouette */}
        <path
          d={bodyPaths[bodyType]}
          fill="url(#bodyGradient)"
          stroke="#27272a"
          strokeWidth="3"
        />

        {/* Realistic Engine */}
        <g 
          className="cursor-pointer"
          onMouseEnter={() => setHoveredSystem(CarSystem.ENGINE)}
          onClick={() => onSelectSystem?.(CarSystem.ENGINE)}
        >
          <path
            d="M120 170 L260 170 Q270 170 270 180 L270 250 L140 250 Q120 250 120 230 Z"
            style={getStyle(CarSystem.ENGINE)}
          />
          <path d="M140 160 L240 160 L240 170 L140 170 Z" style={getStyle(CarSystem.ENGINE)} opacity="0.8" /> {/* Cylinder Head */}
          <circle cx="150" cy="210" r="15" fill="none" stroke="white" strokeWidth="1" opacity="0.1" /> {/* Pulleys */}
          <circle cx="180" cy="230" r="10" fill="none" stroke="white" strokeWidth="1" opacity="0.1" />
        </g>
        <text x="145" y="210" fontSize="11" fontWeight="900" fill="white" opacity="0.4" pointerEvents="none" className="uppercase tracking-tighter">{getLabel(CarSystem.ENGINE)}</text>

        {/* Realistic Transmission */}
        <g 
          className="cursor-pointer"
          onMouseEnter={() => setHoveredSystem(CarSystem.TRANSMISSION)}
          onClick={() => onSelectSystem?.(CarSystem.TRANSMISSION)}
        >
          <path
            d="M270 195 L440 205 L440 245 L270 245 Z"
            style={getStyle(CarSystem.TRANSMISSION)}
          />
          <path d="M440 215 L480 220 L480 230 L440 235 Z" style={getStyle(CarSystem.TRANSMISSION)} opacity="0.5" /> {/* Output Shaft */}
        </g>
        <text x="310" y="230" fontSize="9" fontWeight="900" fill="white" opacity="0.4" pointerEvents="none" className="uppercase tracking-tighter">{getLabel(CarSystem.TRANSMISSION)}</text>

        {/* Detailed Airbags */}
        <g 
          className="cursor-pointer"
          onMouseEnter={() => setHoveredSystem(CarSystem.AIRBAGS)}
          onClick={() => onSelectSystem?.(CarSystem.AIRBAGS)}
        >
          <circle cx="380" cy="140" r="14" style={getStyle(CarSystem.AIRBAGS)} />
          <circle cx="550" cy="140" r="14" style={getStyle(CarSystem.AIRBAGS)} />
          <path d="M370 120 Q480 110 590 120 L590 130 Q480 120 370 130 Z" style={getStyle(CarSystem.AIRBAGS)} />
        </g>
        <text x="445" y="123" fontSize="9" fontWeight="900" fill="white" opacity="0.4" pointerEvents="none" className="uppercase tracking-tighter">{getLabel(CarSystem.AIRBAGS)}</text>

        {/* Realistic Exhaust System */}
        <g 
          className="cursor-pointer"
          onMouseEnter={() => setHoveredSystem(CarSystem.EXHAUST)}
          onClick={() => onSelectSystem?.(CarSystem.EXHAUST)}
        >
          <path
            d="M440 235 L700 235 L850 235 Q880 235 880 210"
            fill="none"
            stroke={(!isClearing && isSystemActive(CarSystem.EXHAUST)) ? accentColor : '#27272a'}
            strokeWidth={hoveredSystem === CarSystem.EXHAUST ? "8" : "5"}
            strokeLinecap="round"
          />
          <rect x="750" y="225" width="80" height="25" rx="10" style={getStyle(CarSystem.EXHAUST)} opacity="0.6" /> {/* Muffler */}
        </g>

        {/* Fuel Tank */}
        <path
          d="M580 240 L740 240 L740 280 L580 280 Z"
          style={getStyle(CarSystem.FUEL)}
          className="cursor-pointer"
          onMouseEnter={() => setHoveredSystem(CarSystem.FUEL)}
          onClick={() => onSelectSystem?.(CarSystem.FUEL)}
        />

        {/* Electronics Control Unit */}
        <g
          className="cursor-pointer"
          onMouseEnter={() => setHoveredSystem(CarSystem.ELECTRONICS)}
          onClick={() => onSelectSystem?.(CarSystem.ELECTRONICS)}
        >
           <rect x="330" y="150" width="40" height="30" rx="4" style={getStyle(CarSystem.ELECTRONICS)} />
           <path d="M335 155 L365 155 M335 160 L365 160 M335 165 L365 165" stroke="white" strokeWidth="0.5" opacity="0.2" />
        </g>

        {/* Realistic Brakes & Wheels */}
        <g 
          onClick={() => onSelectSystem?.(CarSystem.BRAKES)} 
          onMouseEnter={() => setHoveredSystem(CarSystem.BRAKES)}
          className="cursor-pointer"
        >
          {/* Front Wheel */}
          <circle cx="220" cy="300" r="48" stroke="#18181b" strokeWidth="15" fill="none" />
          <circle cx="220" cy="300" r="35" style={getStyle(CarSystem.BRAKES)} />
          <path d="M190 280 Q200 270 210 275 L220 285" fill="none" stroke="white" strokeWidth="4" opacity="0.3" /> {/* Caliper */}
          
          {/* Rear Wheel */}
          <circle cx="780" cy="300" r="48" stroke="#18181b" strokeWidth="15" fill="none" />
          <circle cx="780" cy="300" r="35" style={getStyle(CarSystem.BRAKES)} />
          <path d="M750 280 Q760 270 770 275 L780 285" fill="none" stroke="white" strokeWidth="4" opacity="0.3" />
        </g>
      </svg>
      
      <div className="absolute bottom-6 right-8 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-800 border border-zinc-700"></div>
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">OK</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className={`w-2.5 h-2.5 rounded-full transition-all duration-1000 ${isClearing ? 'opacity-20' : 'opacity-100'}`}
            style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }}
          ></div>
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">FAULT</span>
        </div>
      </div>
    </div>
  );
};
