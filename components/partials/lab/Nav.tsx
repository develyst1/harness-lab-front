// The sticky bar of six stops (reference/index.html lines 218–221). `active` = the section in view (scroll-spy,
// reference lines 593–600, run by LabContent).
const STOPS = [
  ["answer", "คำตอบ"],
  ["clips", "ดูคลิป"],
  ["history", "ประวัติ"],
  ["compare", "เทียบเอง"],
  ["plan", "สเปกและงบ"],
  ["behind", "เบื้องหลัง"],
] as const;

export const STOP_IDS = STOPS.map(([id]) => id);

/** `brandOnly`: the load-error page shows the brand and no stops (SPEC-001). */
export function Nav({ brandOnly = false, active }: { brandOnly?: boolean; active?: string }) {
  return (
    <nav className="nav" aria-label="ไปยังส่วน">
      <div className="in">
        <span className="brand">
          Harness <span>Lab</span>
        </span>
        {!brandOnly &&
          STOPS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={id === active ? "on" : undefined} aria-current={id === active ? "true" : undefined}>
              {label}
            </a>
          ))}
      </div>
    </nav>
  );
}
