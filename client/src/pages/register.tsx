import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, Eye, EyeOff, User, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BilingualText } from "@/components/ui/bilingual-text";
import PageWrapper from "@/components/layout/page-wrapper";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useAuth } from "@/hooks/use-auth";

export default function RegisterPage() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLocation("/tyt-dashboard");
    }
  }, [isAuthenticated, authLoading, setLocation]);

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: language === "tr" ? "Şifre Hatası" : "Password Error",
        description:
          language === "tr"
            ? "Şifreler eşleşmiyor"
            : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: language === "tr" ? "Şifre Hatası" : "Password Error",
        description:
          language === "tr"
            ? "Şifre en az 6 karakter olmalıdır"
            : "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName || formData.username,
          role: "student",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      toast({
        title: language === "tr" ? "Kayıt Başarılı" : "Registration Successful",
        description:
          language === "tr"
            ? "Hesabınız oluşturuldu! Giriş yapılıyor..."
            : "Your account has been created! Signing in...",
      });

      // Auto-login after registration - refresh page to get session
      setTimeout(() => {
        window.location.href = "/tyt-dashboard";
      }, 1000);
    } catch (error: any) {
      toast({
        title: language === "tr" ? "Kayıt Hatası" : "Registration Error",
        description: error.message || (language === "tr" ? "Kayıt işlemi başarısız oldu" : "Registration failed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper
      currentPage={language === "tr" ? "Kayıt Ol" : "Register"}
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
                <BilingualText text="Kayıt Ol – Sign Up" />
              </CardTitle>
              <CardDescription className="text-center">
                <BilingualText text="Yeni hesap oluşturun – Create a new account" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">
                    <BilingualText text="Ad Soyad – Full Name" />
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder={language === "tr" ? "Adınız ve soyadınız" : "Your full name"}
                      value={formData.displayName}
                      onChange={(e) =>
                        setFormData({ ...formData, displayName: e.target.value })
                      }
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

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
                      placeholder={language === "tr" ? "En az 6 karakter" : "At least 6 characters"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                      minLength={6}
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    <BilingualText text="Şifre Tekrar – Confirm Password" />
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={language === "tr" ? "Şifrenizi tekrar girin" : "Confirm your password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      required
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
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
                      <BilingualText text="Kayıt yapılıyor... – Registering..." />
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <UserPlus className="h-4 w-4 mr-2" />
                      <BilingualText text="Kayıt Ol – Sign Up" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  <BilingualText text="Zaten hesabınız var mı? – Already have an account?" />{" "}
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <BilingualText text="Giriş Yap – Sign In" />
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
