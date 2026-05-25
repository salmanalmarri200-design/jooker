/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChartScenario {
  id: string;
  name: string;
  description: string;
  trend: 'up' | 'down' | 'range';
  candlePosition: 'above_upper' | 'below_lower' | 'on_ema' | 'middle';
  wickType: 'long_upper' | 'long_lower' | 'none';
  stochasticValue: number; // 0 to 100
  stochasticCross: 'bullish' | 'bearish' | 'none';
  sampleImageName?: string;
}

export interface AnalysisResult {
  decision: 'BUY' | 'SELL' | 'NO_TRADE';
  confidence: number; // percentage
  reasons: string[];
  filtersCheck: {
    trend: {
      status: 'PASS' | 'FAIL';
      detail: string;
    };
    liquidity: {
      status: 'PASS' | 'FAIL';
      detail: string;
    };
    momentum: {
      status: 'PASS' | 'FAIL';
      detail: string;
    };
  };
  riskManagement: {
    entryPrice: string;
    stopLoss: string;
    takeProfit: string;
    riskRewardRatio: string;
  };
  detailedAnalysis: string;
}
