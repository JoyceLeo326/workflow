import { describe, expect, it } from "vitest";
import { INSPIRATION_SOURCES, SAFE_REFERENCE_LICENSES } from "../sources";

describe("INSPIRATION_SOURCES", () => {
  it("records only safe implementation references with explicit differentiation notes", () => {
    expect(INSPIRATION_SOURCES).toHaveLength(3);
    expect([...SAFE_REFERENCE_LICENSES]).toEqual(["MIT License", "Apache License 2.0"]);

    for (const source of INSPIRATION_SOURCES) {
      expect(SAFE_REFERENCE_LICENSES).toContain(source.license);
      expect(source.license).toMatch(/License/);
      expect(source.url).toMatch(/^https:\/\/github\.com\//);
      expect(source.starsObserved).toBeGreaterThan(10000);
      expect(source.noCopyPolicy).toContain("No source code");
      expect(source.differentiation).toHaveLength(3);
    }
  });
});
