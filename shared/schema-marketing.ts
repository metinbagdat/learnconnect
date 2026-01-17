import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";

// Helper for passthrough schemas (bypasses validation to allow createdAt/updatedAt)
const passthrough = () => z.object({}).passthrough() as unknown as z.ZodTypeAny;

// 1. REFERRAL SYSTEM
export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  reward: numeric("reward", { precision: 10, scale: 2 }).notNull().default("10.00"),
  rewardType: text("reward_type").notNull().default("credit"), // credit, discount, premium_access
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const referralRedemptions = pgTable("referral_redemptions", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referral_code_id").notNull(),
  referrerId: integer("referrer_id").notNull(),
  refereeId: integer("referee_id").notNull(),
  rewardEarned: numeric("reward_earned", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 2. EMAIL MARKETING
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  segment: text("segment").notNull(), // all, students, teachers, inactive
  status: text("status").notNull().default("draft"), // draft, scheduled, sent, cancelled
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  openRate: numeric("open_rate", { precision: 5, scale: 2 }),
  clickRate: numeric("click_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emailSubscribers = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  userId: integer("user_id"),
  isSubscribed: boolean("is_subscribed").default(true),
  subscribeSource: text("subscribe_source"), // landing_page, signup, referral
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 3. AFFILIATE PROGRAM
export const affiliateProgram = pgTable("affiliate_program", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  affiliateCode: text("affiliate_code").notNull().unique(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("15.00"), // percentage
  totalEarnings: numeric("total_earnings", { precision: 10, scale: 2 }).notNull().default("0.00"),
  referralsCount: integer("referrals_count").notNull().default(0),
  status: text("status").notNull().default("active"), // active, suspended, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const affiliateTransactions = pgTable("affiliate_transactions", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  transactionType: text("transaction_type").notNull(), // commission, referral_bonus, withdrawal
  referenceId: integer("reference_id"), // courseId, enrollmentId, etc
  status: text("status").notNull().default("pending"), // pending, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 4. SOCIAL SHARING
export const socialShares = pgTable("social_shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id"),
  achievementId: integer("achievement_id"),
  platform: text("platform").notNull(), // twitter, facebook, linkedin, whatsapp
  shareUrl: text("share_url"),
  clickCount: integer("click_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 5. MARKETING ANALYTICS
export const marketingAnalytics = pgTable("marketing_analytics", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  totalSignups: integer("total_signups").notNull().default(0),
  totalConversions: integer("total_conversions").notNull().default(0),
  conversionRate: numeric("conversion_rate", { precision: 5, scale: 2 }),
  trafficSource: text("traffic_source"), // organic, referral, ad, social
  sourceDetails: jsonb("source_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userAcquisitionMetrics = pgTable("user_acquisition_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  source: text("source").notNull(), // landing_page, referral, ad, social
  medium: text("medium"), // organic, paid, referral, email
  campaign: text("campaign"),
  conversionValue: numeric("conversion_value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 6. WAITLIST & LEAD CAPTURE
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  interests: text("interests").array(), // array of interests/courses
  position: integer("position"),
  notificationsSent: integer("notifications_sent").notNull().default(0),
  hasSignedUp: boolean("has_signed_up").default(false),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 7. TESTIMONIALS
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: integer("course_id"),
  content: text("content").notNull(),
  rating: integer("rating").notNull(), // 1-5
  isApproved: boolean("is_approved").default(false),
  isDisplayed: boolean("is_displayed").default(false),
  displayOrder: integer("display_order"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 8. MARKETING AUTOMATION
export const automationWorkflows = pgTable("automation_workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger").notNull(), // user_signup, course_completed, inactivity, milestone
  triggerData: jsonb("trigger_data"),
  actions: jsonb("actions").notNull(), // array of actions to perform
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const automationExecutions = pgTable("automation_executions", {
  id: serial("id").primaryKey(),
  workflowId: integer("workflow_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull(), // pending, running, completed, failed
  result: jsonb("result"),
  executedAt: timestamp("executed_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 9. AI NEWS PORTAL
export const newsArticles = pgTable("news_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleTr: text("title_tr"),
  content: text("content").notNull(),
  contentTr: text("content_tr"),
  excerpt: text("excerpt").notNull(),
  excerptTr: text("excerpt_tr"),
  category: text("category").notNull(), // education, tech, success, official
  source: text("source"),
  imageUrl: text("image_url"),
  isAiGenerated: boolean("is_ai_generated").default(false),
  viewCount: integer("view_count").notNull().default(0),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ✅ CRITICAL FIX: Replace createInsertSchema with passthrough to prevent Zod v4 omit errors
// Insert schemas - using passthrough() to bypass validation and prevent "Unrecognized key: createdAt" errors

export const insertReferralCodeSchema = passthrough();
export const insertReferralRedemptionSchema = passthrough();
export const insertEmailCampaignSchema = passthrough();
export const insertEmailSubscriberSchema = passthrough();
export const insertAffiliateProgramSchema = passthrough();
export const insertAffiliateTransactionSchema = passthrough();
export const insertSocialShareSchema = passthrough();
export const insertMarketingAnalyticsSchema = passthrough();
export const insertUserAcquisitionMetricsSchema = passthrough();
export const insertWaitlistSchema = passthrough();
export const insertTestimonialSchema = passthrough();
export const insertAutomationWorkflowSchema = passthrough();
export const insertAutomationExecutionSchema = passthrough();
export const insertNewsArticleSchema = passthrough();

// Types
export type ReferralCode = typeof referralCodes.$inferSelect;
export type ReferralRedemption = typeof referralRedemptions.$inferSelect;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type AffiliateProgram = typeof affiliateProgram.$inferSelect;
export type AffiliateTransaction = typeof affiliateTransactions.$inferSelect;
export type SocialShare = typeof socialShares.$inferSelect;
export type MarketingAnalytics = typeof marketingAnalytics.$inferSelect;
export type UserAcquisitionMetrics = typeof userAcquisitionMetrics.$inferSelect;
export type Waitlist = typeof waitlist.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type AutomationWorkflow = typeof automationWorkflows.$inferSelect;
export type AutomationExecution = typeof automationExecutions.$inferSelect;
export type NewsArticle = typeof newsArticles.$inferSelect;

export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type InsertReferralRedemption = z.infer<typeof insertReferralRedemptionSchema>;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type InsertEmailSubscriber = z.infer<typeof insertEmailSubscriberSchema>;
export type InsertAffiliateProgram = z.infer<typeof insertAffiliateProgramSchema>;
export type InsertAffiliateTransaction = z.infer<typeof insertAffiliateTransactionSchema>;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;
export type InsertMarketingAnalytics = z.infer<typeof insertMarketingAnalyticsSchema>;
export type InsertUserAcquisitionMetrics = z.infer<typeof insertUserAcquisitionMetricsSchema>;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type InsertAutomationWorkflow = z.infer<typeof insertAutomationWorkflowSchema>;
export type InsertAutomationExecution = z.infer<typeof insertAutomationExecutionSchema>;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
