import type { Kundensicht } from '../api/vertrag';
import type { Neuerung } from '../neuerungen';

/** One step of the tour: a spotlight on the element marked `data-rundgang="<ziel>"`, on page `seite`. */
export interface Schritt {
  id: string;
  titel: string;
  text: string;
  /** No target: a card in the middle of the screen. */
  ziel?: string;
  seite?: 'start' | 'projekt' | 'zahlen' | 'dateien' | 'werkzeuge';
}

/** Which tour to show: the full tour, or new features (ids get saved as seen). */
export type Tour = { art: 'rundgang'; schritte: Schritt[] } | { art: 'neu'; schritte: Schritt[]; ids: string[] };

const und = (teile: string[]) => (teile.length < 2 ? teile.join('') : `${teile.slice(0, -1).join(', ')} und ${teile.at(-1)}`);

/** The tour for this client: only steps for what they have (numbers, tools, booking pages …). */
export function rundgangSchritte(daten: Kundensicht): Schritt[] {
  const team = und(daten.team);
  const termine = Object.keys(daten.termine ?? {}).length > 0;
  const zahlen = !!daten.zahlen || (daten.berichte?.length ?? 0) > 0;
  const werkzeuge = daten.werkzeuge.length > 0;
  const schritte: (Schritt | false)[] = [
    {
      id: 'willkommen',
      titel: `Willkommen${daten.ich.vorname && !daten.vorschau ? `, ${daten.ich.vorname}` : ''}!`,
      text: `Hier siehst du jederzeit, woran wir für ${daten.kunde.name} arbeiten${team ? ` – mit ${team} aus dem Velonify-Team` : ''}. Wir zeigen dir kurz, wo was ist.`,
    },
    {
      id: 'zu-tun',
      seite: 'start',
      ziel: 'zu-tun',
      titel: 'Für dich zu tun',
      text: 'Braucht etwas deine Freigabe oder eine Antwort, landet es hier. Mit einem Klick freigeben oder eine Änderung wünschen.',
    },
    {
      id: 'projekt',
      seite: 'projekt',
      ziel: 'projekt',
      titel: 'Dein Projekt',
      text: 'Der Fahrplan zeigt, wo wir stehen. Darunter jede Aufgabe: was wartet, was in Arbeit ist, was erledigt ist. Zu jeder Aufgabe kannst du kommentieren.',
    },
    {
      id: 'anfrage',
      ziel: 'anfrage',
      titel: 'Neue Anfrage',
      text: 'Ein Wunsch, ein Fehler im Shop, eine Idee? Schick sie uns hier – gern mit Dateien. Daraus wird direkt eine Aufgabe für das Team.',
    },
    zahlen && {
      id: 'zahlen',
      seite: 'zahlen',
      ziel: 'zahlen',
      titel: 'Deine Zahlen',
      text: 'Besucher, Umsatz, Google-Suche und Ladezeit auf einen Blick, täglich aktuell. Jeden Monat kommt hier auch dein Monatsbericht mit unserer Einschätzung dazu.',
    },
    {
      id: 'dateien',
      seite: 'dateien',
      ziel: 'dateien',
      titel: werkzeuge ? 'Dateien und Werkzeuge' : 'Dateien',
      text: `Entwürfe und Unterlagen von uns liegen hier, und du kannst Dateien für uns hochladen.${werkzeuge ? ' Unter „Werkzeuge“ findest du Helfer, die wir für dich freigeschaltet haben.' : ''}`,
    },
    {
      id: 'team',
      seite: 'start',
      ziel: 'team',
      titel: termine ? 'Dein Team und Termine' : 'Dein Team',
      text: `So erreichst du uns am schnellsten${daten.slack ? ' – am besten im Slack-Channel' : ''}.${termine ? ' Einen Termin buchst du direkt hier, ohne Mail-Pingpong.' : ''}`,
    },
    {
      id: 'benachrichtigungen',
      ziel: 'menue',
      titel: 'Benachrichtigungen',
      text: 'In deinem Menü wählst du, wie oft und wo du von uns hörst – per E-Mail oder Slack. Dort startest du auch diesen Rundgang jederzeit wieder.',
    },
  ];
  return schritte.filter((s): s is Schritt => !!s);
}

/** Days a new feature is shown on its own after its release. */
export const NEU_TAGE = 60;

/**
 * New features this contact has not seen yet, oldest first: released in the last NEU_TAGE days, after the tour
 * (which shows everything up to then), not marked as seen, and relevant for this client.
 */
export function offeneNeuerungen(liste: readonly Neuerung[], daten: Kundensicht, heute: string): Neuerung[] {
  const r = daten.rundgang;
  if (!r?.gesehen_am) return [];
  const grenze = new Date(`${heute}T12:00:00Z`);
  grenze.setUTCDate(grenze.getUTCDate() - NEU_TAGE);
  const ab = grenze.toISOString().slice(0, 10);
  return liste
    .filter((n) => n.datum > r.gesehen_am.slice(0, 10) && n.datum >= ab && n.datum <= heute && !r.neuerungen.includes(n.id) && (!n.bedingung || n.bedingung(daten)))
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

export function neuerungsSchritt(n: Neuerung): Schritt {
  return { id: n.id, titel: n.titel, text: n.text, ziel: n.ziel, seite: n.seite };
}

/** The tour to start on its own after loading, if any. Never in the team access and not without the server side. */
export function automatischeTour(daten: Kundensicht, liste: readonly Neuerung[], heute: string): Tour | null {
  if (daten.vorschau || !daten.rundgang) return null;
  if (!daten.rundgang.gesehen_am) return { art: 'rundgang', schritte: rundgangSchritte(daten) };
  const neu = offeneNeuerungen(liste, daten, heute).slice(-3);
  return neu.length ? { art: 'neu', schritte: neu.map(neuerungsSchritt), ids: neu.map((n) => n.id) } : null;
}
