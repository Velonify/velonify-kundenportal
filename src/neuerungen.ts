import type { Kundensicht } from './api/vertrag';

/**
 * "Neu im Portal": every feature PR adds its entry here (newest first). Contacts who finished the tour before `datum`
 * get a short spotlight on `ziel` once (see lib/rundgang.ts); the menu lists all entries.
 * `id` stays fixed forever (lowercase, digits, dashes); `ziel` is a `data-rundgang` mark on `seite`.
 */
export interface Neuerung {
  id: string;
  /** Release day, YYYY-MM-DD */
  datum: string;
  titel: string;
  text: string;
  ziel?: string;
  seite?: 'start' | 'projekt' | 'zahlen' | 'dateien' | 'werkzeuge';
  /** Only for clients where it applies (e.g. with the numbers tab). */
  bedingung?: (d: Kundensicht) => boolean;
}

export const NEUERUNGEN: readonly Neuerung[] = [
  {
    id: '2026-10-rundgang',
    datum: '2026-10-18',
    titel: 'Rundgang durchs Portal',
    text: 'Du willst noch mal sehen, wo was ist? Den Rundgang startest du jederzeit in deinem Menü oben rechts.',
    ziel: 'menue',
  },
  {
    id: '2026-10-feedback',
    datum: '2026-10-16',
    titel: 'Feedback an Velonify',
    text: 'Sag uns, wie zufrieden du bist – zu Monatsberichten, Etappen und erledigten Aufgaben oder jederzeit frei über dein Menü.',
    ziel: 'menue',
  },
  {
    id: '2026-10-termin',
    datum: '2026-10-16',
    titel: 'Termin direkt buchen',
    text: 'Bei deinem Team kannst du jetzt direkt einen Termin buchen, ohne Mail-Pingpong.',
    ziel: 'team',
    seite: 'start',
    bedingung: (d) => Object.keys(d.termine ?? {}).length > 0,
  },
  {
    id: '2026-10-monatsbericht',
    datum: '2026-10-16',
    titel: 'Monatsbericht',
    text: 'Jeden Monat fassen wir deine Zahlen, erledigte Aufgaben und unsere Einschätzung zusammen – unter „Zahlen“, auch als PDF.',
    ziel: 'zahlen',
    seite: 'zahlen',
    bedingung: (d) => !!d.zahlen || (d.berichte?.length ?? 0) > 0,
  },
  {
    id: '2026-10-zahlen',
    datum: '2026-10-16',
    titel: 'Deine Zahlen',
    text: 'Besucher, Umsatz, Google-Suche und Ladezeit deines Shops, täglich aktuell.',
    ziel: 'zahlen',
    seite: 'zahlen',
    bedingung: (d) => !!d.zahlen || (d.berichte?.length ?? 0) > 0,
  },
];
