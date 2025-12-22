import { db } from "./db.js";
import { userCurriculums } from "../shared/schema.js";
import { eq } from "drizzle-orm";

interface ProductionData {
  generationId: string;
  userId: number;
  enrolledCourses: any[];
  userPreferences: any;
  userContext: any;
  curriculumOptions: any[];
  selectedCurriculum: any;
  aiModelVersions: string;
  generationParameters: any;
  aiConfidenceScore: number;
  generationDuration: number;
  createdAt: Date;
}

interface SimilarProduction {
  generationId: string;
  similarity: number;
  curriculum: any;
  metadata: any;
}

/**
 * Production Manager
 * Manages saving and retrieving curriculum productions for reuse and AI training
 */
export class ProductionManager {
  private productionStore: Map<string, ProductionData> = new Map();
  private productionIndex: Map<string, string[]> = new Map();

  /**
   * Save curriculum production for later retrieval and AI training
   */
  async saveProduction(productionData: Partial<ProductionData>): Promise<{
    success: boolean;
    productionId?: string;
    message?: string;
  }> {
    try {
      const productionId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const production: ProductionData = {
        generationId: productionData.generationId || productionId,
        userId: productionData.userId || 0,
        enrolledCourses: productionData.enrolledCourses || [],
        userPreferences: productionData.userPreferences || {},
        userContext: productionData.userContext || {},
        curriculumOptions: productionData.curriculumOptions || [],
        selectedCurriculum: productionData.selectedCurriculum || {},
        aiModelVersions: productionData.aiModelVersions || '1.0.0',
        generationParameters: productionData.generationParameters || {},
        aiConfidenceScore: productionData.aiConfidenceScore || 0,
        generationDuration: productionData.generationDuration || 0,
        createdAt: new Date()
      };

      // Store production
      this.productionStore.set(productionId, production);

      // Index for retrieval
      this._indexProduction(productionId, production);

      // Save to database for persistence
      try {
        await db.insert(userCurriculums).values({
          userId: production.userId,
          curriculumJson: JSON.stringify(production),
          createdAt: new Date()
        } as any).catch(() => {
          // DB table might not exist for productions, skip
        });
      } catch (e) {
        // Silently continue if DB write fails
      }

      return {
        success: true,
        productionId,
        message: 'Production saved successfully'
      };
    } catch (error) {
      console.error('[ProductionManager] Save failed:', error);
      return {
        success: false,
        message: 'Failed to save production'
      };
    }
  }

  /**
   * Retrieve productions similar to user context
   */
  async retrieveSimilarProductions(
    userContext: any,
    maxResults: number = 5
  ): Promise<{
    exactMatches: SimilarProduction[];
    similarPatterns: SimilarProduction[];
    successfulTemplates: SimilarProduction[];
    adaptationSuggestions: any[];
  }> {
    try {
      const allProductions = Array.from(this.productionStore.entries());
      const similarities: SimilarProduction[] = [];

      // Calculate similarity scores
      allProductions.forEach(([prodId, prod]) => {
        const score = this._calculateSimilarity(userContext, prod.userContext);
        if (score > 0.3) {
          similarities.push({
            generationId: prodId,
            similarity: score,
            curriculum: prod.selectedCurriculum,
            metadata: {
              userId: prod.userId,
              createdAt: prod.createdAt,
              aiConfidence: prod.aiConfidenceScore
            }
          });
        }
      });

      // Sort by similarity
      similarities.sort((a, b) => b.similarity - a.similarity);

      // Categorize
      const exactMatches = similarities.filter(s => s.similarity > 0.8).slice(0, maxResults);
      const similarPatterns = similarities.filter(s => s.similarity > 0.5 && s.similarity <= 0.8).slice(0, maxResults);
      const successfulTemplates = similarities.filter(s => s.similarity > 0.3).slice(0, maxResults);

      // Generate adaptation suggestions
      const adaptationSuggestions = this._generateAdaptationSuggestions(
        userContext,
        [...exactMatches, ...similarPatterns]
      );

      return {
        exactMatches,
        similarPatterns,
        successfulTemplates,
        adaptationSuggestions
      };
    } catch (error) {
      console.error('[ProductionManager] Retrieval failed:', error);
      return {
        exactMatches: [],
        similarPatterns: [],
        successfulTemplates: [],
        adaptationSuggestions: []
      };
    }
  }

