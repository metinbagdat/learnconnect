import express from "express";
import {
  generateAYTCurriculum,
  generateLearningTree,
  generateStudyPlan
} from "../ai/ai-reasoning.engine.js";
import { logger } from "../utils/logger.js";

const router = express.Router();

/* AYT full curriculum */
router.post("/generate-ayt-curriculum", async (_req, res) => {
  const requestId = `req_${Date.now()}`;
  try {
    logger.info("Generating AYT curriculum", {
      module: "ai-routes",
      action: "generate-ayt-curriculum",
      requestId
    });
    
    const data = await generateAYTCurriculum();
    
    logger.info("AYT curriculum generated successfully", {
      module: "ai-routes",
      action: "generate-ayt-curriculum",
      requestId
    });
    
    res.json({ 
      success: true, 
      data,
      message: "AYT müfredatı başarıyla oluşturuldu"
    });
  } catch (error: any) {
    logger.error("AYT curriculum generation failed", 
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-routes",
        action: "generate-ayt-curriculum",
        requestId
      }
    );
    
    res.status(500).json({ 
      success: false,
      error: error.message || "AYT müfredatı oluşturulamadı"
    });
  }
});

/* Learning tree for topic */
router.post("/generate-learning-tree", async (req, res) => {
  const requestId = `req_${Date.now()}`;
  try {
    const { topicTitle, subject } = req.body;
    
    if (!topicTitle) {
      return res.status(400).json({ 
        success: false, 
        error: "topicTitle is required" 
      });
    }
    
    logger.info("Generating learning tree", {
      module: "ai-routes",
      action: "generate-learning-tree",
      requestId,
      topicTitle,
      subject
    });
    
    const data = await generateLearningTree(topicTitle, subject || "AYT Matematik");
    
    logger.info("Learning tree generated successfully", {
      module: "ai-routes",
      action: "generate-learning-tree",
      requestId
    });
    
    res.json({ 
      success: true, 
      data,
      message: `"${topicTitle}" için öğrenme ağacı oluşturuldu`
    });
  } catch (error: any) {
    logger.error("Learning tree generation failed", 
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-routes",
        action: "generate-learning-tree",
        requestId
      }
    );
    
    res.status(500).json({ 
      success: false,
      error: error.message || "Öğrenme ağacı oluşturulamadı"
    });
  }
});

/* Study plan */
router.post("/generate-study-plan", async (req, res) => {
  const requestId = `req_${Date.now()}`;
  try {
    const { topicTitle, totalHours, level, dailyHours } = req.body;
    
    if (!topicTitle) {
      return res.status(400).json({ 
        success: false, 
        error: "topicTitle is required" 
      });
    }
    
    logger.info("Generating study plan", {
      module: "ai-routes",
      action: "generate-study-plan",
      requestId,
      topicTitle,
      totalHours,
      level,
      dailyHours
    });
    
    const data = await generateStudyPlan(
      topicTitle, 
      totalHours || 8, 
      level || "medium",
      dailyHours || 2
    );
    
    logger.info("Study plan generated successfully", {
      module: "ai-routes",
      action: "generate-study-plan",
      requestId
    });
    
    res.json({ 
      success: true, 
      data,
      message: `"${topicTitle}" için çalışma planı oluşturuldu`
    });
  } catch (error: any) {
    logger.error("Study plan generation failed", 
      error instanceof Error ? error : new Error(String(error)),
      {
        module: "ai-routes",
        action: "generate-study-plan",
        requestId
      }
    );
    
    res.status(500).json({ 
      success: false,
      error: error.message || "Çalışma planı oluşturulamadı"
    });
  }
});

// Test endpoint
router.get("/test", (_req, res) => {
  res.json({ 
    success: true, 
    message: "AI Routes çalışıyor",
    endpoints: [
      "POST /api/ai/generate-ayt-curriculum",
      "POST /api/ai/generate-learning-tree",
      "POST /api/ai/generate-study-plan"
    ]
  });
});

export default router;
