import { test, expect } from "bun:test"; test("ci guard: this must fail", () => { expect(1).toBe(2); });
