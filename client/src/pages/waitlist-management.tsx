import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WaitlistManagementData } from "@/types/dashboard";

export default function WaitlistManagement() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const isTr = language === "tr";
  const [email, setEmail] = useState("");

  const { data, refetch } = useQuery<WaitlistManagementData>({
    queryKey: ["/api/waitlist"],
  });

  // Type the waitlist data
  const waitlist = Array.isArray(data?.waitlist) ? data.waitlist : [];

  const handleAddToWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/waitlist", "POST", {
        email,
        firstName: "",
        lastName: "",
      });
      toast({
        title: isTr ? "Başarılı" : "Success",
        description: isTr
          ? "Bekleme listesine eklendi"
          : "Added to waitlist",
      });
      setEmail("");
      refetch();
    } catch (error) {
      toast({
        title: isTr ? "Hata" : "Error",
        description: isTr ? "Bir hata oluştu" : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">
              {isTr ? "Bekleme Listesi" : "Waitlist Management"}
            </h1>
            <p className="text-slate-400">
              {isTr
                ? "Erken erişim talebi ve lead yönetimi"
                : "Manage early access requests and leads"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {isTr ? "Beklemede" : "Waiting"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">
                  {waitlist?.filter((w: any) => !w.hasSignedUp).length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  {isTr ? "Dönüştürülen" : "Converted"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">
                  {waitlist?.filter((w: any) => w.hasSignedUp).length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-400">
                  {isTr ? "Dönüşüm Oranı" : "Conversion Rate"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-400">
                  {waitlist
                    ? Math.round(
                        (waitlist.filter((w: any) => w.hasSignedUp).length /
                          waitlist.length) *
                          100
                      )
                    : 0}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add to Waitlist Form */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>{isTr ? "Listeye Ekle" : "Add to Waitlist"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddToWaitlist} className="flex gap-2">
                <Input
                  type="email"
                  placeholder={isTr ? "E-posta adresi" : "Email address"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button className="bg-blue-500 hover:bg-blue-600">
                  {isTr ? "Ekle" : "Add"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Waitlist Table */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>{isTr ? "Bekleyen Kullanıcılar" : "Waitlist Users"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {waitlist?.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 bg-slate-700/30 rounded"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.email}</p>
                      <p className="text-xs text-slate-400">
                        {isTr ? "Pozisyon" : "Position"}: #{item.position || i + 1}
                      </p>
                    </div>
                    <div className="text-right">
                      {item.hasSignedUp ? (
                        <span className="text-green-400 text-sm font-medium">
                          {isTr ? "Dönüştürüldü" : "Converted"}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-sm">
                          {isTr ? "Beklemede" : "Pending"}
                        </span>
                      )}
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
