import { storage } from "./storage.js";

export async function seedCurriculumFramework() {
  try {
    // Create a design process for the Data Science Bootcamp example
    const design = await storage.createDesignProcess({
      userId: 1,
      designName: "Data Science Bootcamp - Evidence-Based Framework",
      status: "active",
      stage: "deployment",
      progressPercent: 95,
      parameters: {
        learner: {
          audience: "Career changers, professionals seeking upskilling",
          demographics: "Ages 25-45, working professionals, diverse backgrounds",
          psychographics: "Career goals: transition to data roles; Learning prefs: hands-on project-based",
          skillGap: "Need Python, statistics, ML fundamentals; moving from non-technical to data-technical",
        },
        content: {
          scope: "Data fundamentals → Statistics → Python → SQL → ML → Capstone projects",
          modularity: "8 core modules, each 12-15 hours; 10-30 min micro-lessons",
          modalities: { video: "40%", interactive: "40%", text: "15%", projects: "5%" },
          pedagogicalApproach: "Project-based (week 2+), mastery-gated progression, peer learning",
          assessmentFormative: "Weekly quizzes, coding exercises, peer code reviews",
          assessmentSummative: "Capstone project, portfolio, industry certification",
        },
        business: {
          targetStudents: 100,
          costPerStudent: 500,
          revenuePerStudent: 1500,
          targetCompletion: 90,
          businessGoals: ["Job placement rate 85%", "Student satisfaction 4.7/5", "Revenue $150k"],
          instructor: "PhD Data Science + 10 years industry",
          credibility: "Published research, 2000+ students trained",
          platformCapabilities: "Live coding, project submissions, peer matching, certificates",
        },
      },
      successMetrics: {
        targetEffectiveness: 90,
        quantitativeTargets: {
          completionRate: 90,
          masteryLevel: 85,
          engagementScore: 85,
          passRate: 88,
          retentionRate: 92,
        },
        qualitativeTargets: {
          satisfactionRating: 4.7,
          courseQualityScore: 92,
          skillAcquisition: ["Python proficiency", "Statistical thinking", "ML model building"],
        },
      },
      generatedCurriculum: {
        modules: [
          { id: 1, title: "Data Fundamentals", duration: 12, projects: 1 },
          { id: 2, title: "Python Essentials", duration: 14, projects: 2 },
          { id: 3, title: "Statistics for Data Science", duration: 15, projects: 2 },
          { id: 4, title: "Exploratory Data Analysis", duration: 13, projects: 1 },
          { id: 5, title: "SQL & Databases", duration: 12, projects: 1 },
          { id: 6, title: "Machine Learning Fundamentals", duration: 16, projects: 3 },
          { id: 7, title: "Advanced ML & Deployment", duration: 14, projects: 2 },
          { id: 8, title: "Capstone: End-to-End Project", duration: 20, projects: 1 },
        ],
        totalHours: 116,
        totalProjects: 13,
      },
      aiRecommendations: [
        "Start projects in week 2 to drive early engagement",
        "Implement peer programming for statistics module (most challenging)",
        "Use real datasets from learner industries to increase relevance",
        "Add weekly 'success stories' from alumni to boost motivation",
      ],
      currentEffectiveness: 88,
      version: 1,
    });

    // Create success metrics snapshot
    await storage.createSuccessMetrics({
      designId: design.id,
      completionRate: 88,
      engagementScore: 86,
      masteryLevel: 84,
      satisfactionRating: 4.6,
      courseQualityScore: 89,
      enrollmentCount: 150,
      activeStudentCount: 145,
      passRate: 85,
      improvementRate: 12,
      studentFeedback: [
        { rating: 5, comment: "Best bootcamp I've done - projects are real-world" },
        { rating: 4, comment: "Statistics module was challenging but rewarding" },
        { rating: 5, comment: "Peer programming helped me understand concepts deeply" },
      ],
      skillAcquisition: {
        "Python Proficiency": "85%",
        "Statistical Thinking": "82%",
        "ML Model Building": "80%",
        "SQL Querying": "87%",
      },
    });

    // Create a completed feedback loop example
    await storage.createFeedbackLoop({
      designId: design.id,
      cycleNumber: 1,
      metricsBeforeSnapshot: {
        completionRate: 65,
        satisfactionRating: 3.2,
        engagementScore: 65,
        masteryLevel: 55,
      },
      metricsAfterSnapshot: {
        completionRate: 78,
        satisfactionRating: 4.1,
        engagementScore: 82,
        masteryLevel: 72,
      },
      parametersChanged: {
        pedagogyChange: "Moved projects from week 4 to week 2",
        mentorshipIncrease: "2x per week → 3x per week",
        contentSimplification: "Added visual explanations to statistics intro",
      },
      contentAdjustments: [
        "Created interactive statistics visualizations",
        "Added real-world case studies to each module",
        "Introduced peer code review process",
      ],
      improvementAreas: [
        { area: "Completion Rate", percentageChange: 20 },
        { area: "Satisfaction", percentageChange: 28 },
        { area: "Engagement", percentageChange: 26 },
      ],
      overallImpact: 24,
      nextCycleRecommendations: [
        "Expand peer learning features - they're driving higher engagement",
        "Create competition/gamification for additional motivation",
        "Consider cohort-based async support for flexibility",
      ],
      confidenceScore: 92,
      cycleStatus: "completed",
    });

    console.log("✅ Curriculum framework seeded successfully");
    console.log(`📊 Design ID: ${design.id}`);
    console.log("🎯 Framework saved with parameters, metrics, and feedback loops");
  } catch (error) {
    console.error("Error seeding curriculum framework:", error);
  }
}
