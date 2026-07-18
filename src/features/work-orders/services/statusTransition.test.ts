import { describe, it, expect } from "vitest";
import { canTransitionTo } from "./statusTransitions";

describe("Work Order Status Transitions", () => {
  it("should allow transition from DRAFT to RECEIVED", () => {
    expect(canTransitionTo("DRAFT", "RECEIVED")).toBe(true);
  });

  it("should block transition from DRAFT to COMPLETED", () => {
    expect(canTransitionTo("DRAFT", "COMPLETED")).toBe(false);
  });

  it("should allow transition from IN_PROGRESS to ON_HOLD", () => {
    expect(canTransitionTo("IN_PROGRESS", "ON_HOLD")).toBe(true);
  });

  it("should allow transition from ON_HOLD to IN_PROGRESS", () => {
    expect(canTransitionTo("ON_HOLD", "IN_PROGRESS")).toBe(true);
  });

  it("should block transition from DELIVERED to any other state", () => {
    expect(canTransitionTo("DELIVERED", "IN_PROGRESS")).toBe(false);
    expect(canTransitionTo("DELIVERED", "CANCELLED")).toBe(false);
  });

  it("should block transition from CANCELLED to any other state", () => {
    expect(canTransitionTo("CANCELLED", "RECEIVED")).toBe(false);
  });
});
