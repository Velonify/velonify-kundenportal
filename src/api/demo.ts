import { ApiFehler, MAX_UPLOAD_BYTES, type AnfrageEingabe, type Kundensicht, type PortalApi, type PortalDatei, type PortalEinstellungen, type PortalKarte } from './vertrag';
import { zuGross } from './client';

/** Demo client for local work and previews without the function. Made-up company, dates relative to today. */

const tag = (versatz: number) => {
  const d = new Date();
  d.setDate(d.getDate() + versatz);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const zeit = (versatz: number, stunde: number) => `${tag(versatz)}T${String(stunde).padStart(2, '0')}:15:00.000Z`;
const warte = (ms = 350) => new Promise((r) => setTimeout(r, ms));

function startDaten(): Kundensicht {
  return {
    kunde: { name: 'Alpenglanz Kosmetik', kuerzel: 'ALP' },
    firmen: [
      { id: 'F-ALP', name: 'Alpenglanz Kosmetik' },
      { id: 'F-BRG', name: 'Bergquelle Naturkost' },
    ],
    slack: { channel: 'client-alp-general', url: 'https://slack.com/app_redirect?channel=client-alp-general' },
    ich: { vorname: 'Mara', nachname: 'Lindner', email: 'mara@alpenglanz.example' },
    team: ['Lukas', 'Julian'],
    fahrplan: [
      { titel: 'Migration', datum: tag(-40), status: 'erledigt' },
      { titel: 'Tracking', datum: tag(-12), status: 'erledigt' },
      { titel: 'Design & Inhalte', datum: tag(14), status: 'aktiv' },
      { titel: 'Black Week', datum: tag(30), status: 'offen' },
      { titel: 'Go-live', datum: tag(44), status: 'offen' },
    ],
    karten: [
      {
        id: 'k1', titel: 'Neuer Startseiten-Hero mit Herbstkollektion', phase: 'wartet', freigabe: 'offen', freigabe_am: zeit(-1, 9), anfrage: false,
        beschreibung: 'Bitte Bildauswahl und Headline prüfen. Julian hat zwei Headline-Varianten eingebaut.\n\nVorschau: https://alpenglanz.example/?preview=hero',
        zustaendig: ['Julian'], faellig_am: tag(1), erledigt_am: '',
        checkliste: [{ text: 'Bildauswahl', erledigt: true }, { text: 'Headline', erledigt: true }, { text: 'Mobil-Ansicht', erledigt: true }],
        kommentare: [{ von: 'Julian', team: true, ich: false, text: 'Entwurf ist fertig. Welche Headline gefällt dir besser?', datum: zeit(-1, 9) }],
      },
      {
        id: 'k2', titel: 'Kategorietexte „Gesichtspflege“', phase: 'wartet', freigabe: 'offen', freigabe_am: zeit(-1, 9), anfrage: false,
        beschreibung: 'Bitte inhaltlich gegenlesen, vor allem die Wirkversprechen.', zustaendig: ['Lukas'], faellig_am: tag(3), erledigt_am: '',
        checkliste: [], kommentare: [],
      },
      {
        id: 'k3', titel: 'Willkommens-Mails für neue Newsletter-Abonnenten', phase: 'arbeit', freigabe: '', anfrage: false,
        beschreibung: 'Drei Mails, mit Rabattcode in der ersten.', zustaendig: ['Lukas'], faellig_am: tag(9), freigabe_am: '', erledigt_am: '',
        checkliste: [{ text: 'Mail 1', erledigt: true }, { text: 'Mail 2', erledigt: false }, { text: 'Mail 3', erledigt: false }], kommentare: [],
      },
      {
        id: 'k4', titel: 'Gutscheincode HERBST15 greift nicht im Checkout', phase: 'arbeit', freigabe: '', anfrage: true,
        beschreibung: 'Bei Bestellungen unter 30 € kommt „Code ungültig“.', zustaendig: ['Julian'], faellig_am: tag(0), freigabe_am: '', erledigt_am: '', checkliste: [],
        kommentare: [
          { von: 'Mara Lindner', team: false, ich: true, text: 'Bei Bestellungen unter 30 € kommt „Code ungültig“.', datum: zeit(-2, 8) },
          { von: 'Julian', team: true, ich: false, text: 'Liegt an der Mindestbestellmenge, ich passe das heute an.', datum: zeit(-2, 11) },
        ],
      },
      {
        id: 'k5', titel: 'Produktfilter nach Hauttyp', phase: 'arbeit', freigabe: 'freigegeben', freigabe_am: zeit(-6, 10), anfrage: false,
        beschreibung: '', zustaendig: ['Julian'], faellig_am: tag(13), erledigt_am: '', checkliste: [],
        kommentare: [
          { von: 'Tobias Brandl', team: false, ich: false, text: 'Können wir „empfindlich“ als eigenen Filter haben?', datum: zeit(-7, 14) },
          { von: 'Julian', team: true, ich: false, text: 'Ja, kommt mit rein.', datum: zeit(-7, 15) },
        ],
      },
      { id: 'k6', titel: 'Black-Week-Landingpage', phase: 'geplant', freigabe: '', anfrage: false, beschreibung: '', zustaendig: ['Julian'], faellig_am: tag(23), freigabe_am: '', erledigt_am: '', checkliste: [], kommentare: [] },
      { id: 'k7', titel: 'Messung „Muster bestellt“ in Google Analytics', phase: 'geplant', freigabe: '', anfrage: false, beschreibung: '', zustaendig: ['Lukas'], faellig_am: '', freigabe_am: '', erledigt_am: '', checkliste: [], kommentare: [] },
      { id: 'k8', titel: 'Hinweis „noch X € bis zum Gratis-Versand“ im Warenkorb', phase: 'erledigt', freigabe: '', anfrage: false, beschreibung: '', zustaendig: ['Julian'], faellig_am: '', freigabe_am: '', erledigt_am: tag(-3), checkliste: [], kommentare: [] },
      { id: 'k9', titel: 'Meta-Pixel und Conversion API', phase: 'erledigt', freigabe: '', anfrage: false, beschreibung: '', zustaendig: ['Lukas'], faellig_am: '', freigabe_am: '', erledigt_am: tag(-8), checkliste: [], kommentare: [] },
      { id: 'k10', titel: 'Neues Produkt „Ringelblumen-Balsam“ angelegt', phase: 'erledigt', freigabe: '', anfrage: true, beschreibung: '', zustaendig: ['Julian'], faellig_am: '', freigabe_am: '', erledigt_am: tag(-11), checkliste: [], kommentare: [] },
    ],
    einstellungen: { updates: 'woechentlich', kanal_updates: 'email', kanal_hinweise: 'slack' },
    telefone: { Lukas: '+49 170 0000000', Julian: '+49 160 0000000' },
    news: [
      { id: 'n1', art: 'meilenstein', titel: 'Tracking ist komplett', text: 'Ab jetzt sehen wir, welche Kampagne welchen Umsatz bringt.', datum: tag(-1) },
      { id: 'n3', art: 'update', titel: 'Willkommen im Kundenportal', text: 'Schön, dass ihr da seid! Hier findet ihr ab jetzt alles zu unserem Projekt an einem Ort.\n\nUnter „Für dich zu tun“ landet, was eure Freigabe braucht. Im Projekt seht ihr, woran wir gerade arbeiten und was als Nächstes kommt. Dateien von uns und von euch liegen unter „Dateien“.\n\nNeue Wünsche schickt ihr über „Neue Anfrage“ oben rechts. Bei Fragen erreicht ihr uns jederzeit im Slack-Channel oder unter https://velonify.de/kontakt.', datum: tag(-12) },
      { id: 'n2', art: 'hinweis', titel: 'Shopify erhöht Gebühren für Drittanbieter-Zahlungen', text: 'Betrifft euch nicht, ihr nutzt Shopify Payments.', datum: tag(-9) },
    ],
    links: [
      { titel: 'Shopify-Admin', url: 'https://admin.shopify.com', beschreibung: 'Euer Shop-Backend', art: 'tool' },
      { titel: 'Google Analytics', url: 'https://analytics.google.com', beschreibung: 'Zahlen zu Besuchern und Umsatz', art: 'tool' },
      { titel: 'Brand-Guidelines', url: 'https://example.com/brand', beschreibung: 'Farben, Schriften, Ton', art: 'ressource' },
    ],
    werkzeuge: ['utm'],
    dateien: [
      { id: 'd1', name: 'Hero-Entwurf_Herbstkollektion_v02.pdf', mimeType: 'application/pdf', geaendert: zeit(-1, 9), von: 'velonify' },
      { id: 'd2', name: 'Kategorietexte_Gesichtspflege', mimeType: 'application/vnd.google-apps.document', geaendert: zeit(-2, 13), von: 'velonify' },
      { id: 'd3', name: 'Produktfotos_Herbst.zip', mimeType: 'application/zip', geaendert: zeit(-5, 16), von: 'kunde' },
      { id: 'd4', name: 'Tracking-Übersicht_Oktober.pdf', mimeType: 'application/pdf', geaendert: zeit(-6, 10), von: 'velonify' },
      { id: 'd5', name: 'Logo_Alpenglanz.svg', mimeType: 'image/svg+xml', geaendert: zeit(-25, 12), von: 'kunde' },
    ],
  };
}

export class DemoApi implements PortalApi {
  private stand = startDaten();
  private naechste = 100;

  private karte(id: string): PortalKarte {
    const k = this.stand.karten.find((x) => x.id === id);
    if (!k) throw new ApiFehler('Diese Aufgabe gibt es nicht (mehr).', 404);
    return k;
  }

  private ichKommentar(text: string) {
    const { vorname, nachname } = this.stand.ich;
    return { von: `${vorname} ${nachname}`, team: false, ich: true, text, datum: new Date().toISOString() };
  }

  async anmelden(email: string): Promise<void> {
    await warte();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new ApiFehler('Bitte gib eine gültige E-Mail-Adresse ein.', 400);
  }

  async einloesen(): Promise<{ sitzung: string; gueltig_bis: string }> {
    await warte();
    return { sitzung: 'demo', gueltig_bis: new Date(Date.now() + 30 * 864e5).toISOString() };
  }

  async daten(): Promise<Kundensicht> {
    await warte(250);
    return structuredClone(this.stand);
  }

  async datei(id: string): Promise<{ blob: Blob; name: string }> {
    await warte();
    const d = this.stand.dateien.find((x) => x.id === id);
    if (!d) throw new ApiFehler('Diese Datei gibt es nicht (mehr).', 404);
    return { blob: new Blob([`Demo-Datei ${d.name}`], { type: 'text/plain' }), name: `${d.name}.txt` };
  }

  async freigabe(karteId: string, entscheidung: 'freigegeben' | 'aenderung', notiz: string): Promise<PortalKarte> {
    await warte();
    const k = this.karte(karteId);
    if (k.freigabe !== 'offen') throw new ApiFehler('Diese Freigabe ist schon erledigt.', 409);
    if (entscheidung === 'aenderung' && !notiz.trim()) throw new ApiFehler('Bitte schreib kurz, was anders sein soll.', 400);
    k.freigabe = entscheidung;
    k.freigabe_am = new Date().toISOString();
    k.phase = 'arbeit';
    if (notiz.trim()) k.kommentare.push(this.ichKommentar(notiz.trim()));
    return structuredClone(k);
  }

  async kommentar(karteId: string, text: string): Promise<PortalKarte> {
    await warte();
    const k = this.karte(karteId);
    k.kommentare.push(this.ichKommentar(text.trim()));
    return structuredClone(k);
  }

  async anfrage(e: AnfrageEingabe): Promise<PortalKarte> {
    await warte();
    const anhaenge = this.stand.dateien.filter((d) => e.datei_ids.includes(d.id)).map((d) => `- ${d.name}`);
    const karte: PortalKarte = {
      id: `k${this.naechste++}`, titel: e.titel.trim(), phase: 'geplant', freigabe: '', anfrage: true,
      beschreibung: [e.details.trim(), anhaenge.length ? `Anhänge:\n${anhaenge.join('\n')}` : ''].filter(Boolean).join('\n\n'),
      zustaendig: [...this.stand.team], faellig_am: '', freigabe_am: '', erledigt_am: '', checkliste: [], kommentare: [],
    };
    this.stand.karten.push(karte);
    return structuredClone(karte);
  }

  async einstellungen(e: PortalEinstellungen): Promise<PortalEinstellungen> {
    await warte();
    this.stand.einstellungen = { ...e };
    return { ...e };
  }

  async wechseln(firmaId: string): Promise<{ sitzung: string; gueltig_bis: string }> {
    await warte();
    const ziel = this.stand.firmen?.find((f) => f.id === firmaId);
    if (!ziel) throw new ApiFehler('Für diesen Kunden hast du keinen Zugang (mehr).', 403);
    // The demo has one data set; switching only changes the name.
    this.stand.kunde = { name: ziel.name, kuerzel: ziel.id };
    return { sitzung: 'demo', gueltig_bis: new Date(Date.now() + 30 * 864e5).toISOString() };
  }

  async hochladen(datei: File, fortschritt?: (anteil: number) => void): Promise<PortalDatei> {
    if (datei.size > MAX_UPLOAD_BYTES) throw new ApiFehler(zuGross(datei.name), 413);
    for (let i = 1; i <= 5; i++) {
      await warte(160);
      fortschritt?.(i / 5);
    }
    const neu: PortalDatei = { id: `d${this.naechste++}`, name: datei.name, mimeType: datei.type, geaendert: new Date().toISOString(), von: 'kunde' };
    this.stand.dateien.unshift(neu);
    return neu;
  }
}
