import type { Sitzung } from '../api/vertrag';
import { speicher } from './speicher';

const KEY = 'velonify-portal.sitzung';

/** The session token, or null when there is none or it ran out. */
export function holeSitzung(jetzt = Date.now()): string | null {
  const roh = speicher.lies(KEY);
  if (!roh) return null;
  try {
    const s = JSON.parse(roh) as Sitzung;
    if (s.sitzung && Date.parse(s.gueltig_bis) > jetzt) return s.sitzung;
  } catch {
    // broken entry, drop it
  }
  speicher.schreib(KEY, null);
  return null;
}

export function speichereSitzung(s: Sitzung | null): void {
  speicher.schreib(KEY, s ? JSON.stringify(s) : null);
}
