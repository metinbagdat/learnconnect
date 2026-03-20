import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Star, Zap, Award, Trophy, Target, BookOpen, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AuthGuard from "@/components/auth/AuthGuard";
import MainNavbar from "@/components/layout/MainNavbar";
import { useLanguage } from "@/contexts/consolidated-language-context";

const BADGES = [
  { id: "first_login", icon: Star, title: "İlk Giriş", desc: "İlk kez giriş yaptın", xp: 10 },
  { id: "streak_7", icon: Flame, title: "7 Gün Seri", desc: "7 gün üst üste çalış", xp: 50 },
  { id: "first_trial", icon: BookOpen, title: "İlk Deneme", desc: "İlk deneme sınavını tamamla", xp: 25 },
  { id: "net_target", icon: Target, title: "Net Hedefi", desc: "Net hedefini tutturun", xp: 100 },
  { id: "streak_30", icon: Flame, title: "30 Gün Seri", desc: "30 gün üst üste çalış", xp: 200 },
  { id: "xp_500", icon: Zap, title: "500 XP", desc: "500 XP'ye ulaş", xp: 0 },
  { id: "level_5", icon: Trophy, title: "Seviye 5", desc: "5. seviyeye ulaş", xp: 0 },
];

export default function BasarilarPage() {
  const { language } = useLanguage();
  const { data } = useQuery({
    queryKey: ["/api/user/gamification"],
    queryFn: async () => {
      const res = await fetch("/api/user/gamification", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const level = data?.level ?? 1;
  const currentXp = data?.currentXp ?? 0;
  const totalXp = data?.totalXp ?? 0;
  const nextLevelXp = data?.nextLevelXp ?? 500;
  const streak = data?.streak ?? 0;
  const xpProgress = nextLevelXp > 0 ? Math.min(100, (currentXp / nextLevelXp) * 100) : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950">
        <MainNavbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            {language === "tr" ? "Başarılar" : "Achievements"}
          </h1>

          {/* XP & Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-amber-500" />
                  {language === "tr" ? "Seviye ve XP" : "Level & XP"}
                </CardTitle>
                <CardDescription>
                  Seviye {level} • {totalXp} toplam XP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentXp} / {nextLevelXp} XP</span>
                    <span>Seviye {level + 1}'e</span>
                  </div>
                  <Progress value={xpProgress} className="h-4" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-6 w-6 text-orange-500" />
                  {language === "tr" ? "Çalışma Serisi" : "Study Streak"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-orange-600">{streak}</p>
                <p className="text-muted-foreground">
                  {language === "tr" ? "gün üst üste çalışıldı" : "days in a row"}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4">
              {language === "tr" ? "Rozetler" : "Badges"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {BADGES.map((badge, i) => {
                const Icon = badge.icon;
                const unlocked = (badge.id === "first_login" && totalXp >= 0) || 
                  (badge.id === "streak_7" && streak >= 7) ||
                  (badge.id === "first_trial" && totalXp >= 25) ||
                  (badge.id === "net_target" && totalXp >= 100) ||
                  (badge.id === "streak_30" && streak >= 30) ||
                  (badge.id === "xp_500" && totalXp >= 500) ||
                  (badge.id === "level_5" && level >= 5);
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Card className={unlocked ? "" : "opacity-60"}>
                      <CardContent className="pt-6 text-center">
                        <div
                          className={`inline-flex p-4 rounded-full mb-2 ${
                            unlocked ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Icon className="h-8 w-8" />
                        </div>
                        <p className="font-semibold text-sm">{badge.title}</p>
                        <p className="text-xs text-muted-foreground">{badge.desc}</p>
                        {badge.xp > 0 && (
                          <p className="text-xs text-amber-600 mt-1">+{badge.xp} XP</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </main>
      </div>
    </AuthGuard>
  );
}
