import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PageWrapper from "@/components/layout/page-wrapper";
import { useLanguage } from "@/contexts/consolidated-language-context";

export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      toast({
        title: language === "tr" ? "Başarılı" : "Success",
        description: data.message || (language === "tr" ? "E-posta gönderildi (kontrol edin)" : "Email sent (check inbox)"),
      });
      setEmail("");
    } catch (err: any) {
      toast({
        title: language === "tr" ? "Hata" : "Error",
        description: err.message || "Bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper
      currentPage={language === "tr" ? "Şifremi Unuttum" : "Forgot Password"}
      showBackButton={true}
      backUrl="/login"
    >
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "tr" ? "Şifremi Unuttum" : "Forgot Password"}
              </CardTitle>
              <CardDescription>
                {language === "tr"
                  ? "E-posta adresinizi girin, şifre sıfırlama linki göndereceğiz."
                  : "Enter your email and we'll send a password reset link."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {language === "tr" ? "E-posta" : "Email"}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "..." : (language === "tr" ? "Link Gönder" : "Send Link")}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link href="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {language === "tr" ? "Girişe Dön" : "Back to Login"}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
