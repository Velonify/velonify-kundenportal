import type { Kundensicht, PortalDatei, PortalKarte } from '../api/vertrag';
import { heute, tageZwischen, tagesGruppe } from './datum';

export type FeedArt = 'meilenstein' | 'update' | 'hinweis' | 'datei' | 'erledigt' | 'antwort';

export interface FeedEintrag {
  key: string;
  art: FeedArt;
  /** Bold lead-in, e.g. "Erledigt" or a name */
  wer: string;
  was: string;
  detail: string;
  datum: string;
  karte?: string;
  datei?: string;
}

/**
 * "Was neu ist": news, files from Velonify, done cards and the team's latest answer per card, newest first.
 * Own actions are left out – the client knows what they did.
 */
export function baueFeed(d: Kundensicht): FeedEintrag[] {
  const liste: FeedEintrag[] = [];
  for (const n of d.news) {
    const art: FeedArt = n.art === 'meilenstein' || n.art === 'hinweis' ? n.art : 'update';
    liste.push({ key: `n-${n.id}`, art, wer: art === 'meilenstein' ? 'Meilenstein' : art === 'hinweis' ? 'Hinweis' : 'Neuigkeit', was: n.titel, detail: n.text, datum: n.datum });
  }
  for (const f of d.dateien) {
    if (f.von === 'kunde') continue;
    liste.push({ key: `d-${f.id}`, art: 'datei', wer: 'Neue Datei', was: f.name, detail: '', datum: f.geaendert, datei: f.id });
  }
  for (const k of d.karten) {
    if (k.phase === 'erledigt' && k.erledigt_am) liste.push({ key: `e-${k.id}`, art: 'erledigt', wer: 'Erledigt', was: k.titel, detail: '', datum: k.erledigt_am, karte: k.id });
    const letzte = [...k.kommentare].reverse().find((c) => c.team);
    if (letzte) liste.push({ key: `a-${k.id}`, art: 'antwort', wer: letzte.von, was: `zu „${k.titel}“`, detail: letzte.text, datum: letzte.datum, karte: k.id });
  }
  return liste.sort((a, b) => vergleichsZeit(b.datum) - vergleichsZeit(a.datum));
}

/** Plain days sort as the end of that day, so "today" news stay above this morning's file. */
function vergleichsZeit(wert: string): number {
  return /^\d{4}-\d{2}-\d{2}$/.test(wert) ? Date.parse(`${wert}T23:59:59Z`) : Date.parse(wert) || 0;
}

export function gruppiereFeed(eintraege: FeedEintrag[], jetzt = new Date()): { titel: string; eintraege: FeedEintrag[] }[] {
  const gruppen: { titel: string; eintraege: FeedEintrag[] }[] = [];
  for (const e of eintraege) {
    const titel = tagesGruppe(e.datum, jetzt);
    const letzte = gruppen[gruppen.length - 1];
    if (letzte?.titel === titel) letzte.eintraege.push(e);
    else gruppen.push({ titel, eintraege: [e] });
  }
  return gruppen;
}

export interface Projektstand {
  aktuell?: Kundensicht['fahrplan'][number];
  ziel?: Kundensicht['fahrplan'][number];
  tageBisZiel: number | null;
  erledigt: number;
}

/** Current stage (active, else the first open one) and the last dated milestone as the goal. */
export function projektstand(fahrplan: Kundensicht['fahrplan'], jetzt = new Date()): Projektstand {
  const aktuell = fahrplan.find((m) => m.status === 'aktiv') ?? fahrplan.find((m) => m.status === 'offen');
  const ziel = [...fahrplan].reverse().find((m) => m.datum && m.status !== 'erledigt');
  return {
    aktuell,
    ziel,
    tageBisZiel: ziel?.datum ? tageZwischen(heute(jetzt), ziel.datum) : null,
    erledigt: fahrplan.filter((m) => m.status === 'erledigt').length,
  };
}

export const wartendeKarten = (karten: PortalKarte[]) => karten.filter((k) => k.phase === 'wartet');

export const PHASE_TITEL: Record<PortalKarte['phase'], string> = { wartet: 'Wartet auf dich', arbeit: 'In Arbeit', geplant: 'Als Nächstes', erledigt: 'Erledigt' };

/** Display type of a file: short label for the tile. */
export function dateiTyp(d: Pick<PortalDatei, 'name' | 'mimeType'>): string {
  const m = d.mimeType;
  if (m === 'application/vnd.google-apps.document') return 'DOC';
  if (m === 'application/vnd.google-apps.spreadsheet') return 'SHEET';
  if (m === 'application/vnd.google-apps.presentation') return 'SLIDES';
  if (m === 'application/pdf') return 'PDF';
  const endung = /\.([a-z0-9]{1,5})$/i.exec(d.name)?.[1];
  if (endung) return endung.toUpperCase();
  if (m.startsWith('image/')) return 'BILD';
  return 'DATEI';
}

/** Google files are exported as PDF on download. */
export const istGoogleDatei = (d: Pick<PortalDatei, 'mimeType'>) => d.mimeType.startsWith('application/vnd.google-apps.');

/** Initials for the avatar tiles. */
export function initialen(name: string): string {
  const teile = name.trim().split(/\s+/).filter(Boolean);
  if (teile.length === 0) return '?';
  if (teile.length === 1) return teile[0].slice(0, 2).toUpperCase();
  return (teile[0][0] + teile[teile.length - 1][0]).toUpperCase();
}
