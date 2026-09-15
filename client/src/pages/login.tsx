import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Eye, EyeOff, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BilingualText } from "@/components/ui/bilingual-text";
import PageWrapper from "@/components/layout/page-wrapper";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Redirect if already authenticated (role-based)
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const role = user.role || "student";
      if (role === "admin") setLocation("/admin");
      else if (role === "teacher") setLocation("/teacher");
      else setLocation("/tyt-dashboard");
    }
  }, [isAuthenticated, authLoading, user, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for session cookies
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      toast({
        title: language === "tr" ? "Giriş Başarılı" : "Login Successful",
        description:
          language === "tr"
            ? "Hoş geldiniz! Yönlendiriliyorsunuz..."
            : "Welcome! Redirecting...",
      });

      // Role-based redirect
      const role = data.role || "student";
      const redirectPath =
        role === "admin" ? "/admin" : role === "teacher" ? "/teacher" : "/tyt-dashboard";
      window.location.href = redirectPath;
    } catch (error: any) {
      toast({
        title: language === "tr" ? "Giriş Hatası" : "Login Error",
        description: error.message || (language === "tr" ? "Kullanıcı adı veya şifre hatalı" : "Invalid username or password"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper
      currentPage={language === "tr" ? "Giriş Yap" : "Login"}
      showBackButton={false}
    >
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              LearnConnect
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              <BilingualText text="TYT & AYT Akıllı Planlayıcı – TYT & AYT Smart Planner" />
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                <BilingualText text="Giriş Yap – Sign In" />
              </CardTitle>
              <CardDescription className="text-center">
                <BilingualText text="Hesabınıza giriş yapın – Sign in to your account" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">
                    <BilingualText text="Kullanıcı Adı – Username" />
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder={language === "tr" ? "Kullanıcı adınızı girin" : "Enter your username"}
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      required
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    <BilingualText text="Şifre – Password" />
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={language === "tr" ? "Şifrenizi girin" : "Enter your password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <BilingualText text="Giriş yapılıyor... – Signing in..." />
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <LogIn className="h-4 w-4 mr-2" />
                      <BilingualText text="Giriş Yap – Sign In" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  <BilingualText text="Şifremi Unuttum – Forgot Password?" />
                </Link>
              </div>
              <div className="mt-4 text-center text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  <BilingualText text="Hesabınız yok mu? – Don't have an account?" />{" "}
                  <Link
                    href="/register"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <BilingualText text="Kayıt Ol – Sign Up" />
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo Account Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-center text-blue-800 dark:text-blue-200">
              <BilingualText text="Demo hesap: demo / demo123 – Demo account: demo / demo123" />
            </p>
          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
