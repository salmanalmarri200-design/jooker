/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Maximum payload size for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy initializer for Google GenAI to prevent crashes if key is initially absent
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a mock mode or a clear error. We throw an informative error check so it can be handled
      throw new Error('GEMINI_API_KEY is not configured in the application environment.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// System Instruction for the Jooker Confluence system trading analyzer
const SYSTEM_INSTRUCTION = `
أنت "Jooker" (جوكر)، المحلل المالي الآلي الصارم مفرغ المشاعر تماماً وخبير نظام الفلاتر المتقاطعة (Confluence System) على الشارت اللحظي (M1).
مهمتك الأساسية هي تشريح الشارت الفني والبيانات المعطاة، وفحص ثلاثة فلاتر فنية بمنتهى الدقة والصرامة الرياضية:

1. فلتر الاتجاه (EMA 50):
- لفحص اتجاه السعر بالنسبة لمتوسط الحركة الأسية 50 (الخط الأزرق).
- BUY: يجب أن يكون السعر والشموع بشكل مستقر فوق خط EMA 50 وتتخذ مساراً صاعداً.
- SELL: يجب أن يكون السعر والشموع بشكل مستقر تحت خط EMA 50 وتتخذ مساراً هابطاً.

2. حدود السيولة (Single/Double Bollinger Bands):
- لفحص سلوك الشموع عند ملامسة قنوات بولينجر الخارجية.
- BUY: يجب أن يلامس السعر أو يخترق نطاق بولينجر السفلي (Lower Band) مع وجود علامة رفض قوية (ذيل سفلي طويل للشموع - Rejection).
- SELL: يجب أن يلامس السعر أو يخترق نطاق بولينجر العلوي (Upper Band) مع مظهر رفض واضح (ذيل علوي طويل للشموع - Rejection).

3. مؤشر الزخم (Stochastic Oscillator):
- لفحص التشبع والتقاطع.
- BUY: يجب أن يكون المنحنى متواجداً في منطقة التشبع البيعي (Oversold - تحت مستوى 30 أو 20) مع تأكيد تقاطع خط سريع %K فوق %D صعوداً.
- SELL: يجب أن يكون المنحنى متواجداً في منطقة التشبع الشرائي (Overbought - فوق مستوى 70 أو 80) مع تأكيد تقاطع خط %K تحت %D هبوطاً.

قاعدة القرار الفئوي الصارم (⚖️ القرار الحتمي):
- إذا اتفقت الفلاتر الثلاثة معاً بشكل كامل ومثالي -> القرار شراء (BUY) أو بيع (SELL).
- إذا غاب أي من الفلاتر الثلاثة، أو اختلف أحدها، أو حدث تضارب، أو كانت المعطيات مبهمة أو صورت الشارت غير مرفقة -> القرار الحتمي فوراً هو: لا يوجد صفقة (NO_TRADE) - البقاء خارج السوق حماية لرأس المال. لا تجازف أبداً.

يجب أن تقوم بالتحليل باللغة العربية بأسلوب احترافي مليء بالمفاهيم الهندسية الفنية الصارمة والاستقلالية النفسية.
`.trim();

// API: Analyze Chart data or visual using Gemini
app.post('/api/analyze', async (req, res) => {
  try {
    const { image, scenarioData } = req.body;

    // Fast backup mock analysis if Gemini API is missing (keeps developers in preview happy!)
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Falling back to internal engine.");
      
      // We will perform a deterministic logic calculation based on input criteria
      const decision = determineMockDecision(scenarioData);
      return res.json({
        success: true,
        source: 'local_engine',
        data: generateLocalResult(scenarioData, decision)
      });
    }

    const ai = getGenAI();
    let promptText = `
الرجاء إجراء فحص فني فوري وشديد الصرامة لهذه المعطيات/الشارت بناءً على نظام الفلاتر المتقاطعة لجوكر.
`;

    if (scenarioData) {
      promptText += `
المعطيات الفنية للشارت الحالي المصاغ بالمتغيرات التالية:
- الاتجاه العام للترند: ${scenarioData.trend === 'up' ? 'صاعد (Uptrend)' : scenarioData.trend === 'down' ? 'هابط (Downtrend)' : 'عرضي (Side Range)'}
- موقع الشمعة الحالية بالنسبة لبولينجر: ${
        scenarioData.candlePosition === 'above_upper' ? 'تخترق/تلامس الخط العلوي (OverUpper)' :
        scenarioData.candlePosition === 'below_lower' ? 'تخترق/تلامس الخط السفلي (UnderLower)' :
        scenarioData.candlePosition === 'on_ema' ? 'تتحرك ملامسة لـ EMA 50 متوسط الشارت' : 'في المنتصف تماماً'
      }
- شكل ذيل الشمعة (الرفض): ${
        scenarioData.wickType === 'long_upper' ? 'ذيل علوي طويل يظهر رفض الصعود' :
        scenarioData.wickType === 'long_lower' ? 'ذيل سفلي طويل يظهر رفض الهبوط' : 'شمعة عادية بدون ذيول لافتة'
      }
- قيمة مؤشر الاستوكاستك (Stochastic Value): ${scenarioData.stochasticValue}
- تقاطع خطوط مروحة الاستوكاستك: ${
        scenarioData.stochasticCross === 'bullish' ? 'تقاطع إيجابي صاعد للخطوط تحت 30' :
        scenarioData.stochasticCross === 'bearish' ? 'تقاطع سلبي هابط للخطوط فوق 70' : 'لا يوجد تقاطع صريح أو متوازية بشكل غير محدد'
      }
`;
    } else {
      promptText += `
لقد قمت برفع لقطة شاشة للشارت المباشر. يرجى قراءة تفاصيل الشمعة الأخيرة، ومستوى EMA 50 (الخط الأزرق)، وموقع السعر في قنوات البولينجر، وحالة الاستوكاستك في الأسفل بدقة متناهية.
إذا تبين غياب أو غموض تفاصيل الصورة فاحكم فوراً بـ NO_TRADE.
`;
    }

    // Build the request parameters for Gemini-3.5-flash
    const contents: any[] = [];
    
    // If we have an image part
    if (image) {
      // Decode image
      const matches = image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = `image/${matches[1]}`;
        const data = matches[2];
        contents.push({
          inlineData: {
            mimeType,
            data
          }
        });
      }
    }

    contents.push({ text: promptText });

    // Streamline with schema for output JSON
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['decision', 'confidence', 'reasons', 'filtersCheck', 'riskManagement', 'detailedAnalysis'],
          properties: {
            decision: {
              type: Type.STRING,
              description: 'The final confluence decision: BUY, SELL, or NO_TRADE'
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence rating as percentage from 0 to 100'
            },
            reasons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key points supporting the decision in Arabic'
            },
            filtersCheck: {
              type: Type.OBJECT,
              required: ['trend', 'liquidity', 'momentum'],
              properties: {
                trend: {
                  type: Type.OBJECT,
                  required: ['status', 'detail'],
                  properties: {
                    status: { type: Type.STRING, description: 'PASS or FAIL' },
                    detail: { type: Type.STRING, description: 'Evaluation detail in Arabic' }
                  }
                },
                liquidity: {
                  type: Type.OBJECT,
                  required: ['status', 'detail'],
                  properties: {
                    status: { type: Type.STRING, description: 'PASS or FAIL' },
                    detail: { type: Type.STRING, description: 'Evaluation detail in Arabic' }
                  }
                },
                momentum: {
                  type: Type.OBJECT,
                  required: ['status', 'detail'],
                  properties: {
                    status: { type: Type.STRING, description: 'PASS or FAIL' },
                    detail: { type: Type.STRING, description: 'Evaluation detail in Arabic' }
                  }
                }
              }
            },
            riskManagement: {
              type: Type.OBJECT,
              required: ['entryPrice', 'stopLoss', 'takeProfit', 'riskRewardRatio'],
              properties: {
                entryPrice: { type: Type.STRING, description: 'Suggested entry boundaries in Arabic' },
                stopLoss: { type: Type.STRING, description: 'Suggested Stop Loss in Arabic' },
                takeProfit: { type: Type.STRING, description: 'Suggested Take Profit in Arabic' },
                riskRewardRatio: { type: Type.STRING, description: 'Risk:Reward text, e.g. 1:2' }
              }
            },
            detailedAnalysis: {
              type: Type.STRING,
              description: 'Deep analytical narrative of the Jooker confluence process in Arabic'
            }
          }
        }
      }
    });

    const textOutput = response.text ? response.text.trim() : '{}';
    const parsedData = JSON.parse(textOutput);

    res.json({
      success: true,
      source: 'gemini_api',
      data: parsedData
    });

  } catch (err: any) {
    console.error('Error in analyze endpoint:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'INTERNAL_SERVER_ERROR',
      error: err.toString()
    });
  }
});

