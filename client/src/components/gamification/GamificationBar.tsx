import { useQuery } from '@tanstack/react-query';
import { Flame, Star, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function GamificationBar() {
  const { data } = useQuery({
    queryKey: ['/api/user/gamification'],
    queryFn: async () => {
      const res = await fetch('/api/user/gamification', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
  });

  const { level = 1, currentXp = 0, nextLevelXp = 500, streak = 0, badgeCount = 0 } = data || {};
  const xpProgress = nextLevelXp > 0 ? Math.min(100, (currentXp / nextLevelXp) * 100) : 0;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white/80 dark:bg-slate-900/80 border-b backdrop-blur-sm">
      <div className="flex items-center gap-2" title="Seri (Streak)">
        <Flame className="h-5 w-5 text-orange-500" />
        <span className="font-semibold text-orange-600 dark:text-orange-400">{streak}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">gün</span>
      </div>
      <div className="flex-1 max-w-[140px] sm:max-w-[180px]">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-medium">Lvl {level}</span>
        </div>
        <Progress value={xpProgress} className="h-1.5" />
      </div>
      <div className="flex items-center gap-1.5" title="Rozetler">
        <Star className="h-5 w-5 text-amber-500" />
        <span className="font-semibold">{badgeCount}</span>
      </div>
    </div>
  );
}
