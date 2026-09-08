import { describe, expect, it } from "vitest";
import { parseTimeControl } from "@/lib/time/player-time-management";

describe("time management classification", () => {
  it("classifies common Chess.com controls", () => {
    expect(parseTimeControl("60").bucket).toBe("bullet");
    expect(parseTimeControl("300").bucket).toBe("blitz");
    expect(parseTimeControl("600").bucket).toBe("rapid");
  });
  it("does not pretend malformed controls are a known speed", () => {
    expect(parseTimeControl("weird-control").bucket).toBe("unknown");
  });
  it("uses explicit daily controls", () => {
    expect(parseTimeControl("daily").bucket).toBe("daily");
  });
});
