import { describe, it, expect, vi } from "vitest";
import { optimizeImage } from "../../../shared/utils/imageOptimizer";

describe("Image Optimizer", () => {
  it("should fail gracefully in non-browser environments", async () => {
    // If run in a standard node environment without jsdom, it should throw
    if (typeof window === "undefined") {
      const file = new File(["dummy content"], "test.png", { type: "image/png" });
      await expect(optimizeImage(file)).rejects.toThrow("Image optimization can only run in the browser.");
    } else {
      expect(true).toBe(true);
    }
  });
});
