import { ApiFehler, MAX_UPLOAD_BYTES, type AnfrageEingabe, type FeedbackEingabe, type Kundensicht, type PortalApi, type PortalBericht, type PortalDatei, type PortalEinstellungen, type PortalKarte, type PortalRundgang } from './vertrag';
import { speicher } from '../lib/speicher';
import { zuGross } from './client';

/** Demo client for local work and previews without the function. Made-up company, dates relative to today. */

const tag = (versatz: number) => {
  const d = new Date();
  d.setDate(d.getDate() + versatz);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const zeit = (versatz: number, stunde: number) => `${tag(versatz)}T${String(stunde).padStart(2, '0')}:15:00.000Z`;
const warte = (ms = 350) => new Promise((r) => setTimeout(r, ms));

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/** Two released reports: last month and the one before. */
function demoBerichte(): PortalBericht[] {
  const heute = new Date();
  return [1, 2].map((zurueck, i) => {
    const anfang = new Date(heute.getFullYear(), heute.getMonth() - zurueck, 1);
    const tage = new Date(anfang.getFullYear(), anfang.getMonth() + 1, 0).getDate();
    const m = `${anfang.getFullYear()}-${String(anfang.getMonth() + 1).padStart(2, '0')}`;
    const vorher = new Date(anfang.getFullYear(), anfang.getMonth() - 1, 1);
    const vm = `${vorher.getFullYear()}-${String(vorher.getMonth() + 1).padStart(2, '0')}`;
    const vorherTage = new Date(vorher.getFullYear(), vorher.getMonth() + 1, 0).getDate();
    const zeitraum = { von: `${m}-01`, bis: `${m}-${tage}`, vorher_von: `${vm}-01`, vorher_bis: `${vm}-${vorherTage}` };
    const f = i === 0 ? 1 : 0.9;
    const welle = (t: number) => 1 + 0.22 * Math.sin(t / 2.3) + t / 120;
    const tagVon = (t: number) => `${m}-${String(t + 1).padStart(2, '0')}`;
    return {
      monat: m,
      titel: `${MONATE[anfang.getMonth()]} ${anfang.getFullYear()}`,
      status: 'freigegeben',
      kommentar:
        i === 0
          ? 'Starker Monat: Der Umsatz liegt 15 % über dem Vormonat, vor allem durch die neuen Produktseiten und die organische Suche. Mobil ist der Shop noch zu langsam – das gehen wir im nächsten Monat vor der Black Week an.\n\nUnsere Empfehlung: Winterkollektion früh im Newsletter anteasern.'
          : 'Solider Monat. Die Migration ist abgeschlossen, Tracking läuft sauber auf GA4.',
      von: 'Lukas',
      freigegeben_am: `${tag(-heute.getDate() + 3 - 30 * i)}T09:00:00.000Z`,
      daten: {
        zahlen: {
          ga4: {
            nutzer: Math.round(9840 * f), sitzungen: Math.round(13120 * f), umsatz: Math.round(48210 * f), transaktionen: Math.round(312 * f), conversion_rate: 312 / 13120,
            vorher: { nutzer: Math.round(8910 * f), sitzungen: Math.round(12030 * f), umsatz: Math.round(41980 * f), transaktionen: Math.round(268 * f), conversion_rate: 268 / 12030 },
            zeitraum, waehrung: 'EUR',
            kanaele: [
              { name: 'Organic Search', sitzungen: 4980, umsatz: 17400 },
              { name: 'Paid Social', sitzungen: 3120, umsatz: 11900 },
              { name: 'Direct', sitzungen: 2210, umsatz: 9800 },
              { name: 'Email', sitzungen: 1490, umsatz: 6700 },
            ],
            verlauf: Array.from({ length: tage }, (_, t) => ({ tag: tagVon(t), sitzungen: Math.round(420 * f * welle(t)), umsatz: 0 })),
          },
          gsc: {
            klicks: Math.round(5210 * f), impressionen: Math.round(184300 * f), ctr: 5210 / 184300, position: 14.2,
            vorher: { klicks: Math.round(4620 * f), impressionen: Math.round(171900 * f), ctr: 4620 / 171900, position: 15.8 },
            zeitraum,
            suchanfragen: [
              { suchanfrage: 'naturkosmetik gesichtspflege', klicks: 410, impressionen: 9800, position: 3.4 },
              { suchanfrage: 'alpenglanz', klicks: 380, impressionen: 1200, position: 1.1 },
            ],
            seiten: [],
            verlauf: Array.from({ length: tage }, (_, t) => ({ tag: tagVon(t), klicks: Math.round(165 * f * welle(t)), impressionen: 5900 })),
          },
          pagespeed: {
            url: 'https://alpenglanz.example/',
            mobil: { score: 58, lcp_ms: 3400, cls: 0.04, inp_ms: 240, quelle: 'feld' },
            desktop: { score: 92, lcp_ms: 1300, cls: 0.02, inp_ms: 90, quelle: 'feld' },
          },
        },
        erledigt: i === 0
          ? [
              { titel: 'Neues Produkt „Ringelblumen-Balsam“ angelegt', datum: `${m}-06` },
              { titel: 'Meta-Pixel und Conversion API', datum: `${m}-14` },
              { titel: 'Hinweis „noch X € bis zum Gratis-Versand“ im Warenkorb', datum: `${m}-27` },
            ]
          : [{ titel: 'Daten aus dem alten Shop übernommen', datum: `${m}-12` }],
        meilensteine: i === 0 ? [{ titel: 'Tracking', datum: `${m}-20` }] : [{ titel: 'Migration', datum: `${m}-25` }],
        naechstes: [
          { titel: 'Design & Inhalte', art: 'meilenstein', datum: tag(17) },
          { titel: 'Black-Week-Landingpage', art: 'karte', datum: tag(23) },
          { titel: 'Filter „Hauttyp“ auf den Kategorieseiten', art: 'karte', datum: '' },
        ],
        stand_am: `${tag(-heute.getDate() + 2)}T06:00:00.000Z`,
      },
    };
  });
}

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
    zahlen: {
      stand_am: zeit(0, 6),
      sichtbar_kunde: true,
      daten: {
        ga4: {
          nutzer: 8420, sitzungen: 11230, umsatz: 48210, transaktionen: 312, conversion_rate: 312 / 11230,
          vorher: { nutzer: 7910, sitzungen: 10480, umsatz: 41870, transaktionen: 268, conversion_rate: 268 / 10480 },
          zeitraum: { von: tag(-28), bis: tag(-1), vorher_von: tag(-56), vorher_bis: tag(-29) },
          waehrung: 'EUR',
          kanaele: [
            { name: 'Organic Search', sitzungen: 4310, umsatz: 17920 },
            { name: 'Paid Social', sitzungen: 2980, umsatz: 12640 },
            { name: 'Direct', sitzungen: 1870, umsatz: 9310 },
            { name: 'Email', sitzungen: 1120, umsatz: 6150 },
            { name: 'Referral', sitzungen: 950, umsatz: 2190 },
          ],
          verlauf: Array.from({ length: 28 }, (_, i) => ({ tag: tag(i - 28), sitzungen: Math.round(330 + 90 * Math.sin(i / 3) + i * 4), umsatz: 0 })),
        },
        gsc: {
          klicks: 3120, impressionen: 96400, ctr: 3120 / 96400, position: 14.2,
          vorher: { klicks: 2870, impressionen: 91200, ctr: 2870 / 91200, position: 15.1 },
          zeitraum: { von: tag(-30), bis: tag(-3), vorher_von: tag(-58), vorher_bis: tag(-31) },
          suchanfragen: [
            { suchanfrage: 'naturkosmetik gesichtspflege', klicks: 410, impressionen: 8800, position: 4.1 },
            { suchanfrage: 'alpenglanz', klicks: 380, impressionen: 1200, position: 1.2 },
            { suchanfrage: 'ringelblumen balsam', klicks: 190, impressionen: 3400, position: 6.8 },
          ],
          seiten: [],
          verlauf: Array.from({ length: 28 }, (_, i) => ({ tag: tag(i - 30), klicks: Math.round(95 + 25 * Math.cos(i / 2.5) + i), impressionen: 3400 })),
        },
        pagespeed: {
          url: 'https://alpenglanz.example/',
          mobil: { score: 58, lcp_ms: 3400, cls: 0.04, inp_ms: 240, quelle: 'feld' },
          desktop: { score: 92, lcp_ms: 1300, cls: 0.02, inp_ms: 90, quelle: 'feld' },
        },
      },
    },
    berichte: demoBerichte(),
    feedback: { gegeben: [], offen: [{ anlass: 'meilenstein', bezug_id: 'KM-TRACKING', titel: 'Tracking' }], bewertung_url: 'https://example.com/google-bewertung' },
    einstellungen: { updates: 'woechentlich', kanal_updates: 'email', kanal_hinweise: 'slack' },
    rundgang: demoRundgang(),
    telefone: { Lukas: '+49 170 0000000', Julian: '+49 160 0000000' },
    termine: { Lukas: 'https://example.com/termin-buchen' },
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

/** The demo keeps the tour state in this browser, so it behaves like the server across reloads. */
const RUNDGANG_KEY = 'velonify-portal.demo-rundgang';

function demoRundgang(): PortalRundgang {
  try {
    const r = JSON.parse(speicher.lies(RUNDGANG_KEY) ?? '') as PortalRundgang;
    if (typeof r.gesehen_am === 'string' && Array.isArray(r.neuerungen)) return r;
  } catch {
    // nothing stored yet
  }
  return { gesehen_am: '', neuerungen: [] };
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

  async feedback(e: FeedbackEingabe): Promise<{ ok: true }> {
    await warte();
    const fb = this.stand.feedback ?? { gegeben: [], offen: [], bewertung_url: '' };
    if (e.anlass !== 'frei') {
      const schluessel = `${e.anlass}:${e.bezug_id}`;
      if (fb.gegeben.includes(schluessel)) throw new ApiFehler('Dazu hast du schon eine Bewertung abgegeben. Danke!', 409);
      this.stand.feedback = { ...fb, gegeben: [...fb.gegeben, schluessel], offen: fb.offen.filter((o) => `${o.anlass}:${o.bezug_id}` !== schluessel) };
    }
    return { ok: true };
  }

  async gesehen(e: { rundgang?: true; neuerungen?: string[] }): Promise<{ gespeichert: boolean; rundgang: PortalRundgang }> {
    await warte(150);
    const r = this.stand.rundgang ?? { gesehen_am: '', neuerungen: [] };
    const neu = { gesehen_am: e.rundgang ? new Date().toISOString() : r.gesehen_am, neuerungen: [...new Set([...r.neuerungen, ...(e.neuerungen ?? [])])] };
    this.stand.rundgang = neu;
    speicher.schreib(RUNDGANG_KEY, JSON.stringify(neu));
    return { gespeichert: true, rundgang: structuredClone(neu) };
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
