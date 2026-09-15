/**
 * Topic mastery combines study signals and exam performance (learning loop).
 */
export function computeTopicScore(studyScore: number, examScore: number, examWeight = 0.6): number {
  const s = Math.max(0, Math.min(1, studyScore));
  const e = Math.max(0, Math.min(1, examScore));
  const w = Math.max(0, Math.min(1, examWeight));
  return s * (1 - w) + e * w;
}

export function formatWeakObjectiveMessage(code: string, score: number): string {
  return `Objective ${code} is weak (${(score * 100).toFixed(0)}%). Suggested: short review + 5-question check.`;
}
