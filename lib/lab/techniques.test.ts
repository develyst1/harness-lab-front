import { describe, expect, test } from "bun:test";
import { evidenceRows, groupName, withRow, toggledRow } from "./techniques";

const runs = [{ id: "R1" }, { id: "R3" }, { id: "R4a" }, { id: "R6" }];

describe("evidenceRows — a technique links only rows that are on the page (SPEC-003)", () => {
  test("keeps ids in pack order", () => {
    expect(evidenceRows(["R6", "R1", "R4a"], runs)).toEqual(["R6", "R1", "R4a"]);
  });

  test("drops an id with no row (AC-7: no broken link)", () => {
    expect(evidenceRows(["R99", "R3", "rent 7"], runs)).toEqual(["R3"]);
  });

  test("missing rows → []", () => {
    expect(evidenceRows(undefined, runs)).toEqual([]);
  });

  test("empty rows → []", () => {
    expect(evidenceRows([], runs)).toEqual([]);
  });
});

describe("groupName — the group in Thai from page.techniques.groups", () => {
  const groups = { harness: "harness", process: "ขั้นตอนทีม" };

  test("a known key shows its Thai name", () => {
    expect(groupName(groups, "process")).toBe("ขั้นตอนทีม");
  });

  test("an unknown key shows the key itself (AC-7)", () => {
    expect(groupName(groups, "unknown-x")).toBe("unknown-x");
  });

  test("a key that names an Object built-in still shows the key", () => {
    expect(groupName(groups, "constructor")).toBe("constructor");
    expect(groupName(groups, "toString")).toBe("toString");
  });
});

describe("open rows in ประวัติ", () => {
  test("withRow opens a closed row and leaves the others", () => {
    const open = withRow(new Set(["R1"]), "R3");
    expect([...open].sort()).toEqual(["R1", "R3"]);
  });

  test("withRow twice keeps the row open, same set back", () => {
    const once = withRow(new Set<string>(), "R3");
    const twice = withRow(once, "R3");
    expect(twice).toBe(once);
    expect(twice.has("R3")).toBe(true);
  });

  test("toggledRow opens a closed row and closes an open one", () => {
    const opened = toggledRow(new Set(["R1"]), "R3");
    expect([...opened].sort()).toEqual(["R1", "R3"]);
    expect([...toggledRow(opened, "R1")]).toEqual(["R3"]);
  });

  test("neither changes the set it was given", () => {
    const start = new Set(["R1"]);
    withRow(start, "R3");
    toggledRow(start, "R1");
    expect([...start]).toEqual(["R1"]);
  });
});
