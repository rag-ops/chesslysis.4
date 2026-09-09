import { describe, expect, it } from "vitest";
import { parseTimeControl } from "@/lib/time/player-time-management";

describe("time management classification", () => {
  it("classifies common Chess.com controls", () => {
    expect(parseTimeControl("60").bucket).toBe("bullet");
    expect(parseTimeControl("300").bucket).toBe("blitz");
    expect(parseTimeControl("600").bucket).toBe("rapid");
  });
  it("uses the product's explicit speed families and readable labels", () => {
    expect(parseTimeControl("120+1")).toMatchObject({ bucket: "bullet", label: "2 min + 1" });
    expect(parseTimeControl("180+2")).toMatchObject({ bucket: "blitz", label: "3 min + 2" });
    expect(parseTimeControl("300")).toMatchObject({ bucket: "blitz", label: "5 min" });
    expect(parseTimeControl("600")).toMatchObject({ bucket: "rapid", label: "10 min" });
    expect(parseTimeControl("1800")).toMatchObject({ bucket: "rapid", label: "30 min" });
  });
  it("does not pretend malformed controls are a known speed", () => {
    expect(parseTimeControl("weird-control").bucket).toBe("unknown");
  });
  it("uses explicit daily controls", () => {
    expect(parseTimeControl("daily").bucket).toBe("daily");
  });
});
