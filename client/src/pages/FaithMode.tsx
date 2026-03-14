import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TopNav from '@/components/TopNav';
import BottomNavigation from '@/components/BottomNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types';
import { Heart, BookOpen, Star, DollarSign, TrendingUp, Gift } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const SCRIPTURES = [
  { verse: '"Bring the whole tithe into the storehouse... and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it."', ref: 'Malachi 3:10' },
  { verse: '"Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap."', ref: 'Luke 6:38' },
  { verse: '"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver."', ref: '2 Corinthians 9:7' },
  { verse: '"Honor the Lord with your wealth, with the firstfruits of all your crops."', ref: 'Proverbs 3:9' },
  { verse: '"Command them to do good, to be rich in good deeds, and to be generous and willing to share."', ref: '1 Timothy 6:18' },
  { verse: '"Do not store up for yourselves treasures on earth... but store up for yourselves treasures in heaven."', ref: 'Matthew 6:19-20' },
  { verse: '"Whoever sows sparingly will also reap sparingly, and whoever sows generously will also reap generously."', ref: '2 Corinthians 9:6' },
  { verse: '"The generous will themselves be blessed, for they share their food with the poor."', ref: 'Proverbs 22:9' },
  { verse: '"A generous person will prosper; whoever refreshes others will be refreshed."', ref: 'Proverbs 11:25' },
  { verse: '"And my God will meet all your needs according to the riches of his glory in Christ Jesus."', ref: 'Philippians 4:19' },
  { verse: '"For God so loved the world that he gave his one and only Son."', ref: 'John 3:16' },
  { verse: '"No one can serve two masters. Either you will hate the one and love the other... You cannot serve both God and money."', ref: 'Matthew 6:24' },
];

function getDailyScripture() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return SCRIPTURES[dayOfYear % SCRIPTURES.length];
}

function getGenerosityGrade(pct: number) {
  if (pct >= 15) return { grade: 'A+', label: 'Super Generous', color: 'text-purple-600', bg: 'bg-purple-50' };
  if (pct >= 10) return { grade: 'A', label: 'Full Tithe', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (pct >= 7) return { grade: 'B', label: 'Growing Giver', color: 'text-blue-600', bg: 'bg-blue-50' };
  if (pct >= 5) return { grade: 'C', label: 'First Steps', color: 'text-amber-600', bg: 'bg-amber-50' };
  if (pct >= 1) return { grade: 'D', label: 'Getting Started', color: 'text-orange-500', bg: 'bg-orange-50' };
  return { grade: '—', label: 'Set your giving goal', color: 'text-gray-400', bg: 'bg-gray-50' };
}

export default function FaithMode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scripture = getDailyScripture();

  const { data: userData } = useQuery({ queryKey: ['/api/users/profile'] });
  const user = userData as UserProfile;

  const { data: transactionsRaw } = useQuery<any[]>({ queryKey: ['/api/transactions'] });

  const [monthlyIncome, setMonthlyIncome] = useState(3000);
  const [tithePercent, setTithePercent] = useState(10);
  const [actualGiving, setActualGiving] = useState(0);
  const [givingGoal, setGivingGoal] = useState(10);

  const titheAmount = useMemo(() => (monthlyIncome * tithePercent) / 100, [monthlyIncome, tithePercent]);
  const annualTithe = titheAmount * 12;
  const actualPct = monthlyIncome > 0 ? (actualGiving / monthlyIncome) * 100 : 0;
  const grade = getGenerosityGrade(actualPct);
  const goalAmount = (monthlyIncome * givingGoal) / 100;
  const progressToGoal = goalAmount > 0 ? Math.min(100, (actualGiving / goalAmount) * 100) : 0;

  const updateFaithMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/users/notification-preferences', { faithModeEnabled: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/profile'] });
      toast({ title: 'Faith Mode saved' });
    }
  });

  if (!(user as any)?.faithModeEnabled) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50/50">
        <TopNav title="Faith Mode" />
        <main className="flex-1 pb-24 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Faith Mode</h2>
            <p className="text-gray-500 text-sm mb-6">
              Integrate your faith into your finances with tithing tracking, generosity scoring, and daily scripture.
            </p>
            <p className="text-xs text-gray-400">Enable Faith Mode in your Settings to access this page.</p>
          </div>
        </main>
        {user && <BottomNavigation user={user} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <TopNav title="Faith Mode" />

      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full px-4 py-5 space-y-5">

        {/* Daily Scripture */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-purple-200" />
            <span className="text-purple-200 text-xs font-medium uppercase tracking-wide">Today's Scripture</span>
          </div>
          <blockquote className="text-sm leading-relaxed italic text-purple-50 mb-2">
            {scripture.verse}
          </blockquote>
          <p className="text-purple-300 text-xs font-semibold text-right">— {scripture.ref}</p>
        </div>

        {/* Generosity Score */}
        <Card className="section-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Generosity Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500">Monthly income</Label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-gray-400 text-sm">$</span>
                  <Input
                    type="number"
                    value={monthlyIncome}
                    onChange={e => setMonthlyIncome(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Actual giving this month</Label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-gray-400 text-sm">$</span>
                  <Input
                    type="number"
                    value={actualGiving}
                    onChange={e => setActualGiving(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-4 ${grade.bg} flex items-center gap-4`}>
              <div className="text-center">
                <p className={`text-4xl font-black ${grade.color}`}>{grade.grade}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{grade.label}</p>
                <p className="text-sm text-gray-600">You gave {actualPct.toFixed(1)}% of your income</p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Giving goal: {givingGoal}%</span>
                <span>${goalAmount.toFixed(0)}/mo</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progressToGoal}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{progressToGoal.toFixed(0)}% of goal</span>
                <span>Goal: {givingGoal}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Giving goal (%)</Label>
              <Slider min={1} max={25} step={1} value={[givingGoal]} onValueChange={([v]) => setGivingGoal(v)} />
              <div className="flex justify-between text-xs text-gray-400"><span>1%</span><span>25%</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Tithing Calculator */}
        <Card className="section-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Tithing Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-gray-700">Tithe percentage</Label>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-bold">{tithePercent}%</Badge>
              </div>
              <Slider min={1} max={25} step={1} value={[tithePercent]} onValueChange={([v]) => setTithePercent(v)} />
              <div className="flex justify-between text-xs text-gray-400"><span>1%</span><span>25%</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-xs text-emerald-600 mb-1">Monthly Tithe</p>
                <p className="text-xl font-bold text-emerald-700">${titheAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <p className="text-xs text-purple-600 mb-1">Annual Tithe</p>
                <p className="text-xl font-bold text-purple-700">${annualTithe.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-600 mb-1">That's just</p>
              <p className="text-sm font-semibold text-amber-800">
                ${(titheAmount / 30).toFixed(2)}/day or ${(titheAmount / 4.33).toFixed(2)}/week
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Generosity Tips */}
        <Card className="section-card border-0 bg-purple-50/50">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-purple-900 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Generosity Ideas
            </p>
            {[
              'Set up automatic giving to your church or charity',
              'Round up purchases and donate the difference',
              'Give an extra $5–10 whenever you eat out',
              'Dedicate one meal\'s cost per week to a food bank',
              'Volunteer time — it\'s generosity too!'
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-purple-600 text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-purple-800">{tip}</p>
              </div>
            ))}
          </CardContent>
        </Card>

      </main>

      {user && <BottomNavigation user={user} />}
    </div>
  );
}
