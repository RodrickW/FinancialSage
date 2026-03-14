import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types';
import { Share2, Download, TrendingUp, TrendingDown, Target, Award, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#059669','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#10b981'];

function getMonthLabel() {
  const now = new Date();
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
}

function getGrade(savingsRate: number) {
  if (savingsRate >= 0.2) return { letter: 'A', color: 'text-emerald-600', label: 'Excellent saver!' };
  if (savingsRate >= 0.1) return { letter: 'B', color: 'text-blue-600', label: 'Good progress' };
  if (savingsRate >= 0.05) return { letter: 'C', color: 'text-amber-600', label: 'Room to grow' };
  return { letter: 'D', color: 'text-red-500', label: 'Let\'s improve this' };
}

export default function MoneyStory() {
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: userData } = useQuery({ queryKey: ['/api/users/profile'] });
  const user = userData as UserProfile;

  const { data: trendsRaw } = useQuery<any[]>({ queryKey: ['/api/spending-trends'] });
  const { data: budgetsRaw } = useQuery<any[]>({ queryKey: ['/api/budgets'] });
  const { data: transactionsRaw } = useQuery<any[]>({ queryKey: ['/api/transactions'] });
  const { data: accountsRaw } = useQuery<any[]>({ queryKey: ['/api/accounts'] });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthTxns = (transactionsRaw ?? []).filter((t: any) => {
    const d = new Date(t.date);
    return d >= monthStart && d <= now;
  });

  const income = monthTxns.filter((t: any) => (t.amount ?? 0) > 0).reduce((s: number, t: any) => s + t.amount, 0);
  const spent = Math.abs(monthTxns.filter((t: any) => (t.amount ?? 0) < 0).reduce((s: number, t: any) => s + t.amount, 0));
  const netSaved = income - spent;
  const savingsRate = income > 0 ? netSaved / income : 0;
  const grade = getGrade(savingsRate);

  const totalBalance = (accountsRaw ?? []).reduce((s: number, a: any) => s + (a.balance ?? 0), 0);
  const budgets = budgetsRaw ?? [];
  const budgetsOnTrack = budgets.filter((b: any) => (b.spent ?? 0) <= (b.amount ?? 0));

  // Category spending breakdown
  const categoryMap: Record<string, number> = {};
  monthTxns.filter((t: any) => (t.amount ?? 0) < 0).forEach((t: any) => {
    const cat = t.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] ?? 0) + Math.abs(t.amount);
  });
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  const biggestCategory = topCategories[0];
  const hasRealData = income > 0 || spent > 0;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'My Money Story', text: `This month I earned $${income.toFixed(0)}, spent $${spent.toFixed(0)}, and saved $${netSaved.toFixed(0)}. Grade: ${grade.letter}!` });
    } else {
      navigator.clipboard.writeText(`My ${getMonthLabel()} Money Story:\n💰 Income: $${income.toFixed(0)}\n💸 Spent: $${spent.toFixed(0)}\n🏦 Saved: $${netSaved.toFixed(0)}\n📊 Grade: ${grade.letter}`);
      alert('Summary copied to clipboard!');
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <TopNav title="Money Story" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-5 space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{getMonthLabel()} Recap</p>
            <h2 className="text-xl font-bold text-gray-900">Your Money Story</h2>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handlePrint} className="h-8 rounded-xl text-xs">
              <Download className="w-3.5 h-3.5 mr-1" /> Save
            </Button>
            <Button size="sm" onClick={handleShare} className="h-8 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <Share2 className="w-3.5 h-3.5 mr-1" /> Share
            </Button>
          </div>
        </div>

        {/* Shareable Card */}
        <div ref={cardRef} className="bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-emerald-200 text-xs font-medium uppercase tracking-wide">Mind My Money</p>
              <p className="font-bold text-lg">{getMonthLabel()} Recap</p>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-black ${grade.letter === 'A' ? 'text-yellow-300' : 'text-white'}`}>{grade.letter}</div>
              <p className="text-xs text-emerald-200">{grade.label}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-200" />
              <p className="text-lg font-bold">${income > 0 ? income.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</p>
              <p className="text-xs text-emerald-200">Income</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <TrendingDown className="w-4 h-4 mx-auto mb-1 text-red-200" />
              <p className="text-lg font-bold">${spent > 0 ? spent.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}</p>
              <p className="text-xs text-emerald-200">Spent</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <Target className="w-4 h-4 mx-auto mb-1 text-blue-200" />
              <p className={`text-lg font-bold ${netSaved >= 0 ? 'text-yellow-300' : 'text-red-300'}`}>
                {netSaved >= 0 ? '+' : ''}${netSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-emerald-200">Saved</p>
            </div>
          </div>

          {income > 0 && (
            <div className="bg-white/15 rounded-xl p-3 mb-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-emerald-200 text-xs">Savings rate</span>
                <span className="font-bold">{(savingsRate * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-300 rounded-full" style={{ width: `${Math.min(100, savingsRate * 100 * 5)}%` }} />
              </div>
            </div>
          )}

          {biggestCategory && (
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-emerald-100">Top spend: <strong className="text-white">{biggestCategory.name}</strong> — ${biggestCategory.value.toLocaleString()}</span>
            </div>
          )}
        </div>

        {!hasRealData && (
          <Card className="section-card border-0 bg-amber-50">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-amber-700">Connect your bank accounts to see your real Money Story with actual spending data.</p>
            </CardContent>
          </Card>
        )}

        {/* Spending Breakdown */}
        {topCategories.length > 0 && (
          <Card className="section-card border-0">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Where Did It Go?</p>
              <div className="flex flex-col md:flex-row items-center gap-3">
                <ResponsiveContainer width={180} height={150}>
                  <PieChart>
                    <Pie data={topCategories} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {topCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2 w-full">
                  {topCategories.map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-gray-600 flex-1 truncate">{cat.name}</span>
                      <span className="text-xs font-semibold text-gray-900">${cat.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget Health */}
        {budgets.length > 0 && (
          <Card className="section-card border-0">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Budget Health
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{budgetsOnTrack.length}</p>
                  <p className="text-xs text-gray-500">On Track</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">{budgets.length - budgetsOnTrack.length}</p>
                  <p className="text-xs text-gray-500">Over Budget</p>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${budgets.length > 0 ? (budgetsOnTrack.length / budgets.length) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{budgets.length > 0 ? Math.round((budgetsOnTrack.length / budgets.length) * 100) : 0}% of categories on track</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Net Worth Snapshot */}
        {(accountsRaw ?? []).length > 0 && (
          <Card className="section-card border-0">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Account Balances</p>
                <p className="text-xl font-bold text-gray-900">${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <Badge className="ml-auto bg-emerald-50 text-emerald-700 text-xs">{(accountsRaw ?? []).length} accounts</Badge>
            </CardContent>
          </Card>
        )}

      </main>

      {user && <BottomNavigation user={user} />}
    </div>
  );
}