  /**
   * Get production by ID
   */
  getProduction(productionId: string): ProductionData | null {
    return this.productionStore.get(productionId) || null;
  }

  /**
   * List all user's productions
   */
  async listUserProductions(userId: number): Promise<ProductionData[]> {
    const productions: ProductionData[] = [];
    this.productionStore.forEach((prod) => {
      if (prod.userId === userId) {
        productions.push(prod);
      }
    });
    return productions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Export production for sharing
   */
  exportProduction(productionId: string): string {
    const production = this.productionStore.get(productionId);
    if (!production) {
      return JSON.stringify({ error: 'Production not found' });
    }
    return JSON.stringify(production, null, 2);
  }

  /**
   * Import production from JSON
   */
  async importProduction(jsonData: string): Promise<{
    success: boolean;
    productionId?: string;
    message?: string;
  }> {
    try {
      const production = JSON.parse(jsonData) as ProductionData;
      const productionId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.productionStore.set(productionId, production);
      this._indexProduction(productionId, production);
      return {
        success: true,
        productionId,
        message: 'Production imported successfully'
      };
    } catch (error) {
      console.error('[ProductionManager] Import failed:', error);
      return {
        success: false,
        message: 'Failed to import production'
      };
    }
  }

  // Private helper methods

  private _indexProduction(productionId: string, production: ProductionData): void {
    const keywords: string[] = [];

    // Extract keywords from context
    if (production.userContext?.learningStyle) {
      keywords.push(`style_${production.userContext.learningStyle}`);
    }
    if (production.userContext?.skillLevel) {
      keywords.push(`level_${production.userContext.skillLevel}`);
    }
    if (production.selectedCurriculum?.difficulty) {
      keywords.push(`diff_${production.selectedCurriculum.difficulty}`);
    }

    // Store index
    keywords.forEach(keyword => {
      if (!this.productionIndex.has(keyword)) {
        this.productionIndex.set(keyword, []);
      }
      this.productionIndex.get(keyword)!.push(productionId);
    });
  }

  private _calculateSimilarity(context1: any, context2: any): number {
    let score = 0;
    let comparisons = 0;

    // Compare learning style
    if (context1.learningStyle && context2.learningStyle) {
      comparisons++;
      if (context1.learningStyle === context2.learningStyle) score += 0.3;
    }

    // Compare skill level
    if (context1.skillLevel && context2.skillLevel) {
      comparisons++;
      if (context1.skillLevel === context2.skillLevel) score += 0.3;
    }

    // Compare available hours
    if (context1.availableHours && context2.availableHours) {
      comparisons++;
      const hourDiff = Math.abs(context1.availableHours - context2.availableHours);
      if (hourDiff <= 5) score += 0.3;
      else if (hourDiff <= 10) score += 0.15;
    }

    // Compare goals
    if (context1.goals && context2.goals) {
      comparisons++;
      const commonGoals = context1.goals.filter((g: string) => context2.goals.includes(g)).length;
      const totalGoals = new Set([...context1.goals, ...context2.goals]).size;
      if (totalGoals > 0) {
        score += (commonGoals / totalGoals) * 0.3;
      }
    }

    return comparisons > 0 ? score / comparisons : 0;
  }

  private _generateAdaptationSuggestions(userContext: any, similarProds: SimilarProduction[]): any[] {
    const suggestions: any[] = [];

    if (similarProds.length === 0) {
      return [];
    }

    // Suggest based on successful patterns
    const avgConfidence = similarProds.reduce((sum, p) => sum + (p.metadata.aiConfidence || 0), 0) / similarProds.length;
    if (avgConfidence > 0.7) {
      suggestions.push({
        type: 'confidence_high',
        message: 'Similar users achieved high success. Consider following their pattern.',
        confidence: avgConfidence
      });
    }

    // Suggest variations
    if (similarProds.length > 1) {
      suggestions.push({
        type: 'variation_available',
        message: 'Multiple successful curriculum variations found. You can adapt to your preferences.',
        count: similarProds.length
      });
    }

    return suggestions;
  }
}

// Singleton instance
export const productionManager = new ProductionManager();
