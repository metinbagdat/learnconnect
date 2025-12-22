import { db } from "./db.js";
import { subscriptionPlans } from "../shared/schema.js";

export async function seedSubscriptionPlans() {
  try {
    console.log('🔄 Starting subscription plans seeding...');

    // Define default subscription plans
    const defaultPlans = [
      {
        id: "free",
        name: "Ücretsiz Plan",
        description: "Temel öğrenme özelliklerine erişim",
        price: "0.00",
        stripePriceId: null,
        features: [
          "Günde 1 değerlendirme",
          "Temel analitik",
          "3 kurs erişimi",
          "Standard öğrenme planları"
        ],
        assessmentLimit: 1, // 1 per day
        courseAccessLimit: 3,
        analyticsLevel: "basic",
        aiRecommendations: false,
        priority: 1,
        isActive: true,
      },
      {
        id: "premium",
        name: "Premium Plan",
        description: "Tüm özellikler + AI destekli öğrenme",
        price: "149.00",
        stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || null,
        features: [
          "Sınırsız değerlendirme",
          "AI-powered öneriler",
          "Detaylı analitik dashboard",
          "Tüm kurs erişimi",
          "Gelişmiş öğrenme planları",
          "Kişiselleştirilmiş deneyim",
          "Öncelikli destek"
        ],
        assessmentLimit: -1, // unlimited
        courseAccessLimit: -1, // unlimited
        analyticsLevel: "detailed",
        aiRecommendations: true,
        priority: 2,
        isActive: true,
      }
    ];

    // Check if plans already exist
    const existingPlans = await db.select().from(subscriptionPlans);
    
    if (existingPlans.length === 0) {
      console.log('📋 Creating default subscription plans...');
      
      for (const plan of defaultPlans) {
        await db.insert(subscriptionPlans).values(plan);
        console.log(`✅ Created plan: ${plan.name} (${plan.id})`);
      }
      
      console.log('🎉 Subscription plans seeded successfully!');
    } else {
      console.log('📋 Subscription plans already exist, skipping seeding');
    }

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
}