import { motion } from "framer-motion";
import { Check, Zap, Crown, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AuthGuard from "@/components/auth/AuthGuard";
import MainNavbar from "@/components/layout/MainNavbar";
import { useLanguage } from "@/contexts/consolidated-language-context";

const PLANS = [
  {
    id: "free",
    name: "Ücretsiz",
    nameEn: "Free",
    price: 0,
    period: "",
    icon: Zap,
    features: ["Temel TYT takibi", "Sınırlı AI plan", "5 deneme/ay", "Temel gamification"],
    cta: "Mevcut Plan",
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    nameEn: "Premium",
    price: 149,
    period: "ay",
    icon: Crown,
    features: [
      "Sınırsız AI plan",
      "Spaced repetition",
      "Sınırsız deneme",
      "Tam gamification",
      "Öncelikli destek",
    ],
    cta: "Yakında",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Kurumsal",
    nameEn: "Enterprise",
    price: 299,
    period: "ay",
    icon: Building2,
    features: [
      "Premium özellikler",
      "Çoklu kullanıcı",
      "Admin paneli",
      "Analitik raporlar",
      "Özel entegrasyon",
    ],
    cta: "Yakında",
    popular: false,
  },
];

export default function AbonelikPage() {
  const { language } = useLanguage();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950">
        <MainNavbar />
        <main className="max-w-5xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {language === "tr" ? "Abonelik Planları" : "Subscription Plans"}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === "tr"
                ? "TYT/AYT hazırlığınız için en uygun planı seçin. Ödeme sistemi bağlandığında aktif olacaktır."
                : "Choose the best plan for your TYT/AYT preparation. Payment integration coming soon."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className={`relative h-full flex flex-col ${
                      plan.popular ? "border-2 border-blue-500 shadow-lg" : ""
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                        {language === "tr" ? "Popüler" : "Popular"}
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-8 w-8 text-blue-600" />
                        <CardTitle>
                          {language === "tr" ? plan.name : plan.nameEn}
                        </CardTitle>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          {plan.price === 0
                            ? language === "tr"
                              ? "Ücretsiz"
                              : "Free"
                            : `₺${plan.price}`}
                        </span>
                        {plan.period && (
                          <span className="text-muted-foreground">/{plan.period}</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ul className="space-y-3 mb-6 flex-1">
                        {plan.features.map((f, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={plan.id === "free" ? "outline" : "default"}
                        disabled={plan.id !== "free"}
                      >
                        {plan.cta}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {language === "tr"
              ? "Ödeme: Stripe veya iyzico entegrasyonu yakında aktif olacaktır."
              : "Payment: Stripe or iyzico integration coming soon."}
          </p>
        </main>
      </div>
    </AuthGuard>
  );
}
