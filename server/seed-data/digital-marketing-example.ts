import { storage } from "../storage.js";

export async function seedDigitalMarketingExample() {
  try {
    console.log("[DigitalMarketing] Seeding complete example...");

    // PART 1: PARAMETERS (Three-Part Architecture)
    const designParams = {
      userId: 1,
      courseId: 1,
      designName: "Digital Marketing Fundamentals - Complete Example",
      status: "active",
      stage: "deployment",
      progressPercent: 100,
      version: 1,

      parameters: {
        // PART 1A: LEARNER-CENTRIC PARAMETERS
        learnerCentric: {
          targetAudience: ["Small business owners", "Career switchers", "Marketing professionals"],
          demographics: "Ages 25-55, running 1-50 person businesses or seeking career change",
          psychographics: {
            goals: ["Run first ad campaign", "Build marketing skills", "Increase customer acquisition"],
            learningPreferences: ["Video demos", "Hands-on projects", "Community Q&A"],
            motivation: "Immediate business application and results"
          },
          skillGap: "Non-marketing background → Can execute Google Ads + Facebook Ads campaigns",
          learningObjectives: {
            bloomsLevel: "APPLY - Build a complete ad campaign from scratch",
            specific: "By course end, learner will build and launch Google Ads + Facebook ad set for real business"
          },
          prerequisites: ["Basic computer skills", "Google/Facebook account", "Business/product to promote"]
        },

        // PART 1B: CONTENT & PEDAGOGY PARAMETERS
        contentPedagogy: {
          scope: "3 core modules + capstone project",
          modules: [
            { name: "Module 1: Ad Platform Fundamentals", hours: 3, projects: 1 },
            { name: "Module 2: Keyword & Audience Research", hours: 4, projects: 2 },
            { name: "Module 3: Campaign Creation & Optimization", hours: 4, projects: 2 },
            { name: "Capstone: Live Campaign Launch", hours: 6, projects: 1 }
          ],
          modalities: {
            video: "40% (step-by-step platform walkthroughs)",
            interactive: "40% (hands-on setup exercises)",
            text: "15% (best practices guides)",
            projects: "5% (real campaign execution)"
          },
          pedagogicalApproach: [
            "Project-based: Build actual campaign from day 1",
            "Live demo: Screencasts of setting up ads (not theory)",
            "Community Q&A: Forum for troubleshooting",
            "Peer learning: Share campaign results and strategies"
          ],
          assessmentStrategy: {
            formative: ["Quiz after each module", "Practice campaign setup", "Forum participation"],
            summative: ["Live campaign launch", "Campaign performance analysis", "Certification"]
          }
        },

        // PART 1C: BUSINESS & OPERATIONAL PARAMETERS
        businessOperational: {
          instructor: "Digital marketing practitioner with 10+ years, 500+ successful campaigns",
          platformCapabilities: ["Video screencasts", "Live ad account sandbox", "Discussion forums", "Certificate"],
          businessModel: "$299 per student, target 150 students = $44.85k revenue",
          targetCompletion: 85,
          jobPlacementTarget: "Not applicable - outcome is self-directed campaign success"
        }
      },

      // PART 2: SUCCESS VARIABLES (KPIs)
      successMetrics: {
        // Primary KPI
        projectCompletionRate: 85,
        
        // Secondary KPI
        learnerSatisfaction: 4.5,
        
        // Engagement metrics
        videoWatchTime: 85,
        interactionRate: 80,
        assessmentPerformance: {
          "Ad Fundamentals Quiz": 80,
          "Keyword Research Quiz": 75,
          "Campaign Setup Quiz": 82,
          "Live Campaign Launch": 85
        },
        
        // Outcome metrics
        skillAttainmentRate: 88,
        npsScore: 50,
        businessImpact: {
          "Average ROAS (Return on Ad Spend)": "3.2x",
          "% who ran profitable campaign": 78,
          "% who continued marketing": 65
        },
        
        // Business metrics
        enrollmentCount: 150,
        retentionRate: 42,
        referralRate: 28,
        costPerCompletion: 35
      },

      // PART 3: PROGRAM PLAN (Three Phases)
      aiRecommendations: [
        // Phase 1: Discovery & Design findings
        "Interview insights: Small business owners fear complexity and budget waste",
        "Pain point: Setting up first campaign without wasting money on bad targeting",
        "Success criteria: Building a campaign that actually drives customers",
        
        // Phase 2: Beta findings
        "Keyword Research quiz has 65% pass rate - too theoretical",
        "Solution: Replace theory video with live screencast of real keyword research",
        
        // Phase 3: Iteration results
        "After live demo replacement: Module completion increased 65% → 82%",
        "Satisfaction went 3.8 → 4.3 after adding live campaign sandbox",
        "Next iteration: Add peer case study section sharing real campaign results"
      ]
    };

    const design = await storage.createDesignProcess(designParams);
    console.log(`✅ [DigitalMarketing] Design created: ID ${design.id}`);

    // Create success metrics snapshot
    await storage.createSuccessMetrics({
      designId: design.id,
      completionRate: 85,
      progressVelocity: 7.5,
      engagementScore: 82,
      videoWatchTime: 85,
      interactionRate: 80,
      assessmentPerformance: {
        module1: 82,
        module2: 75,
        module3: 84,
        capstone: 88
      },
      masteryLevel: 84,
      skillAttainmentRate: 88,
      certificationRate: 85,
      satisfactionRating: 4.5,
      npsScore: 50,
      csatScore: 4.3,
      careerImpact: { jobRelevance: "Direct business application" },
      jobPlacementRate: 78,
      ratingScore: 4.6,
      reviewCount: 48,
      enrollmentCount: 150,
      activeStudentCount: 140,
      retentionRate: 42,
      churnRate: 8,
      referralRate: 28,
      referralCount: 42,
      revenueGenerated: 44850,
      costPerCompletion: 35,
      passRate: 85,
      improvementRate: 18,
      courseQualityScore: 87,
      skillAcquisition: {
        "Google Ads Setup": "88%",
        "Campaign Optimization": "84%",
        "Audience Targeting": "82%",
        "Performance Analysis": "86%"
      }
    });
    console.log("✅ [DigitalMarketing] Success metrics recorded");

    // Phase 1: Discovery - Problem identified
    await storage.createFeedbackLoop({
      designId: design.id,
      cycleNumber: 1,
      metricsBeforeSnapshot: {
        completionRate: 65,
        engagementScore: 60,
        masteryLevel: 55,
        satisfactionRating: 3.8
      },
      metricsAfterSnapshot: {
        completionRate: 82,
        engagementScore: 82,
        masteryLevel: 84,
        satisfactionRating: 4.3
      },
      parametersChanged: {
        pedagogyChange: 'Replaced "Keyword Research" theory video with live screencast demo',
        contentDelivery: 'Added hands-on keyword research exercise with real data',
        communityFeature: 'Launched discussion forum for platform troubleshooting'
      },
      contentAdjustments: [
        "Live screencast: Actual keyword research on Google Keyword Planner",
        "Practice exercise: Set up targeting in sandbox environment",
        "Forum: Peer support for common setup questions"
      ],
      improvementAreas: [
        { area: "Module 2 Completion", percentageChange: 26 },
        { area: "Keyword Research Quiz Pass", percentageChange: 12 },
        { area: "Overall Satisfaction", percentageChange: 13 }
      ],
      overallImpact: 17,
      nextCycleRecommendations: [
        "Add peer case study section: Share real campaign ROI results",
        "Create advanced track for learners wanting deeper optimization",
        "Build campaign template library for different industries",
        "Implement AI-powered targeting recommendations"
      ],
      confidenceScore: 88,
      cycleStatus: "completed"
    });
    console.log("✅ [DigitalMarketing] Cycle 1 complete - Live demo improvement validated");

    console.log("[DigitalMarketing] ✅ COMPLETE - Digital Marketing example seeded successfully");
    return design;
  } catch (error) {
    console.error("[DigitalMarketing] Error seeding example:", error);
    throw error;
  }
}
