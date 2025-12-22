import { db } from "./db.js";
import {
  referralCodes,
  referralRedemptions,
  emailCampaigns,
  emailSubscribers,
  affiliateProgram,
  affiliateTransactions,
  socialShares,
  marketingAnalytics,
  userAcquisitionMetrics,
  waitlist,
  testimonials,
  automationWorkflows,
  automationExecutions,
  newsArticles,
  type InsertReferralCode,
  type InsertReferralRedemption,
  type InsertEmailCampaign,
  type InsertEmailSubscriber,
  type InsertAffiliateProgram,
  type InsertAffiliateTransaction,
  type InsertSocialShare,
  type InsertMarketingAnalytics,
  type InsertUserAcquisitionMetrics,
  type InsertWaitlist,
  type InsertTestimonial,
  type InsertAutomationWorkflow,
  type InsertAutomationExecution,
  type InsertNewsArticle,
} from "../shared/schema-marketing.js";

export interface IMarketingStorage {
  // Referral System
  createReferralCode(data: InsertReferralCode): Promise<any>;
  getReferralCode(id: number): Promise<any>;
  redeemReferralCode(data: InsertReferralRedemption): Promise<any>;
  getUserReferrals(userId: number): Promise<any[]>;

  // Email Marketing
  createEmailCampaign(data: InsertEmailCampaign): Promise<any>;
  subscribeEmail(data: InsertEmailSubscriber): Promise<any>;
  getEmailSubscribers(): Promise<any[]>;
  getEmailCampaigns(): Promise<any[]>;

  // Affiliate Program
  createAffiliateAccount(data: InsertAffiliateProgram): Promise<any>;
  getAffiliateAccount(userId: number): Promise<any>;
  createAffiliateTransaction(data: InsertAffiliateTransaction): Promise<any>;
  getAffiliateTransactions(affiliateId: number): Promise<any[]>;

  // Social Sharing
  recordSocialShare(data: InsertSocialShare): Promise<any>;
  getSocialShares(userId: number): Promise<any[]>;

  // Marketing Analytics
  recordMarketingAnalytics(data: InsertMarketingAnalytics): Promise<any>;
  recordUserAcquisition(data: InsertUserAcquisitionMetrics): Promise<any>;
  getMarketingStats(): Promise<any>;

  // Waitlist
  addToWaitlist(data: InsertWaitlist): Promise<any>;
  getWaitlist(): Promise<any[]>;
  convertWaitlistUser(waitlistId: number): Promise<any>;

  // Testimonials
  createTestimonial(data: InsertTestimonial): Promise<any>;
  getTestimonials(): Promise<any[]>;
  approveTestimonial(id: number): Promise<any>;

  // Automation
  createWorkflow(data: InsertAutomationWorkflow): Promise<any>;
  executeWorkflow(data: InsertAutomationExecution): Promise<any>;

  // News Portal
  createNewsArticle(data: InsertNewsArticle): Promise<any>;
  getNewsArticles(): Promise<any[]>;
  getLatestNews(limit: number): Promise<any[]>;
}

export class MarketingStorage implements IMarketingStorage {
  async createReferralCode(data: InsertReferralCode): Promise<any> {
    return db.insert(referralCodes).values(data).returning();
  }

  async getReferralCode(id: number): Promise<any> {
    return db.select().from(referralCodes).where((t) => t.id === id);
  }

  async redeemReferralCode(data: InsertReferralRedemption): Promise<any> {
    return db.insert(referralRedemptions).values(data).returning();
  }

  async getUserReferrals(userId: number): Promise<any[]> {
    return db
      .select()
      .from(referralCodes)
      .where((t) => t.userId === userId);
  }

  async createEmailCampaign(data: InsertEmailCampaign): Promise<any> {
    return db.insert(emailCampaigns).values(data).returning();
  }

  async subscribeEmail(data: InsertEmailSubscriber): Promise<any> {
    return db.insert(emailSubscribers).values(data).returning();
  }

  async getEmailSubscribers(): Promise<any[]> {
    return db.select().from(emailSubscribers).where((t) => t.isSubscribed === true);
  }

  async getEmailCampaigns(): Promise<any[]> {
    return db.select().from(emailCampaigns);
  }

  async createAffiliateAccount(data: InsertAffiliateProgram): Promise<any> {
    return db.insert(affiliateProgram).values(data).returning();
  }

  async getAffiliateAccount(userId: number): Promise<any> {
    return db
      .select()
      .from(affiliateProgram)
      .where((t) => t.userId === userId);
  }

  async createAffiliateTransaction(data: InsertAffiliateTransaction): Promise<any> {
    return db.insert(affiliateTransactions).values(data).returning();
  }

  async getAffiliateTransactions(affiliateId: number): Promise<any[]> {
    return db
      .select()
      .from(affiliateTransactions)
      .where((t) => t.affiliateId === affiliateId);
  }

  async recordSocialShare(data: InsertSocialShare): Promise<any> {
    return db.insert(socialShares).values(data).returning();
  }

  async getSocialShares(userId: number): Promise<any[]> {
    return db
      .select()
      .from(socialShares)
      .where((t) => t.userId === userId);
  }

  async recordMarketingAnalytics(data: InsertMarketingAnalytics): Promise<any> {
    return db.insert(marketingAnalytics).values(data).returning();
  }

  async recordUserAcquisition(data: InsertUserAcquisitionMetrics): Promise<any> {
    return db.insert(userAcquisitionMetrics).values(data).returning();
  }

  async getMarketingStats(): Promise<any> {
    const subscribers = await db
      .select()
      .from(emailSubscribers)
      .where((t) => t.isSubscribed === true);
    const analytics = await db.select().from(marketingAnalytics);
    return {
      totalSubscribers: subscribers.length,
      campaigns: analytics.length,
      conversions: analytics.reduce((sum, a) => sum + (a.totalConversions || 0), 0),
    };
  }

  async addToWaitlist(data: InsertWaitlist): Promise<any> {
    return db.insert(waitlist).values(data).returning();
  }

  async getWaitlist(): Promise<any[]> {
    return db.select().from(waitlist).orderBy((t) => t.position);
  }

  async convertWaitlistUser(waitlistId: number): Promise<any> {
    return db
      .update(waitlist)
      .set({ hasSignedUp: true, convertedAt: new Date() })
      .where((t) => t.id === waitlistId)
      .returning();
  }

  async createTestimonial(data: InsertTestimonial): Promise<any> {
    return db.insert(testimonials).values(data).returning();
  }

  async getTestimonials(): Promise<any[]> {
    return db
      .select()
      .from(testimonials)
      .where((t) => t.isApproved === true && t.isDisplayed === true);
  }

  async approveTestimonial(id: number): Promise<any> {
    return db
      .update(testimonials)
      .set({ isApproved: true, isDisplayed: true })
      .where((t) => t.id === id)
      .returning();
  }

  async createWorkflow(data: InsertAutomationWorkflow): Promise<any> {
    return db.insert(automationWorkflows).values(data).returning();
  }

  async executeWorkflow(data: InsertAutomationExecution): Promise<any> {
    return db.insert(automationExecutions).values(data).returning();
  }

  async createNewsArticle(data: InsertNewsArticle): Promise<any> {
    return db.insert(newsArticles).values(data).returning();
  }

  async getNewsArticles(): Promise<any[]> {
    return db.select().from(newsArticles);
  }

  async getLatestNews(limit: number = 5): Promise<any[]> {
    return db
      .select()
      .from(newsArticles)
      .orderBy((t) => t.publishedAt)
      .limit(limit);
  }
}

export const marketingStorage = new MarketingStorage();
