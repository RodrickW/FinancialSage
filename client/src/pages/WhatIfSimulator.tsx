import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types';
import { TrendingUp, PiggyBank, CreditCard, DollarSign, Zap } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

function formatDollars(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function buildProjection(
  extraSavings: number,
  debtPayment: number,
  spendingCut: number,
  years = 5
) {
  const months = years * 12;
  const RATE = 0.07 / 12; // 7% annual return / month
  const baselineSavings = 200; // assumed baseline $200/month

  const data = [];
  let baseline = 0;
  let optimized = 0;

  for (let m = 1; m <= months; m++) {
    baseline = baseline * (1 + RATE) + baselineSavings;
    const monthlyContrib = baselineSavings + extraSavings + spendingCut;
    optimized = optimized * (1 + RATE) + monthlyContrib;

    if (m % 12 === 0) {
      data.push({
        year: `Yr ${m / 12}`,
        Baseline: Math.round(baseline),
        Optimized: Math.round(optimized),
        Difference: Math.round(optimized - baseline)
      });
    }
  }
  return data;
}

function buildDebtPayoff(extra: number) {
  const BALANCE = 8500;
  const APR = 0.19;
  const MIN = 200;
  const rate = APR / 12;

  const months = (p: number) => {
    if (p <= 0) return 999;
    let bal = BALANCE;
    let m = 0;
    while (bal > 0 && m < 1000) {
      bal = bal * (1 + rate) - p;
      m++;
    }
    return m;
  };

  const baseline = months(MIN);
  const optimized = months(MIN + extra);
  const interestBase = (MIN * baseline) - BALANCE;
  const interestOpt = ((MIN + extra) * optimized) - BALANCE;

  return {
    baselineMonths: baseline,
    optimizedMonths: optimized,
    monthsSaved: baseline - optimized,
    interestSaved: Math.max(0, interestBase - interestOpt)
  };
}

export default function WhatIfSimulator() {
  const [extraSavings, setExtraSavings] = useState(100);
  const [extraDebt, setExtraDebt] = useState(50);
  const [spendingCut, setSpendingCut] = useState(50);

  const { data: userData } = useQuery({ queryKey: ['/api/users/profile'] });
  const user = userData as UserProfile;

  const projection = useMemo(() => buildProjection(extraSavings, extraDebt, spendingCut), [extraSavings, extraDebt, spendingCut]);
  const debtInfo = useMemo(() => buildDebtPayoff(extraDebt), [extraDebt]);
  const totalGain = projection[projection.length - 1]?.Difference ?? 0;
  const monthlyBoost = extraSavings + spendingCut;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <TopNav title="What If Simulator" />

      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full px-4 py-5 space-y-5">

        {/* Hero */}
        <div className="section-card p-5 border-0 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white rounded-2xl">
          <div className="flex items-center gap-3 mb-1">
            <Zap className="w-5 h-5" />
            <h2 className="font-bold text-lg">See Your Future Money</h2>
          </div>
          <p className="text-emerald-100 text-sm">Move the sliders below to see how small changes compound over time.</p>
        </div>

        {/* Sliders */}
        <Card className="section-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Adjust Your Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-800">Extra monthly savings</span>
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-semibold">+${extraSavings}/mo</Badge>
              </div>
              <Slider
                min={0} max={1000} step={25}
                value={[extraSavings]}
                onValueChange={([v]) => setExtraSavings(v)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>$0</span><span>$1,000</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-800">Extra debt payment</span>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-semibold">+${extraDebt}/mo</Badge>
              </div>
              <Slider
                min={0} max={500} step={25}
                value={[extraDebt]}
                onValueChange={([v]) => setExtraDebt(v)}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>$0</span><span>$500</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-800">Monthly spending reduction</span>
                </div>
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 font-semibold">-${spendingCut}/mo</Badge>
              </div>
              <Slider
                min={0} max={500} step={25}
                value={[spendingCut]}
                onValueChange={([v]) => setSpendingCut(v)}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>$0</span><span>$500</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="metric-card text-center">
            <p className="text-xs text-gray-500 mb-1">5-Year Gain</p>
            <p className="text-lg font-bold text-emerald-600">{formatDollars(totalGain)}</p>
          </div>
          <div className="metric-card text-center">
            <p className="text-xs text-gray-500 mb-1">Monthly Boost</p>
            <p className="text-lg font-bold text-blue-600">{formatDollars(monthlyBoost)}</p>
          </div>
          <div className="metric-card text-center">
            <p className="text-xs text-gray-500 mb-1">Interest Saved</p>
            <p className="text-lg font-bold text-amber-600">{formatDollars(debtInfo.interestSaved)}</p>
          </div>
        </div>

        {/* Debt Payoff Info */}
        {extraDebt > 0 && (
          <Card className="section-card border-0 bg-blue-50/60">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Debt payoff scenario (example $8,500 balance @ 19% APR)</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Without extra payment: <strong>{debtInfo.baselineMonths} months</strong> · With +${extraDebt}/mo: <strong>{debtInfo.optimizedMonths} months</strong>
                  </p>
                  {debtInfo.monthsSaved > 0 && (
                    <p className="text-sm text-blue-700">
                      You'd be debt-free <strong>{debtInfo.monthsSaved} months sooner</strong> and save <strong>{formatDollars(debtInfo.interestSaved)}</strong> in interest.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 5-Year Projection Chart */}
        <Card className="section-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              5-Year Savings Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={projection} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => formatDollars(v)} tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v: number) => [formatDollars(v), '']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="Baseline" stroke="#94a3b8" fill="url(#colorBase)" strokeWidth={2} />
                <Area type="monotone" dataKey="Optimized" stroke="#059669" fill="url(#colorOpt)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400 text-center mt-2">Assumes 7% annual investment return. For illustration purposes.</p>
          </CardContent>
        </Card>

      </main>

      {user && <BottomNavigation user={user} />}
    </div>
  );
}
