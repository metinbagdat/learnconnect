import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PageWrapper from "@/components/layout/page-wrapper";
import { useLanguage } from "@/contexts/consolidated-language-context";

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: language === "tr" ? "Hata" : "Error",
        description: language === "tr" ? "Şifreler eşleşmiyor" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: language === "tr" ? "Hata" : "Error",
        description: language === "tr" ? "Şifre en az 6 karakter olmalı" : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      toast({
        title: language === "tr" ? "Başarılı" : "Success",
        description: data.message,
      });
      setTimeout(() => setLocation("/login"), 2000);
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

  if (!token) {
    return (
      <PageWrapper currentPage="Reset Password" showBackButton={true} backUrl="/login">
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {language === "tr"
                  ? "Geçersiz veya eksik sıfırlama linki. Lütfen yeni bir link talep edin."
                  : "Invalid or missing reset link. Please request a new one."}
              </p>
              <Link href="/forgot-password">
                <Button className="w-full mt-4">
                  {language === "tr" ? "Yeni Link Talep Et" : "Request New Link"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      currentPage={language === "tr" ? "Şifre Sıfırla" : "Reset Password"}
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
                {language === "tr" ? "Yeni Şifre Belirle" : "Set New Password"}
              </CardTitle>
              <CardDescription>
                {language === "tr"
                  ? "Hesabınız için yeni bir şifre girin."
                  : "Enter a new password for your account."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {language === "tr" ? "Yeni Şifre" : "New Password"}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">
                    {language === "tr" ? "Şifre Tekrar" : "Confirm Password"}
                  </Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "..." : (language === "tr" ? "Şifreyi Güncelle" : "Update Password")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