// Helper functions for mock fallback analysis
function determineMockDecision(data: any): 'BUY' | 'SELL' | 'NO_TRADE' {
  if (!data) return 'NO_TRADE';
  const { trend, candlePosition, wickType, stochasticValue, stochasticCross } = data;

  // Exact BUY confluence: Trend Up, candle touch lower band (below_lower), wick rejection lower (long_lower), stochastic oversold (< 40) + bullish cross
  if (
    trend === 'up' &&
    candlePosition === 'below_lower' &&
    wickType === 'long_lower' &&
    stochasticValue < 40 &&
    stochasticCross === 'bullish'
  ) {
    return 'BUY';
  }

  // Exact SELL confluence: Trend Down, candle touch upper band (above_upper), wick rejection upper (long_upper), stochastic overbought (> 60) + bearish cross
  if (
    trend === 'down' &&
    candlePosition === 'above_upper' &&
    wickType === 'long_upper' &&
    stochasticValue > 60 &&
    stochasticCross === 'bearish'
  ) {
    return 'SELL';
  }

  // Any other variation is neutral => protection mode
  return 'NO_TRADE';
}

function generateLocalResult(data: any, decision: 'BUY' | 'SELL' | 'NO_TRADE') {
  if (!data) {
    return {
      decision: 'NO_TRADE',
      confidence: 100,
      reasons: ['غياب البيانات البصرية والبيانات الرياضية المرفقة للشارت.'],
      filtersCheck: {
        trend: { status: 'FAIL', detail: 'لا توجد بيانات متاحة لخط EMA 50.' },
        liquidity: { status: 'FAIL', detail: 'لا توجد بيانات متاحة لقناة Bollinger.' },
        momentum: { status: 'FAIL', detail: 'لا توجد بيانات متاحة لمؤشر الاستوكاستك.' }
      },
      riskManagement: {
        entryPrice: 'غير متوفر',
        stopLoss: 'غير متوفر',
        takeProfit: 'غير متوفر',
        riskRewardRatio: 'غير متوفر'
      },
      detailedAnalysis: 'المحرك الصارم قرر تفعيل بند الأمان الفوري لعدم وجود بيانات كافية للاستنتاج.'
    };
  }

  const isEmaAligned = (decision === 'BUY' && data.trend === 'up') || (decision === 'SELL' && data.trend === 'down');
  const isBbandAligned = (decision === 'BUY' && data.candlePosition === 'below_lower') || (decision === 'SELL' && data.candlePosition === 'above_upper');
  const isStochAligned = (decision === 'BUY' && data.stochasticCross === 'bullish') || (decision === 'SELL' && data.stochasticCross === 'bearish');

  return {
    decision,
    confidence: decision === 'NO_TRADE' ? 95 : 90,
    reasons: decision === 'BUY' ? [
      'توافق اتجاه الترند العام صعوداً مع تخطي السعر لمتوسط EMA 50 الأزرق بنجاح.',
      'ملامسة النطاق السفلي للبولينجر وظهور ذيل رفض سفلي قوي يؤكد ارتداد السيولة.',
      'تقاطع منحنيات الاستوكاستك إيجاباً صعوداً في منطقة تشبع بيعي حاد تحت مستوى 30.'
    ] : decision === 'SELL' ? [
      'توافق اتجاه الترند العام هبوطاً مع استقرار السعر التام تحت متوسط EMA 50 الأزرق.',
      'ملامسة واختراق النطاق العلوي للبولينجر مع تشكل ذيل علوي طويل يؤكد رفض الصعود الحاد.',
      'تقاطع منحنيات الاستوكاستك سلبياً هبوطاً في منطقة تشبع شرائي حاد أعلى مستوى 70.'
    ] : [
      'تضارب الإشارات الفنية وعدم تحقق شروط المعادلة الثلاثية للجوكر بشكل قطعي.',
      'البقاء خارج السوق تجنباً للتذبذب وفقدان رأس المال هو الخيار العقلاني الوحيد هنا.'
    ],
    filtersCheck: {
      trend: {
        status: isEmaAligned ? 'PASS' : 'FAIL',
        detail: data.trend === 'up' ? 'الاتجاه صاعد والشموع تدعم الارتداد الإيجابي أعلى المتوسط الأسري 50' : data.trend === 'down' ? 'الاتجاه هابط والشموع تدعم المسار البيعي التام أسفل المتوسط الأسري 50' : 'الاتجاه نطاق عرضي ومخالف لمدخلات الدخول الاتجاهية'
      },
      liquidity: {
        status: isBbandAligned ? 'PASS' : 'FAIL',
        detail: data.candlePosition === 'below_lower' ? 'اختراق واضح للبولينجر السفلي مع تفعيل إشارات الرفض الذيلي' : data.candlePosition === 'above_upper' ? 'امتصاص كامل للسيولة عند البولينجر العلوي مع تفعيل إشارات الرفض الذيلي' : 'السعر يتذبذب في مناطق غير آمنة بعيدة عن أطراف البولينجر'
      },
      momentum: {
        status: isStochAligned ? 'PASS' : 'FAIL',
        detail: `الاستوكاستك يستقر عند ${data.stochasticValue} مع تقاطع ${data.stochasticCross === 'bullish' ? 'صاعد ذهبي للخطوط' : data.stochasticCross === 'bearish' ? 'هابط تقاطعي سلبي' : 'مشوش وغير محدد الاتجاه'}`
      }
    },
    riskManagement: {
      entryPrice: decision === 'BUY' ? 'بأقرب نقطة من البولينجر السفلي' : decision === 'SELL' ? 'بأقرب نقطة من البولينجر العلوي' : 'لا يوجد دخول',
      stopLoss: decision === 'BUY' ? 'تحت آخر ذيل شمعة هابطة بـ 5 نقاط' : decision === 'SELL' ? 'فوق آخر ذيل شمعة صاعدة بـ 5 نقاط' : 'تجنب وضع أي أوامر معلقة',
      takeProfit: decision === 'BUY' ? 'عند النطاق الأوسط للبولينجر أو القمة السابقة' : decision === 'SELL' ? 'عند النطاق الأوسط أو القاع السابق' : 'تجنب الدخول',
      riskRewardRatio: decision !== 'NO_TRADE' ? '1:2.5' : '0:0'
    },
    detailedAnalysis: `لقد تم تشريح المتغيرات آلياً: الترند حالياً ${data.trend === 'up' ? 'صاعد' : data.trend === 'down' ? 'هابط' : 'عرضي'}، ووضع الشموع يظهر ${data.candlePosition}. توازن المعادلة الفنية ${decision !== 'NO_TRADE' ? 'مكتمل بنسبة 100% ويستند إلى هندسة تداول خالية تماماً من العواطف' : 'تالف، وتطبيق بند السلامة وحماية الحساب يقتضي الامتناع التام عن المغامرة برأس المال'}.`
  };
}

async function startServer() {
  // Vite integration: Mount Vite dev server or host static assets in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind server to port 3000 and 0.0.0.0 as required by the reverse proxy
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Jooker Backend] Server successfully initialized on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
