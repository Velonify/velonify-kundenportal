/** Dates in the portal: German, Europe/Berlin, short. Day strings are YYYY-MM-DD, timestamps ISO. */

const ZONE = 'Europe/Berlin';
const tagFormat = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });
const kurz = new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', day: 'numeric', month: 'short' });
const kurzJahr = new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
const wochentag = new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', weekday: 'long' });
const uhr = new Intl.DateTimeFormat('de-DE', { timeZone: ZONE, hour: '2-digit', minute: '2-digit' });

/** YYYY-MM-DD in Berlin of a timestamp (or of a day string, unchanged). */
export function tagVon(wert: string | Date): string {
  if (typeof wert === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(wert)) return wert;
  const d = typeof wert === 'string' ? new Date(wert) : wert;
  return Number.isNaN(d.getTime()) ? '' : tagFormat.format(d);
}

export const heute = (jetzt = new Date()) => tagVon(jetzt);

const alsUtc = (tag: string) => new Date(`${tag}T00:00:00Z`);

/** Whole days from `von` to `bis` (both YYYY-MM-DD). */
export function tageZwischen(von: string, bis: string): number {
  return Math.round((alsUtc(bis).getTime() - alsUtc(von).getTime()) / 864e5);
}

/** "16. Okt." – with year when it is not this year. */
export function datumKurz(wert: string, jetzt = new Date()): string {
  const tag = tagVon(wert);
  if (!tag) return '';
  return (tag.slice(0, 4) === heute(jetzt).slice(0, 4) ? kurz : kurzJahr).format(alsUtc(tag));
}

/** "heute", "morgen", "gestern", weekday within a week, else the short date. */
export function datumRelativ(wert: string, jetzt = new Date()): string {
  const tag = tagVon(wert);
  if (!tag) return '';
  const diff = tageZwischen(heute(jetzt), tag);
  if (diff === 0) return 'heute';
  if (diff === 1) return 'morgen';
  if (diff === -1) return 'gestern';
  if (diff > 1 && diff < 7) return wochentag.format(alsUtc(tag));
  return datumKurz(tag, jetzt);
}

/** Time of day for timestamps; empty for plain days. */
export function uhrzeit(wert: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(wert)) return '';
  const d = new Date(wert);
  return Number.isNaN(d.getTime()) ? '' : uhr.format(d);
}

/** Section heading of the activity feed. */
export function tagesGruppe(wert: string, jetzt = new Date()): string {
  const diff = tageZwischen(heute(jetzt), tagVon(wert));
  if (diff >= 0) return 'Heute';
  if (diff === -1) return 'Gestern';
  if (diff > -7) return 'Diese Woche';
  if (diff > -31) return 'Diesen Monat';
  return 'Früher';
}
