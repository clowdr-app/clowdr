import { expect } from "vitest";

export default function expectWithinRange(min: number, max: number, value: number): void {
    expect(value).toBeLessThanOrEqual(max);
    expect(value).toBeGreaterThanOrEqual(min);
}
