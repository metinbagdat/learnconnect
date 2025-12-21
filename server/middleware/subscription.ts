import type { Request, Response, NextFunction } from "express";
import { db } from "../db.js";
import { subscriptionPlans, userSubscriptions, userUsageTracking } from "../../shared/schema.js";
import { eq, and, desc, gte } from "drizzle-orm";

// Extend Request interface to include subscription info
declare global {
  namespace Express {
    interface Request {
      userSubscription?: {
        planId: string;
        status: string;
        features: string[];
        limits: {
          assessmentLimit: number;
          courseAccessLimit: number;
          analyticsLevel: string;
          aiRecommendations: boolean;
        };
      };
    }
  }
}

/**
 * Middleware to check and attach user subscription information
 */
export async function checkSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    // Require proper authentication - no header bypasses
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        message: "Authentication required",
        upgradeRequired: true 
      });
    }

    const userId = req.user.id;

    // Get user's current subscription
    const userSub = await db
      .select({
        planId: userSubscriptions.planId,
        status: userSubscriptions.status,
        endDate: userSubscriptions.endDate,
        trialEndsAt: userSubscriptions.trialEndsAt,
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);

    let currentPlanId = 'free';
    
    if (userSub.length > 0) {
      const subscription = userSub[0];
      
      // Check if subscription is still valid
      if (subscription.status === 'active') {
        // Check if subscription hasn't expired
        if (!subscription.endDate || new Date(subscription.endDate) > new Date()) {
          currentPlanId = subscription.planId;
        }
      }
    }

    // Get plan details
    const planInfo = await getPlanInfo(currentPlanId);
    req.userSubscription = planInfo;

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    // Fallback to free plan on error
    req.userSubscription = await getFreePlanInfo();
    next();
  }
}

/**
 * Middleware to check if user has access to premium features
 */
export function requirePremium(feature?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userSubscription) {
      return res.status(401).json({ 
        message: "Subscription information not available",
        upgradeRequired: true 
      });
    }

    if (req.userSubscription.planId === 'free') {
      return res.status(403).json({
        message: "Bu özellik Premium plan gerektirir",
        feature: feature || 'premium',
        upgradeRequired: true,
        currentPlan: 'free',
        requiredPlan: 'premium'
      });
    }

    next();
  };
}

/**
 * Atomically check and increment assessment usage to prevent race conditions
 */
