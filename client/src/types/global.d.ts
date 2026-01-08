// Global type declarations for immediate build fix
declare global {
  // Dashboard data interfaces
  interface StudentAIData {
    goals?: Array<{ id: number; text: string; [key: string]: any }>;
    courseRecommendations?: any[];
    studyPlanSuggestions?: any[];
    goalSuggestions?: any[];
    weeklyProgress?: any[];
    topStrengths?: Array<{ label: string; value: number; [key: string]: any }>;
    areasForImprovement?: Array<{ label: string; value: number; [key: string]: any }>;
    [key: string]: any;
  }

  // Missing component declarations
  interface PageWrapperProps {
    children: React.ReactNode;
    title?: string;
  }
  
  const PageWrapper: React.FC<PageWrapperProps>;

  // API response fallback types
  interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    [key: string]: any;
  }
}

export {};
