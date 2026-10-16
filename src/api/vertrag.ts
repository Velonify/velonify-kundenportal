/**
 * The API of the portal function `kundenportal` (repo Velonify/velonify-crm, `src/data/portalApi.ts` and
 * `functions/kundenportal`). Copied here on purpose, because the portal is its own repo: change both sides together.
 */

export type MeilensteinStatus = 'offen' | 'aktiv' | 'erledigt';
export type FreigabeStatus = 'offen' | 'freigegeben' | 'aenderung';
export type PortalPhase = 'wartet' | 'arbeit' | 'geplant' | 'erledigt';

export interface PortalKommentar {
  von: string;
  /** Written by Velonify (true) or by someone of the client (false). */
  team: boolean;
  /** Written by the person who is logged in. */
  ich: boolean;
  text: string;
  /** ISO timestamp or YYYY-MM-DD */
  datum: string;
}

export interface PortalKarte {
  id: string;
  titel: string;
  beschreibung: string;
  phase: PortalPhase;
  zustaendig: string[];
  /** YYYY-MM-DD or empty */
  faellig_am: string;
  /** YYYY-MM-DD, done cards only */
  erledigt_am: string;
  checkliste: { text: string; erledigt: boolean }[];
  freigabe: FreigabeStatus | '';
  /** ISO time the approval was asked for or answered; empty without approval. */
  freigabe_am: string;
  /** Came in as a request of the client. */
  anfrage: boolean;
  kommentare: PortalKommentar[];
}

export interface PortalDatei {
  id: string;
  name: string;
  mimeType: string;
  /** ISO timestamp */
  geaendert: string;
  /** Shared by Velonify (07_Client-Share) or uploaded by the client (07_Client-Share/Vom Kunden). */
  von: 'velonify' | 'kunde';
}

export interface Kundensicht {
  kunde: { name: string; kuerzel: string };
  /** The client's Slack channel; the preferred way to reach the team. Null (or missing on an older function) without one. */
  slack?: { channel: string; url: string } | null;
  ich: { vorname: string; nachname: string; email: string };
  /** Set when a Velonify team member looks at the portal from the hub (read only): their e-mail. */
  vorschau?: string | null;
  /** All clients this person may open (same e-mail, a login at each), the current one included. */
  firmen?: { id: string; name: string }[];
  team: string[];
  /** Phone numbers of the team members in `team` (name → number); older backends send none. */
  telefone?: Record<string, string>;
  fahrplan: { titel: string; datum: string; status: MeilensteinStatus }[];
  karten: PortalKarte[];
  /** `art`: update | meilenstein | hinweis; `datum` YYYY-MM-DD */
  news: { id: string; art: string; titel: string; text: string; datum: string }[];
  /** `art`: tool | ressource */
  links: { titel: string; url: string; beschreibung: string; art: string }[];
  werkzeuge: string[];
  dateien: PortalDatei[];
}

export interface Sitzung {
  sitzung: string;
  gueltig_bis: string;
}

export interface AnfrageEingabe {
  titel: string;
  details: string;
  dringend: boolean;
  datei_ids: string[];
}

/** Everything the portal needs from the server; implemented by the real API and by the demo. */
export interface PortalApi {
  anmelden(email: string): Promise<void>;
  einloesen(token: string): Promise<Sitzung>;
  daten(): Promise<Kundensicht>;
  /** The file as a blob plus the name the server gave it (Google Docs come as PDF). */
  datei(id: string): Promise<{ blob: Blob; name: string }>;
  freigabe(karteId: string, entscheidung: 'freigegeben' | 'aenderung', notiz: string): Promise<PortalKarte>;
  kommentar(karteId: string, text: string): Promise<PortalKarte>;
  anfrage(eingabe: AnfrageEingabe): Promise<PortalKarte>;
  hochladen(datei: File, fortschritt?: (anteil: number) => void): Promise<PortalDatei>;
  /** A session for another client of the same person. */
  wechseln(firmaId: string): Promise<Sitzung>;
}

/** Answer of the API with a message for the user (German, du). `status` 401 means: log in again. */
export class ApiFehler extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Upload limit of the function (Cloud Functions take at most 32 MB per request). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
