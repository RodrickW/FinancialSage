import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types';
import { Plus, Trash2, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';

interface Debt {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minPayment: number;
}

function calcPayoffMonths(balance: number, apr: number, payment: number): number {
  if (payment <= 0 || balance <= 0) return 0;
  const r = apr / 100 / 12;
  if (r === 0) return Math.ceil(balance / payment);
  const n = -Math.log(1 - (r * balance) / payment) / Math.log(1 + r);
  return isFinite(n) && n > 0 ? Math.ceil(n) : 999;
}

function calcTotalInterest(balance: number, apr: number, payment: number): number {
  const months = calcPayoffMonths(balance, apr, payment);
  if (months >= 999) return balance * 10;
  return Math.max(0, payment * months - balance);
}

function snowball(debts: Debt[], extra: number) {
  const sorted = [...debts].sort((a, b) => a.balance - b.balance);
  return simulate(sorted, extra);
}

function avalanche(debts: Debt[], extra: number) {
  const sorted = [...debts].sort((a, b) => b.apr - a.apr);
  return simulate(sorted, extra);
}

function simulate(debts: Debt[], extra: number) {
  const state = debts.map(d => ({ ...d, remaining: d.balance }));
  let month = 0;
  let totalInterest = 0;
  const timeline: { month: number; total: number }[] = [];

  while (state.some(d => d.remaining > 0) && month < 600) {
    month++;
    let extraPool = extra;

    for (let i = 0; i < state.length; i++) {
      if (state[i].remaining <= 0) continue;
      const r = state[i].apr / 100 / 12;
      const interest = state[i].remaining * r;
      totalInterest += interest;
      state[i].remaining += interest;

      let pay = state[i].minPayment;
      if (i === state.findIndex(d => d.remaining > 0)) {
        pay += extraPool;
      }
      pay = Math.min(pay, state[i].remaining);
      state[i].remaining = Math.max(0, state[i].remaining - pay);
    }

    if (month % 6 === 0) {
      timeline.push({ month, total: Math.round(state.reduce((s, d) => s + d.remaining, 0)) });
    }
  }
  return { months: month, totalInterest: Math.round(totalInterest), timeline };
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6'];

export default function DebtPayoff() {
  const { data: userData } = useQuery({ queryKey: ['/api/users/profile'] });
  const user = userData as UserProfile;

  const [method, setMethod] = useState<'snowball' | 'avalanche'>('avalanche');
  const [extra, setExtra] = useState(100);
  const [debts, setDebts] = useState<Debt[]>([
    { id: '1', name: 'Credit Card', balance: 4500, apr: 22.99, minPayment: 120 },
    { id: '2', name: 'Car Loan', balance: 8200, apr: 6.5, minPayment: 210 },
    { id: '3', name: 'Student Loan', balance: 15000, apr: 5.0, minPayment: 180 },
  ]);

  const [newDebt, setNewDebt] = useState({ name: '', balance: '', apr: '', minPayment: '' });
  const [showAdd, setShowAdd] = useState(false);

  const addDebt = () => {
    if (!newDebt.name || !newDebt.balance) return;
    setDebts(prev => [...prev, {
      id: Date.now().toString(),
      name: newDebt.name,
      balance: parseFloat(newDebt.balance) || 0,
      apr: parseFloat(newDebt.apr) || 0,
      minPayment: parseFloat(newDebt.minPayment) || 25,
    }]);
    setNewDebt({ name: '', balance: '', apr: '', minPayment: '' });
    setShowAdd(false);
  };

  const removeDebt = (id: string) => setDebts(prev => prev.filter(d => d.id !== id));

  const result = useMemo(() => {
    if (debts.length === 0) return null;
    return method === 'snowball' ? snowball(debts, extra) : avalanche(debts, extra);
  }, [debts, extra, method]);

  const noExtraResult = useMemo(() => {
    if (debts.length === 0) return null;
    return method === 'snowball' ? snowball(debts, 0) : avalanche(debts, 0);
  }, [debts, method]);

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const monthsSaved = noExtraResult && result ? noExtraResult.months - result.months : 0;
  const interestSaved = noExtraResult && result ? noExtraResult.totalInterest - result.totalInterest : 0;

  const chartData = debts.map(d => ({
    name: d.name,
    balance: d.balance,
    payoff: calcPayoffMonths(d.balance, d.apr, d.minPayment + (method === 'snowball'
      ? (debts.sort((a, b) => a.balance - b.balance)[0]?.id === d.id ? extra : 0)
      : (debts.sort((a, b) => b.apr - a.apr)[0]?.id === d.id ? extra : 0)))
  }));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <TopNav title="Debt Payoff Planner" />

      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full px-4 py-5 space-y-5">

        {/* Method Toggle */}
        <Card className="section-card border-0">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-3 font-medium">PAYOFF STRATEGY</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMethod('snowball')}
                className={`p-3 rounded-xl text-left border-2 transition-all ${method === 'snowball' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}
              >
                <p className="font-semibold text-sm text-gray-900">❄️ Snowball</p>
                <p className="text-xs text-gray-500 mt-0.5">Smallest balance first — builds momentum</p>
              </button>
              <button
                onClick={() => setMethod('avalanche')}
                className={`p-3 rounded-xl text-left border-2 transition-all ${method === 'avalanche' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}
              >
                <p className="font-semibold text-sm text-gray-900">🏔️ Avalanche</p>
                <p className="text-xs text-gray-500 mt-0.5">Highest interest first — saves most money</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Extra Payment */}
        <Card className="section-card border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium text-gray-700">Extra monthly payment</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">$</span>
                <Input
                  type="number"
                  value={extra}
                  onChange={e => setExtra(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-28 h-8 text-sm"
                  min={0}
                />
              </div>
            </div>
            {monthsSaved > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 text-xs whitespace-nowrap">
                {monthsSaved} mo. faster
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {result && (
          <div className="grid grid-cols-3 gap-3">
            <div className="metric-card text-center">
              <p className="text-xs text-gray-500 mb-1">Total Debt</p>
              <p className="text-base font-bold text-gray-900">${totalBalance.toLocaleString()}</p>
            </div>
            <div className="metric-card text-center">
              <p className="text-xs text-gray-500 mb-1">Debt-Free In</p>
              <p className="text-base font-bold text-emerald-600">
                {result.months >= 12 ? `${Math.floor(result.months / 12)}y ${result.months % 12}m` : `${result.months}mo`}
              </p>
            </div>
            <div className="metric-card text-center">
              <p className="text-xs text-gray-500 mb-1">Interest Saved</p>
              <p className="text-base font-bold text-blue-600">${interestSaved.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Debt List */}
        <Card className="section-card border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-700">Your Debts</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="h-7 text-xs rounded-lg">
                <Plus className="w-3 h-3 mr-1" /> Add Debt
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAdd && (
              <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input value={newDebt.name} onChange={e => setNewDebt(p => ({ ...p, name: e.target.value }))} placeholder="Credit Card" className="h-8 text-xs mt-0.5" />
                  </div>
                  <div>
                    <Label className="text-xs">Balance ($)</Label>
                    <Input type="number" value={newDebt.balance} onChange={e => setNewDebt(p => ({ ...p, balance: e.target.value }))} placeholder="5000" className="h-8 text-xs mt-0.5" />
                  </div>
                  <div>
                    <Label className="text-xs">APR (%)</Label>
                    <Input type="number" value={newDebt.apr} onChange={e => setNewDebt(p => ({ ...p, apr: e.target.value }))} placeholder="19.9" className="h-8 text-xs mt-0.5" />
                  </div>
                  <div>
                    <Label className="text-xs">Min Payment ($)</Label>
                    <Input type="number" value={newDebt.minPayment} onChange={e => setNewDebt(p => ({ ...p, minPayment: e.target.value }))} placeholder="100" className="h-8 text-xs mt-0.5" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addDebt} className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs rounded-lg flex-1">Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="h-7 text-xs rounded-lg">Cancel</Button>
                </div>
              </div>
            )}

            {debts.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs text-gray-500">${d.balance.toLocaleString()} · {d.apr}% APR · ${d.minPayment}/mo min</p>
                </div>
                <button onClick={() => removeDebt(d.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payoff Timeline Chart */}
        {result && result.timeline.length > 0 && (
          <Card className="section-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                Total Debt Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={result.timeline} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tickFormatter={v => `Mo ${v}`} tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={45} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Remaining']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

      </main>

      {user && <BottomNavigation user={user} />}
    </div>
  );
}
