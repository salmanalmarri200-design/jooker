/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ChartSimulatorProps {
  trend: 'up' | 'down' | 'range';
  candlePosition: 'above_upper' | 'below_lower' | 'on_ema' | 'middle';
  wickType: 'long_upper' | 'long_lower' | 'none';
  stochasticValue: number;
  stochasticCross: 'bullish' | 'bearish' | 'none';
}

export default function ChartSimulator({
  trend,
  candlePosition,
  wickType,
  stochasticValue,
  stochasticCross,
}: ChartSimulatorProps) {
  // Generate some realistic static candle offsets for the preceding 10 candles
  // We offset them vertically based on the trend to form a beautiful wave.
  const baseCandlesCount = 9;
  const candles = Array.from({ length: baseCandlesCount }).map((_, i) => {
    let yOffset = 0;
    if (trend === 'up') {
      yOffset = (baseCandlesCount - i) * 6 - 15; // climbing up
    } else if (trend === 'down') {
      yOffset = i * 6 - 15; // falling down
    } else {
      yOffset = Math.sin(i * 1.5) * 10; // oscillating
    }
    const isGreen = trend === 'up' ? (i % 3 !== 0) : trend === 'down' ? (i % 3 === 0) : (i % 2 === 0);
    return {
      x: i * 32 + 25,
      y: 90 + yOffset,
      height: 15 + (i % 3) * 5,
      isGreen,
      wickTop: 5 + (i % 2) * 4,
      wickBottom: 6 + (i % 3) * 3,
    };
  });

  // Calculate coordinates for the bands and lines
  // The bands should curve beautifully.
  let bandCurve = '';
  let upperBandCurve = '';
  let lowerBandCurve = '';
  let emaCurve = '';

  const getPoints = (type: 'upper' | 'middle' | 'lower' | 'ema') => {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= 10; i++) {
      const x = i * 32 + 25;
      let baseY = 100;
      
      // Trend modifier
      if (trend === 'up') {
        baseY = 130 - i * 6;
      } else if (trend === 'down') {
        baseY = 70 + i * 6;
      } else {
        baseY = 100 + Math.sin(i * 0.8) * 8;
      }

      let y = baseY;
      if (type === 'upper') {
        y = baseY - 35 + (trend === 'range' ? Math.sin(i * 0.2) * 2 : 0);
      } else if (type === 'lower') {
        y = baseY + 35 - (trend === 'range' ? Math.sin(i * 0.2) * 2 : 0);
      } else if (type === 'ema') {
        y = baseY + 5; // EMA 50 is slightly offset or lagging relative to price
      }
      points.push({ x, y });
    }
    return points;
  };

  const ptsUpper = getPoints('upper');
  const ptsMiddle = getPoints('middle');
  const ptsLower = getPoints('lower');
  const ptsEma = getPoints('ema');

  // Convert points to SVG SVG Path commands
  const toPath = (pts: { x: number; y: number }[]) => 
    `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `S ${p.x - 10} ${p.y}, ${p.x} ${p.y}`).join(' ');

  upperBandCurve = toPath(ptsUpper);
  bandCurve = toPath(ptsMiddle);
  lowerBandCurve = toPath(ptsLower);
  emaCurve = toPath(ptsEma);

  // Determine active candle (Right-most M1, index 10)
  const activeX = 10 * 32 + 25;
  const activeMiddleY = ptsMiddle[ptsMiddle.length - 1].y;
  const activeUpperY = ptsUpper[ptsUpper.length - 1].y;
  const activeLowerY = ptsLower[ptsLower.length - 1].y;
  const activeEmaY = ptsEma[ptsEma.length - 1].y;

  // Candle vertical center position based on parameter
  let activeCandleY = activeMiddleY;
  if (candlePosition === 'above_upper') {
    activeCandleY = activeUpperY - 8;
  } else if (candlePosition === 'below_lower') {
    activeCandleY = activeLowerY + 8;
  } else if (candlePosition === 'on_ema') {
    activeCandleY = activeEmaY;
  } else {
    activeCandleY = activeMiddleY + 5;
  }

  // Active Candle properties
  const isUpTrend = trend === 'up';
  // In a normal setup, if trend is up and we hit lower band, it's typically a bullish bounce (green candle)
  const activeIsGreen = candlePosition === 'below_lower' ? true : candlePosition === 'above_upper' ? false : isUpTrend;
  
  const candleHeight = 24;
  const candleTopY = activeCandleY - candleHeight / 2;
  const candleBottomY = activeCandleY + candleHeight / 2;

  // Wick configurations
  let activeWickTop = 4;
  let activeWickBottom = 4;
  if (wickType === 'long_upper') {
    activeWickTop = 35;
    activeWickBottom = 2;
  } else if (wickType === 'long_lower') {
    activeWickTop = 2;
    activeWickBottom = 35;
  }

  // Generate Stochastic wave lines based on current stochastic value and cross state
  const getStochPoints = (line: 'K' | 'D') => {
    const points: { x: number; y: number }[] = [];
    // Convert 0-100 stochastic value to local SVG height (height of Stochastic panel is 80)
    // Stochastic panel is in y range [20, 100] inside its SVG viewbox
    const targetY = 100 - (stochasticValue / 100) * 80;

    for (let i = 0; i <= 10; i++) {
      const x = i * 32 + 25;
      let progress = i / 10;
      
      // Background wave oscillating
      let baseYPoint = 60 + Math.sin(i * 1.2) * 15;
      
      // Interpolate towards the latest user-configured stochastic value on the final candles
      let finalY = baseYPoint;
      if (i >= 7) {
        const factor = (i - 7) / 3; // 0 to 1
        finalY = baseYPoint * (1 - factor) + targetY * factor;
      }

      // Add relative cross shift at the very end
      let shift = 0;
      if (i === 10) {
        if (stochasticCross === 'bullish') {
          shift = line === 'K' ? -10 : 8; // K rapid is K > D (crossing upwards)
        } else if (stochasticCross === 'bearish') {
          shift = line === 'K' ? 10 : -8; // K Rapid is K < D (crossing downwards)
        }
      } else if (i === 9) {
        // Prepare pre-cross proximity
        if (stochasticCross === 'bullish') {
          shift = line === 'K' ? 5 : -3;
        } else if (stochasticCross === 'bearish') {
          shift = line === 'K' ? -5 : 3;
        }
      }

      let finalScaledY = Math.max(10, Math.min(110, finalY + shift));
      points.push({ x, y: finalScaledY });
    }
    return points;
  };

  const stochKLines = getStochPoints('K');
  const stochDLines = getStochPoints('D');

  const stochKPath = toPath(stochKLines);
  const stochDPath = toPath(stochDLines);

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 relative overflow-hidden">
      {/* Decorative cyber grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Main Trading Chart Header */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="font-sans font-medium text-xs tracking-wider text-slate-300 uppercase">Jooker Realtime Chart M1</h3>
        </div>
        <div className="flex gap-4 font-mono text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> EMA 50
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Bollinger Upper
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Bollinger Lower
          </span>
        </div>
      </div>

      {/* Simulation Master Chart Area */}
      <div className="relative">
        <svg
          viewBox="0 0 380 200"
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Bollinger bands translucent background area */}
          <path
            d={`${upperBandCurve} L ${ptsLower[ptsLower.length - 1].x} ${ptsLower[ptsLower.length - 1].y} ${lowerBandCurve.replace('M', 'L')} Z`}
            fill="url(#bb-glow)"
            opacity="0.04"
          />

          <defs>
            <linearGradient id="bb-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <filter id="glow-blue">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1="25" y1="50" x2="360" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 3" />
          <line x1="25" y1="100" x2="360" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 3" />
          <line x1="25" y1="150" x2="360" y2="150" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 3" />

          {/* Indicator Bands (Upper, Middle, Lower, EMA) */}
          <path d={upperBandCurve} fill="none" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
          <path d={lowerBandCurve} fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
          <path d={bandCurve} fill="none" stroke="#475569" strokeWidth="0.8" opacity="0.4" />
          
          {/* EMA 50 line in glowing blue as the heart of the Confluence layout */}
          <path d={emaCurve} fill="none" stroke="#2563eb" strokeWidth="2" filter="url(#glow-blue)" />

          {/* Preceding mock candlesticks */}
          {candles.map((candle, idx) => (
            <g key={idx} opacity="0.6">
              {/* Wick */}
              <line
                x1={candle.x}
                y1={candle.y - candle.wickTop}
                x2={candle.x}
                y2={candle.y + candle.height + candle.wickBottom}
                stroke={candle.isGreen ? '#10b981' : '#ef4444'}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={candle.x - 3}
                y={candle.y}
                width="6"
                height={candle.height}
                fill={candle.isGreen ? '#10b981' : '#ef4444'}
                rx="1"
              />
            </g>
          ))}

          {/* ACTIVE CANDLER SPECIFIER (M1 LIVE) */}
          <g>
            {/* Pulsing focal glow ring behind active candle */}
            <circle
              cx={activeX}
              cy={activeCandleY}
              r="22"
              fill={activeIsGreen ? '#10b981' : '#ef4444'}
              opacity="0.08"
              className="animate-pulse"
            />

            {/* Candle Wick Shadows */}
            <line
              x1={activeX}
              y1={candleTopY - activeWickTop}
              x2={activeX}
              y2={candleBottomY + activeWickBottom}
              stroke={activeIsGreen ? '#10b981' : '#ef4444'}
              strokeWidth="2"
            />

            {/* Candle Main Body */}
            <rect
              x={activeX - 6}
              y={candleTopY}
              width="12"
              height={candleHeight}
              fill={activeIsGreen ? '#10b981' : '#ef4444'}
              stroke={activeIsGreen ? '#34d399' : '#f87171'}
              strokeWidth="1"
              rx="1.5"
            />

            {/* Target highlight overlay box */}
            <rect
              x={activeX - 10}
              y={Math.min(candleTopY - activeWickTop, candleBottomY + activeWickBottom) - 5}
              width="20"
              height={Math.max(candleTopY - activeWickTop, candleBottomY + activeWickBottom) - Math.min(candleTopY - activeWickTop, candleBottomY + activeWickBottom) + 24}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.25"
            />
          </g>
        </svg>

        {/* Live Indicator overlay label */}
        <div className="absolute right-3 top-2 border border-emerald-950 bg-emerald-950/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-emerald-400 flex items-center gap-1 select-none">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
          شمعة M1 الحالية
        </div>
      </div>

      {/* Stochastic Panel Separator */}
      <div className="my-3 border-t border-slate-800/60" />

      {/* Stochastic Oscillator SVG Container */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">STOCHASTIC OSCILLATOR (14, 3, 3)</span>
          <div className="flex gap-3 text-[9px] font-mono">
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> %K
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> %D
            </span>
          </div>
        </div>

        <div className="relative">
          <svg viewBox="0 0 380 120" className="w-full h-auto overflow-visible select-none">
            {/* Overbought boundary shaded area (80) */}
            <rect x="25" y="0" width="335" height="24" fill="#ef4444" opacity="0.04" />
            {/* Oversold boundary shaded area (20) */}
            <rect x="25" y="96" width="335" height="24" fill="#10b981" opacity="0.04" />

            {/* Levels horizontal lines */}
            <line x1="25" y1="24" x2="360" y2="24" stroke="#f43f5e" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.4" />
            <line x1="25" y1="60" x2="360" y2="60" stroke="#475569" strokeWidth="0.5" strokeDasharray="1 3" opacity="0.3" />
            <line x1="25" y1="96" x2="360" y2="96" stroke="#10b981" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.4" />

            {/* Level markings */}
            <text x="365" y="27" fill="#f43f5e" className="text-[8px] font-mono" opacity="0.5">80</text>
            <text x="365" y="63" fill="#475569" className="text-[8px] font-mono" opacity="0.5">50</text>
            <text x="365" y="99" fill="#10b981" className="text-[8px] font-mono" opacity="0.5">20</text>

            {/* Wave paths based on user parameters */}
            <path d={stochKPath} fill="none" stroke="#fbbf24" strokeWidth="1.8" />
            <path d={stochDPath} fill="none" stroke="#34d399" strokeWidth="1.8" />

            {/* Latest Stochastic Cross marker circles */}
            <circle cx={activeX} cy={stochKLines[stochKLines.length - 1].y} r="3" fill="#fbbf24" />
            <circle cx={activeX} cy={stochDLines[stochDLines.length - 1].y} r="3" fill="#34d399" />
          </svg>
        </div>
      </div>
    </div>
  );
}
