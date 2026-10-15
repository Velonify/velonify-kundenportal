import { speicher } from './speicher';

/**
 * When this browser last looked at the portal, per client: files and news newer than that get a "Neu" mark.
 * The mark of the previous visit is kept for the whole visit, so it does not vanish while you read.
 */
const key = (kuerzel: string) => `velonify-portal.zuletzt.${kuerzel}`;
const besuch = new Map<string, string>();

export function letzterBesuch(kuerzel: string): string {
  if (!besuch.has(kuerzel)) {
    besuch.set(kuerzel, speicher.lies(key(kuerzel)) ?? '');
    speicher.schreib(key(kuerzel), new Date().toISOString());
  }
  return besuch.get(kuerzel)!;
}

/** New since the last visit; nothing is "new" on the very first visit. */
export function istNeu(datum: string, seit: string): boolean {
  return !!seit && !!datum && (/^\d{4}-\d{2}-\d{2}$/.test(datum) ? datum > seit.slice(0, 10) : datum > seit);
}
