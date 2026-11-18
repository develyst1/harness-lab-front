// The reference page's card-memory formula (reference/index.html lines 460–462 and 476). The card size and the
// "fits" line come from the pack: page.json → behind.gauge.cardMiB / .comfort.

/** Share of the card a peak uses, as a whole percent. */
export const pct = (mib: number, cardMiB: number): number => Math.round((mib / cardMiB) * 100);

/** MiB as GB text with one decimal. */
export const gb = (mib: number): string => (mib / 1024).toFixed(1);

/** Over the line the page counts as "fits" (`comfort` is a fraction, e.g. 0.75). */
export const tight = (mib: number, cardMiB: number, comfort: number): boolean => pct(mib, cardMiB) > comfort * 100;
