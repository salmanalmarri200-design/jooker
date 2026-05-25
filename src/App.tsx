/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Upload,
  BarChart2,
  HelpCircle,
  Shield,
  FileText,
  AlertTriangle,
  Flame,
  LineChart,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  X,
  MapPin,
  Clock
} from 'lucide-react';
import ChartSimulator from './components/ChartSimulator';
import EducationalGuide from './components/EducationalGuide';
import { ChartScenario, AnalysisResult } from './types';

// Predefined Quick Presets/Scenarios matching different Jooker filters status
const PRESETS: ChartScenario[] = [
  {
    id: 'buy_perfect',
    name: 'شراء مثالي متطابق 🟢',
    description: 'ترند صاعد واستوكاستك في تشبع البيع مع رفض سفلي قوي عند قاع البولينجر.',
    trend: 'up',
    candlePosition: 'below_lower',
    wickType: 'long_lower',
    stochasticValue: 15,
    stochasticCross: 'bullish'
  },
  {
    id: 'sell_perfect',
    name: 'بيع مثالي متطابق 🔴',
    description: 'ترند هابط واستوكاستك في تشبع الشراء مع رفض علوي قوي عند قمة البولينجر.',
    trend: 'down',
    candlePosition: 'above_upper',
    wickType: 'long_upper',
    stochasticValue: 88,
    stochasticCross: 'bearish'
  },
  {
    id: 'trend_mismatch',
    name: 'ترند هابط ولكن السعر عند القاع ⚠️',
    description: 'الترند العام هابط، والسعر تحت البولينجر مع ذيل رفض سفلي - تضارب الترند مع ملامسة القاع (لا صفقة).',
    trend: 'down',
    candlePosition: 'below_lower',
    wickType: 'long_lower',
    stochasticValue: 22,
    stochasticCross: 'bullish'
  },
  {
    id: 'range_chaos',
    name: 'تذبذب عرضي مشوش 🌀',
    description: 'السعر يتأرجح في المنتصف تماماً حول خط الـ EMA 50 دون ملامسة لأطراف البولينجر (لا صفقة).',
    trend: 'range',
    candlePosition: 'middle',
    wickType: 'none',
    stochasticValue: 50,
    stochasticCross: 'none'
  },
  {
    id: 'no_rejection',
    name: 'ملامسة بولينجر دون ذيول رفض 🚫',
    description: 'السعر يخترق البولينجر السفلي بشمعة ممتلئة وزخم قوي دون تشكل أي رفض ديواني (لا صفقة).',
    trend: 'up',
    candlePosition: 'below_lower',
    wickType: 'none',
    stochasticValue: 18,
    stochasticCross: 'bullish'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'guide'>('console');
  
  // Custom user parameters
  const [trend, setTrend] = useState<'up' | 'down' | 'range'>('up');
  const [candlePosition, setCandlePosition] = useState<'above_upper' | 'below_lower' | 'on_ema' | 'middle'>('below_lower');
  const [wickType, setWickType] = useState<'long_upper' | 'long_lower' | 'none'>('long_lower');
  const [stochasticValue, setStochasticValue] = useState<number>(15);
  const [stochasticCross, setStochasticCross] = useState<'bullish' | 'bearish' | 'none'>('bullish');

  // Interactive upload fields
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Analysis state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Apply a scenario preset
  const applyPreset = (preset: ChartScenario) => {
    // Clear image when preset is clicked, to isolate the simulation state
    setImageFile(null);
    setImageFileName('');
    setTrend(preset.trend);
    setCandlePosition(preset.candlePosition);
    setWickType(preset.wickType);
    setStochasticValue(preset.stochasticValue);
    setStochasticCross(preset.stochasticCross);
    setResult(null);
    setErrorText(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processAndSetImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorText('يرجى اختيار ملف صورة صالح لشارت التداول.');
      return;
    }
    setImageFileName(file.name);
    setErrorText(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageFile(e.target?.result as string);
    };
    reader.onerror = () => {
      setErrorText('فشل تحميل ملف الصورة.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAndSetImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAndSetImage(e.target.files[0]);
    }
  };

  // Launch the analysis via backend endpoint
  const triggerAnalysis = async () => {
    setIsLoading(true);
    setErrorText(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageFile, // base64 string
          scenarioData: imageFile ? null : {
            trend,
            candlePosition,
            wickType,
            stochasticValue,
            stochasticCross,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned code: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.success) {
        setResult(resData.data);
        setIsDemoMode(resData.source === 'local_engine');
      } else {
        throw new Error(resData.message || 'فشلت معالجة الطلب في السيرفر.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'خطأ فني غير متوقع عند الاتصال بالمحرك الخاص بجوكر.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans" dir="rtl">
      {/* Sleek Gradient Background Aura */}
      <div className="absolute top-0 right-0 left-0 h-[450px] bg-gradient-to-b from-indigo-950/20 via-slate-950/0 to-slate-950/0 pointer-events-none" />

      {/* Primary Top Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand/Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center shadow-lg shadow-indigo-950/80 ring-2 ring-indigo-500/20">
              <span className="font-mono font-black text-lg tracking-wider text-white">JK</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <h1 className="font-sans font-black text-sm tracking-wide text-slate-100 uppercase">Jooker Terminal</h1>
              </div>
              <p className="text-[10px] font-mono text-slate-400">نظام Confluence ذو الفلاتر اللحظية القاطعة</p>
            </div>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 border border-slate-800/80 rounded-xl">
            <button
              id="tab-console"
              onClick={() => setActiveTab('console')}
              className={`px-4 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                activeTab === 'console'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              لوحة الفحص والتحليل
            </button>
            <button
              id="tab-guide"
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-1.5 rounded-lg text-xs font-sans font-medium transition-all ${
                activeTab === 'guide'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الدليل التعليمي الصارم
            </button>
          </div>

          {/* Realtime UTC Timer */}
          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date().toISOString().substring(11, 16)} UTC</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-400 font-bold">M1 LIVE</span>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {activeTab === 'guide' ? (
          <div className="max-w-4xl mx-auto">
            <EducationalGuide />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1: LEFT SIDE (Dynamic Simulator Visualization or File upload) - occupies 7 cols */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Tabs for Input source: Simulation Parameter OR Genuine Image Upload */}
              <div className="bg-slate-950/60 border border-slate-900/80 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
                  <h3 className="font-sans font-bold text-xs text-slate-300">طريقة فحص السعر والبيانات الحالية</h3>
                  <span className="text-[10px] font-mono text-slate-500">اختر المحاكاة الرياضية أو ارفع صورة حقيقية</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImageFileName('');
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      !imageFile
                        ? 'border-indigo-600/60 bg-indigo-950/10 text-indigo-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <BarChart2 className="w-5 h-5" />
                      <span className="text-xs font-medium">مُحاكاة المتغيرات التفاعلية</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      // Trigger a mock file load or toggle layout instructions to drag drop
                      const mockInput = document.getElementById('chart-uploader');
                      if (mockInput) mockInput.click();
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      imageFile
                        ? 'border-indigo-600/60 bg-indigo-950/10 text-indigo-400'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="w-5 h-5" />
                      <span className="text-xs font-medium">رفع صورة الشارت اللحظي</span>
                    </div>
                  </button>
                  <input
                    type="file"
                    id="chart-uploader"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                {/* If image is uploaded, render the image preview block. Else, render the live dynamic SVG canvas */}
                {imageFile ? (
                  <div className="relative border-2 border-dashed border-indigo-600/40 rounded-xl bg-slate-950/90 p-6 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
                    <img
                      src={imageFile}
                      alt="Uploaded Live M1 Chart"
                      className="max-h-[320px] rounded-lg object-contain border border-slate-800 shadow-md"
                    />
                    <div className="mt-4 flex items-center justify-between w-full max-w-sm border border-slate-800/80 bg-slate-900/40 px-3 py-2 rounded-lg text-xs">
                      <span className="truncate max-w-[200px] text-slate-300 font-mono">{imageFileName}</span>
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setImageFileName('');
                        }}
                        className="text-rose-400 hover:text-rose-300 font-bold px-2 py-1 text-[11px] hover:bg-rose-950/30 rounded"
                      >
                        إلغاء الملف
                      </button>
                    </div>
                  </div>
                ) : (
                  <ChartSimulator
                    trend={trend}
                    candlePosition={candlePosition}
                    wickType={wickType}
                    stochasticValue={stochasticValue}
                    stochasticCross={stochasticCross}
                  />
                )}
              </div>

              {/* Dynamic Live checklist monitoring current state (before clicking verify button) */}
              <div className="bg-slate-950/80 border border-slate-900/60 rounded-2xl p-5">
                <h3 className="font-sans font-bold text-xs text-slate-400 mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  رصد وتكامل المؤشرات الآنية للسيناريو
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Indicator 1 Status */}
                  <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono">1. الترند (EMA 50)</span>
                      <p className="text-xs font-medium text-slate-200 mt-0.5">
                        {trend === 'up' ? 'اتجاه صاعد 📈' : trend === 'down' ? 'اتجاه هابط 📉' : 'نطاق عرضي متذبذب'}
                      </p>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${trend !== 'range' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  </div>

                  {/* Indicator 2 Status */}
                  <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono">2. البولينجر والرفض</span>
                      <p className="text-xs font-medium text-slate-200 mt-0.5 flex items-center gap-1">
                        {candlePosition === 'below_lower' ? 'قاع القناة ' : candlePosition === 'above_upper' ? 'قمة القناة ' : 'متوسط الشارت '}
                        {wickType !== 'none' && <span className="text-[10px] bg-indigo-950 px-1 py-0.5 rounded text-indigo-400">رفض ذيلي</span>}
                      </p>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${candlePosition !== 'middle' && wickType !== 'none' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>

                  {/* Indicator 3 Status */}
                  <div className="bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono">3. الاستوكاستك</span>
                      <p className="text-xs font-medium text-slate-200 mt-0.5">
                        {stochasticValue}% - {stochasticCross === 'bullish' ? 'تقاطع صريح 📈' : stochasticCross === 'bearish' ? 'تقاطع هابط 📉' : 'موازية عشوائية'}
                      </p>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${(stochasticValue < 30 || stochasticValue > 70) && stochasticCross !== 'none' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </div>

                </div>
              </div>

            </div>

            {/* COLUMN 2: RIGHT SIDE (Controls & Fast Presets & AI Decision center) - occupies 5 cols */}
            <div className="lg:col-span-5 space-y-6">

              {/* Quick Presets Drawer */}
              {!imageFile && (
                <div className="bg-slate-950/80 border border-slate-900/60 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="font-sans font-bold text-xs text-slate-300">نماذج فحص سريعة (جاهزة للاستكشاف):</span>
                    <span className="text-[10px] font-mono text-slate-500">ماتش كلي بنظام جوكر</span>
                  </div>
                  <div className="space-y-2 max-h-[175px] overflow-y-auto pr-1">
                    {PRESETS.map((p) => {
                      const isSelected = !imageFile && trend === p.trend && candlePosition === p.candlePosition && wickType === p.wickType && stochasticValue === p.stochasticValue && stochasticCross === p.stochasticCross;
                      return (
                        <button
                          key={p.id}
                          onClick={() => applyPreset(p)}
                          className={`w-full text-right p-2.5 rounded-xl border text-xs transition-all block ${
                            isSelected
                              ? 'bg-indigo-950/30 border-indigo-500 text-indigo-300'
                              : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900/70 text-slate-300'
                          }`}
                        >
                          <div className="font-bold flex items-center justify-between">
                            <span>{p.name}</span>
                            {isSelected && <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-600 font-normal text-white rounded">محدد</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-normal leading-relaxed">{p.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Sliders Adjusters (Only rendered if no file is uploaded) */}
              {!imageFile && (
                <div className="bg-slate-950/60 border border-slate-900/80 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-sans font-bold text-xs text-slate-300">تهيئة المتغيرات الرياضية آلياً:</span>
                    <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 text-slate-400 rounded">عناصر الشارت</span>
                  </div>

                  {/* 1. Select Trend */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">1. اتجاه حركة الترند العام لقناة السعر</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'up', label: 'صاعد (Up)' },
                        { id: 'down', label: 'هابط (Down)' },
                        { id: 'range', label: 'عرضي (Range)' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => { setTrend(t.id as any); setResult(null); }}
                          className={`py-1 rounded-lg text-xs font-medium border text-center transition-all ${
                            trend === t.id
                              ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Candle Position */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">2. موقع آخر شمعة بالنسبة لقنوات Bollinger</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'above_upper', label: 'تخترق الخط العلوي' },
                        { id: 'below_lower', label: 'تخترق الخط السفلي' },
                        { id: 'on_ema', label: 'ملتصقة بـ EMA 50' },
                        { id: 'middle', label: 'تتذبذب في المنتصف' }
                      ].map((cp) => (
                        <button
                          key={cp.id}
                          onClick={() => { setCandlePosition(cp.id as any); setResult(null); }}
                          className={`py-1 px-1.5 rounded-lg text-xs font-medium border text-center truncate transition-all ${
                            candlePosition === cp.id
                              ? 'bg-cyan-600/10 border-cyan-500 text-cyan-400'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {cp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Wick Rejection */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">3. تشكّل ذيل رفض شمعة الدقيقة (M1 Rejection)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'long_lower', label: 'ذيل سفلي طويل' },
                        { id: 'long_upper', label: 'ذيل علوي طويل' },
                        { id: 'none', label: 'بدون ذيل لافت' }
                      ].map((wt) => (
                        <button
                          key={wt.id}
                          onClick={() => { setWickType(wt.id as any); setResult(null); }}
                          className={`py-1 rounded-lg text-[10px] font-medium border text-center truncate transition-all ${
                            wickType === wt.id
                              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {wt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Stochastic value slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1 text-[11px]">
                      <span className="text-slate-400">4. مستوى مؤشر الاستوكاستك المئوي</span>
                      <span className="font-mono font-bold text-slate-200">{stochasticValue}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stochasticValue}
                      onChange={(e) => { setStochasticValue(parseInt(e.target.value)); setResult(null); }}
                      className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 mt-1 font-mono">
                      <span>0% Oversold</span>
                      <span>50% Neutral</span>
                      <span>100% Overbought</span>
                    </div>
                  </div>

                  {/* 5. Stochastic cross state */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1.5">5. طبيعة تقاطعات خطوط الاستوكاستك الأخيرة</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'bullish', label: 'تقاطع صاعد 📈' },
                        { id: 'bearish', label: 'تقاطع هابط 📉' },
                        { id: 'none', label: 'لا توجد تقاطعات' }
                      ].map((sc) => (
                        <button
                          key={sc.id}
                          onClick={() => { setStochasticCross(sc.id as any); setResult(null); }}
                          className={`py-1 rounded-lg text-xs font-medium border text-center transition-all ${
                            stochasticCross === sc.id
                              ? 'bg-amber-600/10 border-amber-500 text-amber-400'
                              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ACTION TRIGGER BUTTON */}
              <div>
                <button
                  onClick={triggerAnalysis}
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-slate-100 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-950/40 group active:scale-[0.99]"
                >
                  <Sparkles className="w-5 h-5 animate-pulse group-hover:scale-110 transition-all text-amber-300" />
                  <span className="font-sans text-sm tracking-wide">فحص الفلاتر المتقاطعة للجوكر (Confluence Run)</span>
                </button>
              </div>

              {/* LOADING SCREEN WITH CHARMING TRADE MESSAGES */}
              {isLoading && (
                <div className="bg-slate-950/90 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-xl">
                  <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="font-sans font-bold text-sm text-slate-200">يتم تشريح الشارت الآن واستخراج الفلاتر...</p>
                    <p className="text-[11px] text-slate-400 font-mono">تطبيق بند الأمان وحماية المحفظة قيد التحقق الآلي</p>
                  </div>
                </div>
              )}

              {/* MOCK/ERROR NOTIFICATION CHECK */}
              {errorText && (
                <div className="bg-rose-950/20 border border-rose-900/60 p-4 rounded-xl flex gap-3 text-right">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <h4 className="text-rose-400 font-bold text-xs mb-0.5">خطأ فني في التحليل آلياً</h4>
                    <p className="text-[11px] text-rose-200/80 leading-relaxed">{errorText}</p>
                  </div>
                </div>
              )}

              {/* REPORT CARD COMPONENT (Once we get the result) */}
              {result && (
                <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl relative">
                  
                  {/* Decorative head line according to final decision result */}
                  <div className={`h-1.5 w-full ${
                    result.decision === 'BUY' ? 'bg-emerald-500' : result.decision === 'SELL' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />

                  <div className="p-5">
                    
                    {/* Decision Title Box */}
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">RESULT DECISION:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-sans flex items-center gap-1 ${
                            result.decision === 'BUY' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/85' :
                            result.decision === 'SELL' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/85' :
                            'bg-amber-950/80 text-amber-400 border border-amber-800/85'
                          }`}>
                            {result.decision === 'BUY' ? '🟢 قرار شراء تام (BUY)' :
                             result.decision === 'SELL' ? '🔴 قرار بيع تام (SELL)' :
                             '🟡 لا صفقة - البقاء خارج السوق'}
                          </span>
                        </div>
                      </div>

                      {/* Confidence Gauge */}
                      <div className="text-left">
                        <span className="text-[9px] text-slate-500 font-mono block">الاستقرار الرياضي:</span>
                        <span className="text-lg font-mono font-black text-indigo-400">{result.confidence}%</span>
                      </div>
                    </div>

                    {/* Verified Confluence Filters Checklists */}
                    <div className="space-y-2.5 mb-4 bg-slate-900/30 border border-slate-900/80 p-3 rounded-xl">
                      
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-500 font-mono">فلتر الاتجاه (EMA 50):</span>
                          <p className="text-slate-300 mt-0.5">{result.filtersCheck.trend.detail}</p>
                        </div>
                        {result.filtersCheck.trend.status === 'PASS' ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                        ) : (
                          <X className="w-4 h-4 text-rose-400 shrink-0 mt-1" />
                        )}
                      </div>

                      <div className="border-t border-slate-800/60 my-1" />

                      <div className="flex items-start justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-500 font-mono">حدود السيولة (Bollinger):</span>
                          <p className="text-slate-300 mt-0.5">{result.filtersCheck.liquidity.detail}</p>
                        </div>
                        {result.filtersCheck.liquidity.status === 'PASS' ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                        ) : (
                          <X className="w-4 h-4 text-rose-400 shrink-0 mt-1" />
                        )}
                      </div>

                      <div className="border-t border-slate-800/60 my-1" />

                      <div className="flex items-start justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-500 font-mono">الزخم والتشبع (Stochastic):</span>
                          <p className="text-slate-300 mt-0.5">{result.filtersCheck.momentum.detail}</p>
                        </div>
                        {result.filtersCheck.momentum.status === 'PASS' ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                        ) : (
                          <X className="w-4 h-4 text-rose-400 shrink-0 mt-1" />
                        )}
                      </div>

                    </div>

                    {/* Reasons list */}
                    <div className="mb-4">
                      <span className="text-[10px] text-slate-500 font-sans block mb-1.5 font-bold">نقاط الدعم الفنية الصامدة:</span>
                      <ul className="space-y-1 pl-2">
                        {result.reasons.map((reason, rIdx) => (
                          <li key={rIdx} className="text-xs text-slate-300 flex items-start gap-1">
                            <span className="text-indigo-500 shrink-0">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Detailed AI narrative commentary */}
                    <div className="bg-slate-900/30 border border-slate-900/60 p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed font-sans mb-4">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold mb-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>تشريح جوكر المنطقي الحتمي:</span>
                      </div>
                      <p>{result.detailedAnalysis}</p>
                    </div>

                    {/* Risk Management & Order Targets */}
                    <div className="bg-indigo-950/15 border border-indigo-900/30 rounded-xl p-3 text-xs space-y-2">
                      <span className="font-bold text-[10px] text-indigo-400 tracking-wider block border-b border-indigo-950 pb-1 uppercase">إدارة المخاطر الصارمة (Risk Blueprint):</span>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-slate-500 text-[10px] block">نقطة الدخول المفترضة:</span>
                          <span className="font-semibold text-slate-200">{result.riskManagement.entryPrice}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">العائد مقابل المخاطرة (R:R):</span>
                          <span className="font-mono font-bold text-slate-200">{result.riskManagement.riskRewardRatio}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-rose-400 text-[10px] items-center gap-1 block">وقف الخسارة الصارم (SL):</span>
                          <span className="font-mono font-bold text-rose-300">{result.riskManagement.stopLoss}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-emerald-400 text-[10px] items-center gap-1 block">أهداف أخذ الأرباح (TP):</span>
                          <span className="font-mono font-bold text-emerald-300">{result.riskManagement.takeProfit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Local engine notification tag */}
                    {isDemoMode && (
                      <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 border-t border-slate-900 pt-3">
                        <Info className="w-3 h-3" />
                        <span>منفذ محلياً بمحرك لوغاريتمات التداول الاحتياطي.</span>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>

          </div>
        )}
      </main>

      {/* Primary footer */}
      <footer className="border-t border-slate-900 mt-12 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-500 text-[11px] font-sans">
          <p>© {new Date().getFullYear()} Jooker Confluence Systems. جميع المعاملات فنية خاضعة لبنود وقواعد فحص وإدارة رأس مال منضبطة ومجردة العواطف.</p>
        </div>
      </footer>
    </div>
  );
}
