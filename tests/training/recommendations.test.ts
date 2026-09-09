import { describe, expect, it } from "vitest";
import { buildRecommendations } from "@/lib/training/recommendations";
describe("training recommendations",()=>{
 it("ranks high severity patterns as HIGH priority",()=>{const [r]=buildRecommendations([{theme:"Tactical oversight",occurrences:8,gamesAffected:6,averageLoss:.9,severity:75}]);expect(r.priority).toBe("HIGH");});
 it("preserves numeric evidence without strict floating arithmetic assertions",()=>{const [r]=buildRecommendations([{theme:"Opening accuracy",occurrences:4,gamesAffected:3,averageLoss:.6,severity:50}]);expect(r.evidence.averageLoss).toBeCloseTo(.6,10);});
});
