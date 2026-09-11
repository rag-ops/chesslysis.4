import { getRecurringMistakes } from "@/lib/insights/recurring-mistakes";

export type TrainingRecommendation = {
  id: string;
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  objective: string;
  drills: string[];
  evidence: { occurrences: number; gamesAffected: number; averageLoss: number; severity: number };
};

const guidance: Record<string, { objective: string; drills: string[] }> = {
  "Endgame conversion": { objective: "Convert advantages with cleaner king activity and pawn timing.", drills: ["Practice basic king-and-pawn endings", "Review rook endgame conversion positions", "Before pawn pushes, compare king activity first"] },
  "Tactical oversight": { objective: "Reduce missed forcing moves and tactical counterplay.", drills: ["Solve short forcing-move puzzles", "Use checks-captures-threats before committing", "Review the first tactical turning point in each affected game"] },
  "Opening accuracy": { objective: "Reach familiar middlegames without early evaluation loss.", drills: ["Review the first non-book mistake", "Build a compact repertoire note", "Practice recurring opening positions instead of memorizing long lines"] },
  "Calculation breakdown": { objective: "Improve candidate-move selection and short calculation discipline.", drills: ["List two candidate moves before calculation", "Calculate forcing replies one move deeper", "Revisit positions where evaluation dropped by more than one pawn"] },
  "Time-pressure errors": { objective: "Preserve decision quality as the clock gets low.", drills: ["Use simpler candidate selection under time pressure", "Avoid spending disproportionate time in familiar positions", "Practice timed calculation sets"] },
};

export function buildRecommendations(patterns: { theme:string; occurrences:number; gamesAffected:number; averageLoss:number; severity:number }[]): TrainingRecommendation[] {
  return patterns.slice(0, 4).map((pattern, index) => {
    const g = guidance[pattern.theme] ?? guidance["Calculation breakdown"];
    const priority = pattern.severity >= 70 ? "HIGH" : pattern.severity >= 45 ? "MEDIUM" : "LOW";
    return {
      id: `${index + 1}-${pattern.theme.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: pattern.theme,
      priority,
      reason: `${pattern.occurrences} critical errors across ${pattern.gamesAffected} games, averaging ${pattern.averageLoss.toFixed(2)} pawns of evaluation loss.`,
      objective: g.objective,
      drills: g.drills,
      evidence: { occurrences: pattern.occurrences, gamesAffected: pattern.gamesAffected, averageLoss: pattern.averageLoss, severity: pattern.severity },
    };
  });
}

export async function getTrainingPlan(username: string) {
  const mistakes = await getRecurringMistakes(username);
  if (!mistakes) return null;
  const recommendations = buildRecommendations(mistakes.patterns);
  return { username: mistakes.username, gamesAnalyzed: mistakes.gamesAnalyzed, recommendations, summary: { topPriority: recommendations[0]?.title ?? "No urgent weakness detected", focusCount: recommendations.length } };
}
