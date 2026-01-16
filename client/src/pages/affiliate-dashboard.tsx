import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Users, BarChart3 } from "lucide-react";

interface AffiliateData {
  totalEarnings?: number | string;
  referralsCount?: number;
  commissionRate?: number | string;
  affiliateCode?: string;
}

interface AffiliateTransaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  transactionType?: string;
  createdAt?: string;
  status?: string;
}

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isTr = language === "tr";

  const { data: affiliateData } = useQuery<AffiliateData>({
    queryKey: ["/api/affiliate/account"],
  });

  const { data: transactions } = useQuery<AffiliateTransaction[]>({
    queryKey: ["/api/affiliate/transactions"],
  });

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">
              {isTr ? "Afiliasyon Panosu" : "Affiliate Dashboard"}
            </h1>
            <p className="text-slate-400">
              {isTr
                ? "Komisyonlarınızı ve kazançlarınızı takip edin"
                : "Track commissions and earnings"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400">
                  {isTr ? "Toplam Kazanç" : "Total Earnings"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">
                  ${affiliateData?.totalEarnings || "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400">
                  {isTr ? "Başarılı Davetler" : "Successful Referrals"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">
                  {affiliateData?.referralsCount || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400">
                  {isTr ? "Komisyon Oranı" : "Commission Rate"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-400">
                  {affiliateData?.commissionRate || "15"}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400">
                  {isTr ? "Durum" : "Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-400">
                  {isTr ? "Aktif" : "Active"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Affiliate Code */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>{isTr ? "Afiliasyon Kodunuz" : "Your Affiliate Code"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded border border-slate-600">
                <p className="text-sm text-slate-400 mb-2">
                  {isTr ? "Kodunuz" : "Your Code"}
                </p>
                <p className="text-2xl font-mono font-bold text-cyan-400">
                  {affiliateData?.affiliateCode || "AFFILIATE2025"}
                </p>
              </div>
              <p className="text-slate-400 text-sm">
                {isTr
                  ? "Bu kodu arkadaşlarınıza paylaşın ve her başarılı kaydı için komisyon kazanın"
                  : "Share this code with friends and earn commission for each sign-up"}
              </p>
              <Button className="bg-blue-500 hover:bg-blue-600">
                {isTr ? "Kodu Kopyala" : "Copy Code"}
              </Button>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>{isTr ? "İşlem Geçmişi" : "Transaction History"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(transactions || []).slice(0, 5).map((tx, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 bg-slate-700/30 rounded"
                  >
                    <div>
                      <p className="text-white font-medium">{tx.transactionType}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">${tx.amount}</p>
                      <p className="text-xs text-slate-400">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
