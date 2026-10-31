import { describe, expect, it } from "vitest";
import { fitWithinMaxEdge } from "./compress-wizard-image";

describe("fitWithinMaxEdge", () => {
  it("shrinks a tall phone photo so its long edge meets the limit", () => {
    expect(fitWithinMaxEdge(3024, 4032, 2048)).toEqual({
      width: 1536,
      height: 2048,
    });
  });

  it("shrinks a wide photo by the same rule", () => {
    expect(fitWithinMaxEdge(4032, 3024, 2048)).toEqual({
      width: 2048,
      height: 1536,
    });
  });

  it("never enlarges a small screenshot", () => {
    expect(fitWithinMaxEdge(720, 1280, 2048)).toEqual({
      width: 720,
      height: 1280,
    });
  });
});
