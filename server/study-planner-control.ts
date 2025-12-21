import { storage } from "./storage.js";
import {
  generateAiStudyPlan,
  createStudyGoal,
  getUserStudyGoals,
  updateStudyGoal,
  createStudySession,
  getUserStudySessions,
  markSessionComplete,
  getProgressCharts,
} from "./smart-planning.js";
import { HealthMonitor } from "./study-planner-health-monitor.js";

export interface StudyPlannerModule {
  initialize(preferences: any): Promise<void>;
  getName(): string;
  getStatus(): string;
}

export class PlanGenerator implements StudyPlannerModule {
  private status: string = "inactive";

  async initialize(preferences: any): Promise<void> {
    this.status = "active";
    console.log("[PlanGenerator] Initialized with preferences:", preferences);
  }

  getName(): string {
    return "plan_generation";
  }

  getStatus(): string {
    return this.status;
  }

  async generatePlan(userId: number, goalData: any) {
    return await generateAiStudyPlan(userId, goalData);
  }
}

export class ScheduleManager implements StudyPlannerModule {
  private status: string = "inactive";

  async initialize(preferences: any): Promise<void> {
    this.status = "active";
    console.log("[ScheduleManager] Initialized with preferences:", preferences);
  }

  getName(): string {
    return "schedule_management";
  }

  getStatus(): string {
    return this.status;
  }

  async getDailySchedule(userId: number, date: string) {
    const sessions = await getUserStudySessions(userId, true);
    return {
      date,
      sessions,
      message: "Daily schedule retrieved successfully"
    };
  }

  async getUpcomingSessions(userId: number) {
    return await getUserStudySessions(userId, true);
  }
}

export class ProgressTracker implements StudyPlannerModule {
  private status: string = "inactive";

  async initialize(preferences: any): Promise<void> {
    this.status = "active";
    console.log("[ProgressTracker] Initialized with preferences:", preferences);
  }

  getName(): string {
    return "progress_tracking";
  }

  getStatus(): string {
    return this.status;
  }

  async trackProgress(userId: number) {
    return await getProgressCharts(userId);
  }

  async completeSession(sessionId: number, completionRate: number, focusScore: number) {
    return await markSessionComplete(sessionId, completionRate, focusScore);
  }
}

export class MotivationEngine implements StudyPlannerModule {
  private status: string = "inactive";
  private motivationalMessages: string[] = [
    "Harika ilerleme yapıyorsun! 🚀",
    "Her ders seni hedefinize yaklaştırıyor 📚",
    "Başarı disiplin ve kararlılığın sonucudur 💪",
    "Bugün attığın adımlar yarının başarısı 🎯",
    "Hiçbir zaman pes etme, sen bunu başarabilirsin! ✨",
  ];

  async initialize(preferences: any): Promise<void> {
    this.status = "active";
    console.log("[MotivationEngine] Initialized");
  }

  getName(): string {
    return "motivation_engine";
  }

  getStatus(): string {
    return this.status;
  }

  getMotivationalMessage(): string {
    return this.motivationalMessages[
      Math.floor(Math.random() * this.motivationalMessages.length)
    ];
  }
}

export class AnalyticsEngine implements StudyPlannerModule {
  private status: string = "inactive";

  async initialize(preferences: any): Promise<void> {
    this.status = "active";
    console.log("[AnalyticsEngine] Initialized");
  }

  getName(): string {
    return "analytics_engine";
  }

  getStatus(): string {
    return this.status;
  }

  async getAnalytics(userId: number) {
    const goals = await getUserStudyGoals(userId);
    const sessions = await getUserStudySessions(userId);
    const progress = await getProgressCharts(userId);

    return {
      goals: goals.length,
      sessions: sessions.length,
      completedSessions: progress.completedSessions,
      totalStudyTime: progress.sessionsPerDay.reduce((sum: number, day: any) => sum + (day.count * 60), 0),
      charts: progress,
    };
  }
}

export class StudyPlannerControl {
  private modules: {
    [key: string]: StudyPlannerModule;
  };
  private userPreferences: Map<number, any> = new Map();
  private systemStatus: { [key: string]: string } = {};
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthMonitor: HealthMonitor;

  constructor() {
    this.modules = {
      plan_generation: new PlanGenerator(),
      schedule_management: new ScheduleManager(),
      progress_tracking: new ProgressTracker(),
      motivation_engine: new MotivationEngine(),
      analytics_engine: new AnalyticsEngine(),
    };
    this.healthMonitor = new HealthMonitor(this);
  }

  async initializePlanner(userId: number, preferences: any = {}) {
    try {
      console.log(`[StudyPlannerControl] Initializing planner for user ${userId}`);

      this.userPreferences.set(userId, preferences);

      for (const [moduleName, module] of Object.entries(this.modules)) {
        await module.initialize(preferences);
        this.systemStatus[moduleName] = "active";
      }

      this._startHealthMonitoring();
      this.healthMonitor.startMonitoring();

      return {
        status: "success",
        message: `Study planner initialized for user ${userId}`,
        modules: this.systemStatus,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: "error",
        message: `Failed to initialize planner: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  async createGoal(userId: number, goalData: any) {
    try {
      const goal = await createStudyGoal(userId, goalData);
      return {
        status: "success",
        data: goal,
        message: "Study goal created successfully",
      };
    } catch (error) {
      return {
        status: "error",
        message: `Failed to create goal: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async generatePlan(userId: number, goalData: any) {
    const planGenerator = this.modules.plan_generation as PlanGenerator;
    return await planGenerator.generatePlan(userId, goalData);
  }

  async getDailySchedule(userId: number, date: string) {
    const scheduleManager = this.modules.schedule_management as ScheduleManager;
    return await scheduleManager.getDailySchedule(userId, date);
  }

  async getProgress(userId: number) {
    const progressTracker = this.modules.progress_tracking as ProgressTracker;
    return await progressTracker.trackProgress(userId);
  }

  async getAnalytics(userId: number) {
    const analyticsEngine = this.modules.analytics_engine as AnalyticsEngine;
    return await analyticsEngine.getAnalytics(userId);
  }

  getMotivation(): string {
    const motivationEngine = this.modules.motivation_engine as MotivationEngine;
    return motivationEngine.getMotivationalMessage();
  }

  getSystemStatus() {
    return {
      status: "operational",
      modules: this.systemStatus,
      health: this.healthMonitor.getHealthStatus(),
      timestamp: new Date(),
    };
  }

  getHealthMonitorStatus() {
    return this.healthMonitor.getHealthStatus();
  }

  getHealthMonitorAlerts(type?: "warning" | "critical") {
    return this.healthMonitor.getAlerts(type);
  }

  getHealthMonitorMetrics() {
    return this.healthMonitor.getMetrics();
  }

  recordModuleOperation(moduleName: string, responseTime: number, success: boolean) {
    this.healthMonitor.recordOperation(moduleName, responseTime, success);
  }

  recordModuleEngagement(moduleName: string, engagementScore: number) {
    this.healthMonitor.recordEngagement(moduleName, engagementScore);
  }

  private _startHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      for (const [name, module] of Object.entries(this.modules)) {
        this.systemStatus[name] = module.getStatus();
      }
      console.log("[StudyPlannerControl] Health check - All modules active");
    }, 60000); // Check every minute
  }

  shutdown() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.healthMonitor.stopMonitoring();
    console.log("[StudyPlannerControl] Planner shutdown");
  }
}

export const studyPlannerControl = new StudyPlannerControl();