export async function checkAndIncrementAssessmentUsage(userId: number, limits: any): Promise<{ success: boolean; error?: any }> {
  try {
    // Unlimited assessments for premium users
    if (limits.assessmentLimit === -1) {
      return { success: true };
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Use database transaction to make limit checking and increment atomic
    const result = await db.transaction(async (tx) => {
      // Get current usage with FOR UPDATE lock to prevent race conditions
      const usage = await tx
        .select()
        .from(userUsageTracking)
        .where(and(
          eq(userUsageTracking.userId, userId),
          eq(userUsageTracking.date, today)
        ))
        .limit(1)
        .for('UPDATE');

      const currentUsage = usage[0];
      const assessmentsUsed = currentUsage?.assessmentsUsed || 0;

      // Check if user has reached their limit
      if (assessmentsUsed >= limits.assessmentLimit) {
        throw new Error(`LIMIT_EXCEEDED:${assessmentsUsed}:${limits.assessmentLimit}`);
      }

      // Increment usage atomically
      if (usage.length === 0) {
        // Create new record
        await tx.insert(userUsageTracking).values({
          userId,
          date: today,
          assessmentsUsed: 1,
          coursesAccessed: 0,
          analyticsViews: 0,
          aiRecommendationsGenerated: 0,
        });
      } else {
        // Update existing record
        await tx
          .update(userUsageTracking)
          .set({ assessmentsUsed: assessmentsUsed + 1 })
          .where(and(
            eq(userUsageTracking.userId, userId),
            eq(userUsageTracking.date, today)
          ));
      }

      return { newUsage: assessmentsUsed + 1 };
    });

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('LIMIT_EXCEEDED:')) {
      const [, used, limit] = error.message.split(':');
      return {
        success: false,
        error: {
          message: "Günlük değerlendirme limitiniz doldu",
          limit: parseInt(limit),
          used: parseInt(used),
          upgradeRequired: true,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      };
    }
    throw error;
  }
}

/**
 * Check if user has reached their daily assessment limit
 */
export async function checkAssessmentLimit(req: Request, res: Response, next: NextFunction) {
  try {
    // Require proper authentication - no header bypasses
    if (!req.isAuthenticated() || !req.userSubscription) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.id;
    const { limits } = req.userSubscription;
    
    // Atomically check and increment usage to prevent race conditions
    const result = await checkAndIncrementAssessmentUsage(userId, limits);
    
    if (!result.success) {
      return res.status(429).json(result.error);
    }

    next();
  } catch (error) {
    console.error('Assessment limit check error:', error);
    res.status(500).json({ message: "Limit kontrolünde hata oluştu" });
  }
}

/**
 * Track usage when user consumes a feature (NON-ASSESSMENT types only)
 * Assessment usage is tracked atomically in checkAndIncrementAssessmentUsage
 */
export async function trackUsage(userId: number, usageType: 'course' | 'analytics' | 'ai') {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Use transaction for atomic usage tracking
    await db.transaction(async (tx) => {
      // Get or create today's usage record with FOR UPDATE lock
      let usage = await tx
        .select()
        .from(userUsageTracking)
        .where(and(
          eq(userUsageTracking.userId, userId),
          eq(userUsageTracking.date, today)
        ))
        .limit(1)
        .for('UPDATE');

      if (usage.length === 0) {
        // Create new usage record
        await tx.insert(userUsageTracking).values({
          userId,
          date: today,
          assessmentsUsed: 0,
          coursesAccessed: usageType === 'course' ? 1 : 0,
          analyticsViews: usageType === 'analytics' ? 1 : 0,
          aiRecommendationsGenerated: usageType === 'ai' ? 1 : 0,
        });
      } else {
        // Update existing record
        const updates: any = {};
        switch (usageType) {
          case 'course':
            updates.coursesAccessed = (usage[0].coursesAccessed || 0) + 1;
            break;
          case 'analytics':
            updates.analyticsViews = (usage[0].analyticsViews || 0) + 1;
            break;
          case 'ai':
            updates.aiRecommendationsGenerated = (usage[0].aiRecommendationsGenerated || 0) + 1;
            break;
        }

        await tx
          .update(userUsageTracking)
          .set(updates)
          .where(and(
            eq(userUsageTracking.userId, userId),
            eq(userUsageTracking.date, today)
          ));
      }
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
    // Don't throw - usage tracking shouldn't break the main flow
  }
}

/**
 * Get plan information by plan ID - ALWAYS from database for security
 */
async function getPlanInfo(planId: string) {
  const plan = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, planId))
    .limit(1);

  if (plan.length === 0) {
    // SECURITY: Always fetch free plan from database too
    const freePlan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, 'free'))
      .limit(1);
    
    if (freePlan.length === 0) {
      throw new Error(`Plan not found: ${planId}. Free plan also missing from database.`);
    }
    
    const planData = freePlan[0];
    return {
      planId: planData.id,
      status: 'active',
      features: planData.features as string[],
      limits: {
        assessmentLimit: planData.assessmentLimit || -1,
        courseAccessLimit: planData.courseAccessLimit || -1,
        analyticsLevel: planData.analyticsLevel,
        aiRecommendations: planData.aiRecommendations || false,
      }
    };
  }

  const planData = plan[0];
  return {
    planId: planData.id,
    status: 'active',
    features: planData.features as string[],
    limits: {
      assessmentLimit: planData.assessmentLimit || -1,
      courseAccessLimit: planData.courseAccessLimit || -1,
      analyticsLevel: planData.analyticsLevel,
      aiRecommendations: planData.aiRecommendations || false,
    }
  };
}

// REMOVED: getFreePlanInfo() function - all plan data must come from database for security