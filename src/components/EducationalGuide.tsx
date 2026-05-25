/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, TrendingUp, Compass, Settings, Info, CheckCircle2 } from 'lucide-react';

export default function EducationalGuide() {
  return (
    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden text-right" dir="rtl">
      {/* Absolute design accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-sans font-bold text-lg text-slate-100">دليل نظام الفلاتر المتقاطعة (Confluence System)</h2>
          <p className="text-xs text-slate-400 mt-1">المعادلة الثلاثية المطلقة من جوكر للتداول ببرود عصبي منزوع المشاعر</p>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed mb-6">
        الهدف الرئيسي من نظام <span className="text-indigo-400 font-semibold">جوكر</span> هو القضاء تماماً على أي عواطف بشرية (الجشع، الخوف، التردد) أثناء اقتناص صفقات السكالبينج اللحظية على فريم الدقيقة (M1). لا يُسمح بدخول السوق إلا عند نضوج الفلاتر الثلاثة في نفس اللحظة.
      </p>

      {/* Checklist items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        {/* Filter 1 */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-2 font-mono">
              <TrendingUp className="w-4 h-4" />
              <span>1. فلتر اتجاه الحركة (EMA 50)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              نفحص توازن السعر والشموع بالنسبة للمتوسط الأسي 50 (الخط الأزرق). 
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 mt-3 list-none">
              <li className="flex items-center gap-1.5 justify-start">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span>شراء: استقرار الشموع والترند بالكامل <strong className="text-emerald-400">فوق</strong> EMA 50.</span>
              </li>
              <li className="flex items-center gap-1.5 justify-start">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                <span>بيع: استقرار الشموع والترند بالكامل <strong className="text-rose-400">تحت</strong> EMA 50.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Filter 2 */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-2 font-mono">
              <Settings className="w-4 h-4" />
              <span>2. حدود السيولة (Bollinger Bands)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              نراقب اصطدام السعر بأطراف السيولة القصوى لقناة بولينجر لغايات الارتداد.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 mt-3 list-none">
              <li className="flex items-center gap-1.5 justify-start">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span>شراء: ملامسة النطاق <strong className="text-cyan-400">السفلي</strong> مع ظهور رفض (ذيل سفلي).</span>
              </li>
              <li className="flex items-center gap-1.5 justify-start">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                <span>بيع: ملامسة النطاق <strong className="text-rose-400">العلوي</strong> مع ظهور رفض (ذيل علوي).</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Filter 3 */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>3. مؤشر الزخم السريع (Stochastic)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              نقتنص تبريد زخم الشراء أو زخم البيع الفوري للتنفيذ مع رصد التقاطعات الصريحة.
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 mt-3 list-none">
              <li className="flex items-center gap-1.5 justify-start">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <span>شراء: مستويات تشبع بيعي حاد <strong className="text-amber-400">تحت 30</strong> + تقاطع صاعد.</span>
              </li>
              <li className="flex items-center gap-1.5 justify-start">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                <span>بيع: مستويات تشبع شرائي حاد <strong className="text-amber-400">فوق 70</strong> + تقاطع هابط.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* The Golden Confluence Rule and Capital Protection alert */}
      <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex gap-3 text-right">
        <div className="text-amber-400 mt-0.5">
          <Shield className="w-5 h-5 shrink-0" />
        </div>
        <div>
          <h4 className="text-amber-300 font-bold text-sm mb-1">🛡️ قانون حماية رأس المال الصارم لجوكر:</h4>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            البقاء خارج السوق هو "الصفقة الكبرى الفائزة دائمًا". في حال غياب لقطة شاشة الشارت المرفق، أو حدوث تضارب ولو كان طفيفاً بين الفلاتر (مثل: اتجاه هابط والاستوكاستك يعطي إشارة شراء)، **يتوجب عليك الامتناع التام والصارم وفوراً عن التداول**. لا توجد أنصاف صفقات في شفرة جوكر الهندسية.
          </p>
        </div>
      </div>
    </div>
  );
}
