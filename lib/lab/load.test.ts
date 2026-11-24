import { afterEach, describe, expect, test } from "bun:test";
import { isLabData, loadLab } from "./load";

// lib/lab/load.ts (SPEC-012 § Conventions): today's loadLab and isLabData, moved out of app/page.tsx unchanged so every
// page can call them. Test data only.
const five = { runs: [], tiers: [], meta: {}, page: {}, techniques: [] };

describe("isLabData — pack v3 on: runs, tiers, techniques arrays and meta, page objects, all five", () => {
  test("the five keys of the right kinds → true; extra keys (meeting) do not matter", () => {
    expect(isLabData(five)).toBe(true);
    expect(isLabData({ ...five, meeting: null, extra: 1 })).toBe(true);
  });

  test("a missing key, or one of the wrong kind → false", () => {
    for (const k of Object.keys(five)) expect(isLabData(Object.fromEntries(Object.entries(five).filter(([key]) => key !== k)))).toBe(false);
    expect(isLabData({ ...five, runs: {} })).toBe(false);
    expect(isLabData({ ...five, meta: [] })).toBe(false);
    expect(isLabData({ ...five, page: null })).toBe(false);
  });

  test("not an object → false", () => {
    for (const v of [null, undefined, [], "x", 1]) expect(isLabData(v)).toBe(false);
  });
});

describe("loadLab — the back's body, or null for the load-error line", () => {
  const realFetch = globalThis.fetch;
  const realError = console.error;
  afterEach(() => {
    globalThis.fetch = realFetch;
    console.error = realError;
  });
  const answer = (status: number, body: unknown) => {
    globalThis.fetch = (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
    console.error = () => {};
  };

  test("a good body → the five keys, with meeting kept only when it is an object", async () => {
    answer(200, { ...five, meeting: { titleTh: "t" }, extra: 1 });
    expect(JSON.stringify(await loadLab())).toBe(JSON.stringify({ ...five, meeting: { titleTh: "t" } }));
    answer(200, { ...five, meeting: [1] });
    expect((await loadLab())?.meeting).toBeNull();
    answer(200, five);
    expect((await loadLab())?.meeting).toBeNull();
  });

  test("a non-200 answer, a body without the five, or a failed fetch → null", async () => {
    answer(500, five);
    expect(await loadLab()).toBeNull();
    answer(200, { runs: [] });
    expect(await loadLab()).toBeNull();
    globalThis.fetch = (async () => { throw new Error("down"); }) as unknown as typeof fetch;
    expect(await loadLab()).toBeNull();
  });
});
