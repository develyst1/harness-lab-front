// The multi-page site's words (TASK-042 comp, SPEC-012). Area labels and page names come from SPEC-012 § Site map's
// titles ("การเช่าทั้งหมด" shortened to "การเช่า", as its breadcrumb example writes it); the tab labels are SPEC-012's; the
// story block's kicker and title are the PM's from Story.tsx; the load-error line is today's (app/page.tsx).
// PROPOSED = the FE's wording for the comp, for the PM to keep or change.

/** The areas in the navbar and the home's doors, in SPEC-012 § Site map order. `unit`: the door's count word. */
export const AREAS = [
  { key: "runs", label: "การเช่า", unit: "รอบ" },
  { key: "compare", label: "เทียบเอง" },
  { key: "techniques", label: "เทคนิค", unit: "เทคนิค" },
  { key: "studies", label: "งานศึกษา", unit: "งาน" },
  { key: "hardware", label: "สเปกและงบ", unit: "ระดับ" },
  { key: "clips", label: "ดูคลิป", unit: "คลิป" },
  { key: "story", label: "เรื่องเล่า", unit: "ตอน" },
  { key: "about", label: "เบื้องหลัง" },
  { key: "glossary", label: "คำศัพท์", unit: "คำ" },
] as const; // units PROPOSED

/** An area's nav label, e.g. for its page title. */
export const areaLabel = (key: (typeof AREAS)[number]["key"]) => AREAS.find((a) => a.key === key)?.label ?? key;

/** `<name> · Harness Lab` (SPEC-012 § Site map titles). */
export const pageTitle = (name: string) => `${name} · Harness Lab`;

export const W = {
  home: "หน้าแรก",
  crumbs: "ตำแหน่งของหน้านี้", // PROPOSED (aria-label)
  nav: "ไปยังส่วน", // today's nav label (Nav.tsx)
  tabs: { summary: "สรุป", items: "รายการทดสอบ", clips: "คลิป" },
  tabsLabel: "ส่วนของการเช่านี้", // PROPOSED (aria-label)
  doors: "ทุกส่วนของเว็บ", // PROPOSED (aria-label)
  storyKicker: "เรื่องเล่า",
  storyTitle: "เราทดลองอะไร ทีละรอบ",
  latestRun: "การเช่าล่าสุด", // PROPOSED
  latestStudy: "งานศึกษาล่าสุด", // PROPOSED
  allRuns: "การเช่าทั้งหมด",
  sortBy: "เรียงตาม", // PROPOSED
  sort: { date: "ล่าสุดก่อน", cost: "ถูกสุดก่อน" }, // PROPOSED
  search: "ค้นหาการเช่าและเทคนิค (ชื่อเท่านั้น)", // PROPOSED
  searchNone: "ไม่พบชื่อที่ตรงกัน", // PROPOSED
  kind: { run: "การเช่า", technique: "เทคนิค" },
  prev: "ก่อนหน้า", // PROPOSED
  next: "ถัดไป", // PROPOSED
  notFound: "ไม่พบหน้านี้", // PROPOSED
  backHome: "กลับหน้าแรก", // PROPOSED
  loadError: "โหลดข้อมูลการทดลองไม่ได้ ลองรีเฟรชอีกครั้ง",
} as const;
