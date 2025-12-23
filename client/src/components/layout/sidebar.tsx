import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  BookOpen, 
  Calendar, 
  FileText, 
  Package, 
  Award, 
  Settings, 
  LogOut,
  ChevronDown,
  Sparkles,
  Shield,
  Map,
  Lightbulb,
  Trophy,
  Brain,
  Target,
  BarChart3,
  Users,
  TrendingUp,
  Mail
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useAuth } from "@/hooks/use-auth";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
}

const SidebarLink = ({ href, icon, children, isActive }: SidebarLinkProps) => (
  <Link href={href}>
    <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
      isActive 
        ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-r-2 border-primary shadow-sm" 
        : "text-gray-700 hover:bg-white/60 hover:text-gray-900 hover:shadow-sm hover:translate-x-1"
    }`}>
      {icon}
      <span className="ml-3">{children}</span>
    </div>
  </Link>
);

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t, language } = useLanguage();
  const isTr = language === "tr";
  const [integrationsOpen, setIntegrationsOpen] = useState(true);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col w-64 h-full modern-overlay border-r border-white/20 shadow-xl">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-100">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 5.727 2.45a1 1 0 00.788 0l7-3a1 1 0 000-1.841l-7-3z"></path>
            <path d="M2.492 8.825l-.787.335c-.483.207-.795.712-.551 1.168.192.357.667.511 1.033.351l1.298-.558-.992-1.296zm10.665 2.31l-7.673 3.291c-.481.206-.796.71-.551 1.168.192.357.667.511 1.033.351l8.235-3.529c.392-.168.446-.707.098-.99-.27-.22-.67-.235-.968-.106l-.174.075v-.26z"></path>
          </svg>
          <span className="ml-2 text-xl font-semibold text-neutral-900">EduLearn</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="px-2 py-4 space-y-1">
          <SidebarLink 
            href="/" 
            icon={<Home className="h-5 w-5" />}
            isActive={location === '/'}
          >
            {t('dashboard')}
          </SidebarLink>
          
          <SidebarLink 
            href="/courses" 
            icon={<BookOpen className="h-5 w-5" />}
            isActive={location === '/courses'}
          >
            {t('myCourses')}
          </SidebarLink>
          
          <SidebarLink 
            href="/my-curriculum" 
            icon={<Target className="h-5 w-5" />}
            isActive={location === '/my-curriculum'}
          >
            <span className="flex items-center">
              {t('myCurriculum')}
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                AI
              </span>
            </span>
          </SidebarLink>
          
          <SidebarLink 
            href="/calendar" 
            icon={<Calendar className="h-5 w-5" />}
            isActive={location === '/calendar'}
          >
            {t('calendar')}
          </SidebarLink>
          
          <SidebarLink 
            href="/assignments" 
            icon={<FileText className="h-5 w-5" />}
            isActive={location === '/assignments'}
          >
            {t('assignments')}
          </SidebarLink>
          
          <SidebarLink 
            href="/resources" 
            icon={<Package className="h-5 w-5" />}
            isActive={location === '/resources'}
          >
            {t('resources')}
          </SidebarLink>
          
          <SidebarLink 
            href="/educational-materials" 
            icon={<FileText className="h-5 w-5" />}
            isActive={location === '/educational-materials'}
          >
            Eğitim Materyalleri
          </SidebarLink>
          
          {/* Only show for instructors, mentors and admins */}
          {(user?.role === "instructor" || user?.role === "mentor" || user?.role === "admin") && (
            <SidebarLink 
              href="/advisor-materials" 
              icon={<FileText className="h-5 w-5" />}
              isActive={location === '/advisor-materials'}
            >
              Materyal Yönetimi
            </SidebarLink>
          )}
          
          <SidebarLink 
            href="/learning-trails" 
            icon={<Map className="h-5 w-5" />}
            isActive={location === '/learning-trails'}
          >
            <span className="flex items-center">
              {t('learningTrails')}
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                AI
              </span>
            </span>
          </SidebarLink>

          <SidebarLink 
            href="/gamification" 
            icon={<Trophy className="h-5 w-5" />}
            isActive={location === '/gamification'}
          >
            <span className="flex items-center">
              {t('achievements')}
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                🏆
              </span>
            </span>
          </SidebarLink>
          
          <SidebarLink 
            href="/suggestions" 
            icon={<Lightbulb className="h-5 w-5" />}
            isActive={location === '/suggestions'}
          >
            <span className="flex items-center">
              {t('smartSuggestions')}
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-green-500 to-teal-500 text-white">
                New
              </span>
            </span>
          </SidebarLink>

          <SidebarLink 
            href="/adaptive-learning" 
            icon={<TrendingUp className="h-5 w-5" />}
            isActive={location === '/adaptive-learning'}
          >
            <span className="flex items-center">
              {t('adaptiveLearning', 'Adaptive Learning')}
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                ✨ AI
              </span>
            </span>
          </SidebarLink>

          <SidebarLink 
            href="/advanced-adaptive" 
            icon={<Brain className="h-5 w-5" />}
            isActive={location === '/advanced-adaptive'}
          >
            <span className="flex items-center">
              {t('advancedAILearning')}
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                🧠 AI
              </span>
            </span>
          </SidebarLink>

          <SidebarLink 
            href="/entrance-exam-prep" 
            icon={<Shield className="h-5 w-5" />}
            isActive={location === '/entrance-exam-prep'}
          >
            <span className="flex items-center">
              {t('entranceExams')}
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                AI
              </span>
            </span>
          </SidebarLink>
          
          <SidebarLink 
            href="/learning-paths" 
            icon={<Map className="h-5 w-5" />}
            isActive={location.startsWith('/learning-paths')}
          >
            <span className="flex items-center">
              {t('learningPaths')}
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                AI
              </span>
            </span>
          </SidebarLink>
          
          <SidebarLink 
            href="/achievements" 
            icon={<Award className="h-5 w-5" />}
            isActive={location === '/achievements'}
          >
            {t('achievements')}
          </SidebarLink>
          
          {/* Only show for instructors and admins */}
          {(user?.role === "instructor" || user?.role === "admin") && (
            <SidebarLink 
              href="/course-generator" 
              icon={<Sparkles className="h-5 w-5" />}
              isActive={location === '/course-generator'}
            >
              <span className="flex items-center">
                {t('courseGenerator')}
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  AI
                </span>
              </span>
            </SidebarLink>
          )}
          
          {/* Only show for admins */}
          {user?.role === "admin" && (
            <SidebarLink 
              href="/admin" 
              icon={<Shield className="h-5 w-5" />}
              isActive={location === '/admin-panel'}
            >
              <span className="flex items-center">
                {t('adminPanel')}
              </span>
            </SidebarLink>
          )}

          {/* MARKETING SECTION */}
          <Separator className="my-4" />
          
          <SidebarLink 
            href="/marketing" 
            icon={<TrendingUp className="h-5 w-5" />}
            isActive={location === '/marketing'}
          >
            {isTr ? '📊 Pazarlama' : '📊 Marketing'}
          </SidebarLink>

          <SidebarLink 
            href="/affiliate" 
            icon={<Users className="h-5 w-5" />}
            isActive={location === '/affiliate'}
          >
            {isTr ? '🤝 Afiliasyon' : '🤝 Affiliate'}
          </SidebarLink>

          <SidebarLink 
            href="/waitlist" 
            icon={<Mail className="h-5 w-5" />}
            isActive={location === '/waitlist'}
          >
            {isTr ? '📧 Bekleme Listesi' : '📧 Waitlist'}
          </SidebarLink>

          <SidebarLink 
            href="/analytics-charts" 
            icon={<BarChart3 className="h-5 w-5" />}
            isActive={location === '/analytics-charts'}
          >
            {isTr ? '📈 Analitiği' : '📈 Analytics'}
          </SidebarLink>
        </div>
        
        {/* Integrations */}
        <div className="px-4 py-4 mt-4">
          <button 
            className="flex items-center justify-between w-full px-2 text-xs font-medium tracking-wider uppercase text-neutral-500"
            onClick={() => setIntegrationsOpen(!integrationsOpen)}
          >
            <span>{t('integrations')}</span>
            <ChevronDown className={`h-4 w-4 transform ${integrationsOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {integrationsOpen && (
            <div className="px-2 mt-2 space-y-1">
              <a href="#" className="flex items-center px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 rounded-md">
                <svg className="w-5 h-5 mr-3 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <g fill="none">
                    <path fill="#34A853" d="M0 0h24v24H0z" />
                    <g transform="translate(2 2)">
                      <path fill="#EA4335" d="M18.93 20c1.17 0 2.07-.9 2.07-2V6l-10-4L1 6v12c0 1.1.9 2 2 2h16z"/>
                      <path fill="#FBBC05" d="M3 6l8-3 8 3v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6z"/>
                      <path fill="#4285F4" d="M14 11h-4v4h4v-4z"/>
                      <path fill="#34A853" d="M5 6h14v12c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6z"/>
                    </g>
                  </g>
                </svg>
                {t('googleDrive')}
              </a>
              <a href="#" className="flex items-center px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 rounded-md">
                <svg className="w-5 h-5 mr-3 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <rect width="24" height="24" fill="none"/>
                  <path fill="#4285F4" d="M12 1.5a10.5 10.5 0 105.22 19.65 2.5 2.5 0 011.67-4.58.75.75 0 00.38-1.31A6.48 6.48 0 0117 5.5c0-2.83-1.72-4-4-4z"/>
                </svg>
                {t('googleMeet')}
              </a>
              <a href="#" className="flex items-center px-2 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 rounded-md">
                <svg className="w-5 h-5 mr-3 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M11 10h6v6h-6v-6z"/>
                  <path fill="#EA4335" d="M5 4h6v6H5V4z"/>
                  <path fill="#FBBC05" d="M5 12h6v6H5v-6z"/>
                  <path fill="#34A853" d="M13 4h6v6h-6V4z"/>
                </svg>
                {t('googleCalendar')}
              </a>
            </div>
          )}
        </div>
      </nav>
      
      {/* User Profile */}
      <div className="border-t border-neutral-100">
        <div className="flex items-center p-4">
          <div className="relative">
            <img 
              className="w-10 h-10 rounded-full object-cover" 
              src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=128&q=80"} 
              alt="User profile" 
            />
            <span className="absolute bottom-0 right-0 block w-3 h-3 bg-success rounded-full ring-2 ring-white"></span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-900">{user?.displayName || 'User'}</p>
            <p className="text-xs text-neutral-500 capitalize">{user?.role || 'Student'}</p>
          </div>
          <div className="ml-auto flex">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:text-neutral-500"
              asChild
            >
              <Link href="/profile">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:text-neutral-500"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
