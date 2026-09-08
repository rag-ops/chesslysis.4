import { describe, expect, it } from "vitest";
import { parseTimeControl } from "@/lib/time/player-time-management";
describe("time control taxonomy", () => {
  it.each([["600","rapid","10"],["900","rapid","15"],["180","blitz","3"],["180+2","blitz","3 + 2"],["60","bullet","1"],["120+1","bullet","2 + 1"]] as const)("classifies %s",(input,bucket,label)=>{
    const parsed=parseTimeControl(input); expect(parsed.bucket).toBe(bucket); expect(parsed.label).toBe(label);
  });
});
