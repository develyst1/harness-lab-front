"use client";

import { usePathname } from "next/navigation";

// Footer: reference/index.html line 419; text from page.json → footer. On a study's page (/studies/<id>) it shows the
// study's own line instead (TASK-058 Q3, the SA): the site footer gives the runs' reason for keeping logs off the site,
// which is wrong for the meeting study, whose meetings are synthetic (Modio, REQ-010 review A1 fix 1).
export function Footer({ text, studyText }: { text: string; studyText?: string }) {
  const path = usePathname();
  const study = studyText && /^\/studies\/[^/]+\/?$/.test(path ?? "");
  return <footer>{study ? studyText : text}</footer>;
}
