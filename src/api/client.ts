import { ApiFehler, MAX_UPLOAD_BYTES, type AnfrageEingabe, type Kundensicht, type PortalApi, type PortalDatei, type PortalKarte, type Sitzung } from './vertrag';

const VERBINDUNG = 'Wir erreichen den Server gerade nicht. Prüf deine Verbindung oder versuch es in ein paar Minuten noch einmal.';

/** The real API: the Cloud Function behind `VITE_PORTAL_API_URL`, with the session as Bearer token. */
export class HttpApi implements PortalApi {
  constructor(
    private readonly basis: string,
    private readonly sitzung: () => string | null,
    /** The function slides the session on use and sends the new one in X-Sitzung / X-Sitzung-Bis. */
    private readonly neueSitzung: (s: Sitzung) => void = () => {},
  ) {}

  private kopf(extra: Record<string, string> = {}): Record<string, string> {
    const token = this.sitzung();
    return token ? { Authorization: `Bearer ${token}`, ...extra } : extra;
  }

  private async antwort<T>(res: Response): Promise<T> {
    const text = await res.text();
    let daten: unknown = null;
    try {
      daten = text ? JSON.parse(text) : null;
    } catch {
      // not JSON, e.g. an error page of the proxy
    }
    if (!res.ok) {
      const fehler = (daten as { fehler?: string } | null)?.fehler;
      throw new ApiFehler(fehler || 'Da ist etwas schiefgelaufen. Bitte versuch es gleich noch einmal.', res.status);
    }
    return daten as T;
  }

  private async rufe<T>(pfad: string, init: RequestInit = {}): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.basis}${pfad}`, { ...init, headers: { ...this.kopf(), ...(init.headers as Record<string, string>) } });
    } catch {
      throw new ApiFehler(VERBINDUNG, 0);
    }
    const neu = res.headers.get('x-sitzung');
    const bis = res.headers.get('x-sitzung-bis');
    if (res.ok && neu && bis) this.neueSitzung({ sitzung: neu, gueltig_bis: bis });
    return this.antwort<T>(res);
  }

  private post<T>(pfad: string, body: unknown): Promise<T> {
    return this.rufe<T>(pfad, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }

  async anmelden(email: string): Promise<void> {
    await this.post('/anmelden', { email });
  }

  einloesen(token: string): Promise<Sitzung> {
    return this.post<Sitzung>('/einloesen', { token });
  }

  daten(): Promise<Kundensicht> {
    return this.rufe<Kundensicht>('/daten');
  }

  async datei(id: string): Promise<{ blob: Blob; name: string }> {
    let res: Response;
    try {
      res = await fetch(`${this.basis}/datei/${encodeURIComponent(id)}`, { headers: this.kopf() });
    } catch {
      throw new ApiFehler(VERBINDUNG, 0);
    }
    if (!res.ok) await this.antwort(res);
    const kopf = res.headers.get('content-disposition') ?? '';
    const name = /filename\*=UTF-8''([^;]+)/i.exec(kopf)?.[1];
    return { blob: await res.blob(), name: name ? decodeURIComponent(name) : 'Datei' };
  }

  freigabe(karteId: string, entscheidung: 'freigegeben' | 'aenderung', notiz: string): Promise<PortalKarte> {
    return this.post<PortalKarte>('/freigabe', { karte_id: karteId, entscheidung, notiz });
  }

  kommentar(karteId: string, text: string): Promise<PortalKarte> {
    return this.post<PortalKarte>('/kommentar', { karte_id: karteId, text });
  }

  anfrage(eingabe: AnfrageEingabe): Promise<PortalKarte> {
    return this.post<PortalKarte>('/anfrage', eingabe);
  }

  wechseln(firmaId: string): Promise<Sitzung> {
    return this.post<Sitzung>('/wechseln', { firma_id: firmaId });
  }

  /** XHR instead of fetch, because only XHR reports upload progress. */
  hochladen(datei: File, fortschritt?: (anteil: number) => void): Promise<PortalDatei> {
    if (datei.size > MAX_UPLOAD_BYTES) return Promise.reject(new ApiFehler(zuGross(datei.name), 413));
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.basis}/hochladen`);
      for (const [k, v] of Object.entries(this.kopf({
        // Always octet-stream: the functions framework would parse e.g. a .json upload as JSON. The real type goes in X-Dateityp.
        'Content-Type': 'application/octet-stream',
        'X-Dateiname': encodeURIComponent(datei.name),
        ...(datei.type ? { 'X-Dateityp': datei.type } : {}),
      }))) {
        xhr.setRequestHeader(k, v);
      }
      xhr.upload.onprogress = (e) => e.lengthComputable && fortschritt?.(e.loaded / e.total);
      xhr.onerror = () => reject(new ApiFehler(VERBINDUNG, 0));
      xhr.onload = () => {
        let daten: { fehler?: string } | null = null;
        try {
          daten = JSON.parse(xhr.responseText);
        } catch {
          // keep null
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(daten as unknown as PortalDatei);
        else reject(new ApiFehler(daten?.fehler || 'Das Hochladen hat nicht geklappt. Bitte versuch es noch einmal.', xhr.status));
      };
      xhr.send(datei);
    });
  }
}

export const zuGross = (name: string) =>
  `„${name}“ ist größer als 25 MB. Schick uns große Dateien bitte als Link (z. B. WeTransfer oder Google Drive) über eine Anfrage.`;
