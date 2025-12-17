import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Laptop, Users, Globe, CheckCircle, Zap, Award } from "lucide-react";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { SocialLogin } from "@/components/social/social-login";
import { StudentTestimonials } from "@/components/ui/student-testimonials";
import { NewsPortal } from "@/components/ui/news-portal";
import { useSEO } from "@/hooks/use-seo";
import { injectSchemaMarkup, generateOrganizationSchema } from "@/lib/schema-markup";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const authContext = useAuth();
  const { user, loginMutation, registerMutation } = authContext;
  const langContext = useLanguage();
  const { t } = langContext;

  // Debug log
  console.log("[AUTH_PAGE] Auth context:", { 
    hasUser: !!user, 
    hasLoginMutation: !!loginMutation?.mutate,
    hasRegisterMutation: !!registerMutation?.mutate,
    hasLanguage: !!langContext 
  });
  
  useSEO({
    title: "EduLearn - learnconnect.net | TYT & AYT Sınav Hazırlığı",
    description: "TYT hazırlık ve AYT dersleri için AI destekli e-learning platformu. learnconnect.net - Kişiselleştirilmiş öğrenme yolları ile sınavlara hazırlanın.",
    keywords: "TYT hazırlık, AYT dersleri, learnconnect, EduLearn, online üniversite hazırlık, sınav hazırlığı",
    ogTitle: "EduLearn - learnconnect.net",
    ogDescription: "AI destekli kişiselleştirilmiş öğrenme platformu | learnconnect.net",
    ogType: "website"
  });

  // Only clear localStorage if user manually navigated to /auth (not after logout redirect)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('edulearn_user') || 'null');
    // Only clear if we have a user but they're trying to re-auth (shouldn't happen normally)
    if (user && !window.location.pathname.includes('logout')) {
      // User is already logged in, don't clear anything
    } else {
      // Fresh auth attempt, clear stale data
      localStorage.removeItem('edulearn_user');
    }
  }, []);
  
  useEffect(() => {
    const schema = generateOrganizationSchema({
      name: 'EduLearn',
      url: 'https://learnconnect.net',
      description: 'AI-powered comprehensive e-learning platform for TYT, AYT and professional development'
    });
    injectSchemaMarkup(schema);
  }, []);

  // NEVER redirect on auth page - show form regardless of user state
  // The form will handle authentication logic
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      displayName: "",
      role: "student",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    console.log("[FORM] ===== LOGIN SUBMIT TRIGGERED =====", data);
    console.log("[FORM] loginMutation available:", !!loginMutation?.mutate);
    if (loginMutation && loginMutation.mutate) {
      console.log("[FORM] Calling mutation.mutate with:", data);
      loginMutation.mutate(data);
      console.log("[FORM] Mutation called successfully");
    } else {
      console.error("[FORM] ERROR: loginMutation.mutate not available", { 
        hasMutation: !!loginMutation,
        hasMutate: !!loginMutation?.mutate,
        mutation: loginMutation 
      });
      // Direct API call as fallback
      console.log("[FORM] Attempting direct API call");
      (async () => {
        try {
          const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            credentials: "include"
          });
          console.log("[FORM] Direct API response:", res.status);
          const responseData = await res.json();
          console.log("[FORM] Direct API data:", responseData);
          if (res.ok) {
            localStorage.setItem('edulearn_user', JSON.stringify(responseData));
            window.location.href = '/';
          } else {
            toast({ title: "Login failed", description: responseData.message, variant: "destructive" });
          }
        } catch (error) {
          console.error("[FORM] Direct API error:", error);
          toast({ title: "Error", description: String(error), variant: "destructive" });
        }
      })();
    }
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    console.log("[FORM] ===== REGISTER SUBMIT TRIGGERED =====", data);
    const { confirmPassword, ...userData } = data;
    if (registerMutation && registerMutation.mutate) {
      console.log("[FORM] Calling register mutation.mutate with:", userData);
      registerMutation.mutate(userData);
    } else {
      console.error("[FORM] ERROR: registerMutation.mutate not available");
      // Direct API call as fallback
      (async () => {
        try {
          const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
            credentials: "include"
          });
          const responseData = await res.json();
          if (res.ok) {
            localStorage.setItem('edulearn_user', JSON.stringify(responseData));
            window.location.href = '/';
          } else {
            toast({ title: "Registration failed", description: responseData.message, variant: "destructive" });
          }
        } catch (error) {
          console.error("[FORM] Register error:", error);
          let errorMessage = 'An error occurred during registration.';
          if (error instanceof Error) {
            if (error.message.includes('Failed to fetch') || error.message.includes('Unable to connect')) {
              errorMessage = 'Unable to connect to the server. Please check your internet connection and ensure the server is running.';
            } else if (error.message.includes('400')) {
              errorMessage = 'Invalid registration data. Please check your information and try again.';
            } else if (error.message.includes('409') || error.message.includes('already exists')) {
              errorMessage = 'Username already exists. Please choose a different username.';
            } else {
              errorMessage = error.message;
            }
          } else {
            errorMessage = String(error);
          }
          toast({ 
            title: "Registration failed", 
            description: errorMessage, 
            variant: "destructive" 
          });
        }
      })();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
      {/* Language Switcher Header */}
      <div className="flex justify-end p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <LanguageSwitcher />
      </div>
      
      <div className="flex-1 flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-2">
              <div className="text-5xl">📚</div>
            </div>
            <h1 className="text-4xl font-bold text-neutral-900">EduLearn</h1>
            <p className="text-neutral-600 mt-2 text-sm">learnconnect.net</p>
            <p className="text-neutral-500 mt-1 text-xs">Transform Your Learning Journey</p>
          </div>
          
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Log in to your account to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => {
                    console.log("[FORM] ===== LOGIN FORM SUBMIT EVENT =====", e.type);
                    e.preventDefault();
                    
                    const username = loginForm.getValues("username");
                    const password = loginForm.getValues("password");
                    console.log("[FORM] Values retrieved:", { username, password });
                    
                    onLoginSubmit({ username, password });
                  }} className="space-y-4">
                    <Form {...loginForm}>
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation?.isPending}
                        data-testid="button-login"
                        onClick={() => console.log("[BTN] Login button clicked")}
                      >
                        {loginMutation?.isPending ? "Logging in..." : "Login"}
                      </Button>
                    </Form>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Fill in your details to get started</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => {
                    console.log("[FORM] ===== REGISTER FORM SUBMIT EVENT =====", e.type);
                    e.preventDefault();
                    
                    const username = registerForm.getValues("username");
                    const password = registerForm.getValues("password");
                    const displayName = registerForm.getValues("displayName");
                    console.log("[FORM] Register values retrieved:", { username, password, displayName });
                    
                    onRegisterSubmit({ username, password, displayName: displayName, confirmPassword: password, role: "student" });
                  }} className="space-y-4">
                    <Form {...registerForm}>
                      <FormField
                        control={registerForm.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Choose a username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Choose a password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirm your password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={registerMutation?.isPending}
                        data-testid="button-register"
                        onClick={() => console.log("[BTN] Register button clicked")}
                      >
                        {registerMutation?.isPending ? "Creating account..." : "Create Account"}
                      </Button>
                    </Form>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right side - Hero Section */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 items-center justify-center">
        <div className="max-w-xl text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Master Your Skills, Achieve Your Goals
          </h2>
          <p className="text-neutral-700 mb-8 text-lg">
            Join 50,000+ learners transforming their careers with personalized, AI-powered learning paths and expert guidance.
          </p>
          
          <div className="grid grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-neutral-900 mb-2">AI-Powered</h3>
              <p className="text-sm text-neutral-600">
                Personalized learning paths adapted to your pace
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-neutral-900 mb-2">Certified</h3>
              <p className="text-sm text-neutral-600">
                Earn recognized certificates and credentials
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-neutral-900 mb-2">Proven Results</h3>
              <p className="text-sm text-neutral-600">
                92% success rate across all courses
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* News Portal Section */}
      <NewsPortal />

      {/* Testimonials Section - Mobile & Desktop */}
      <StudentTestimonials />
    </div>
  );
}
