import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiFehler, type Kundensicht, type PortalApi, type PortalDatei, type PortalKarte, type Sitzung } from './api/vertrag';
import { useToast } from './components/Toast';
import { letzterBesuch } from './lib/zuletzt';

/** Seconds a one-click approval waits before it is sent, so "Rückgängig" can still catch it. */
const RUECKGAENGIG_MS = 5000;

export interface GeradeErledigt {
  id: string;
  titel: string;
  entscheidung: 'freigegeben' | 'aenderung';
  /** true while the undo window is open */
  wartet: boolean;
}

interface PortalWert {
  api: PortalApi;
  demo: boolean;
  /** Team preview from the hub: everything that changes something is hidden. */
  nurLesen: boolean;
  daten: Kundensicht;
  /** ISO time of the previous visit in this browser ('' on the first). */
  neuSeit: string;
  aktualisiert: boolean;
  ersetzeKarte: (k: PortalKarte) => void;
  fuegeDateiHinzu: (d: PortalDatei) => void;
  neuLaden: () => Promise<void>;
  abmelden: () => void;
  /** Approve with one click; sent after a short undo window. */
  freigeben: (k: PortalKarte) => void;
  rueckgaengig: (id: string) => void;
  /** Called after an approval or change request went out from the card sheet. */
  merkeErledigt: (k: PortalKarte, entscheidung: 'freigegeben' | 'aenderung') => void;
  gerade: GeradeErledigt[];
  karteOffen: { id: string; aendern?: boolean } | null;
  oeffneKarte: (id: string, aendern?: boolean) => void;
  schliesseKarte: () => void;
  anfrageOffen: boolean;
  setAnfrageOffen: (offen: boolean) => void;
  herunterladen: (d: PortalDatei) => Promise<void>;
  /** Opens another client of the same person (switcher). */
  wechseln: (firmaId: string) => Promise<void>;
  /** Shows the error, and logs out on an expired session. */
  fehler: (err: unknown) => void;
}

const Kontext = createContext<PortalWert | null>(null);

export function usePortal(): PortalWert {
  const wert = useContext(Kontext);
  if (!wert) throw new Error('usePortal outside PortalBereich');
  return wert;
}

export function PortalBereich(props: { api: PortalApi; demo: boolean; start: Kundensicht; onAbmelden: (grund?: string) => void; onWechsel: (s: Sitzung) => void; children: ReactNode }) {
  const { api, onAbmelden, onWechsel } = props;
  const toast = useToast();
  const [daten, setDaten] = useState(props.start);
  const [neuSeit] = useState(() => letzterBesuch(props.start.kunde.kuerzel || props.start.kunde.name));
  const [gerade, setGerade] = useState<GeradeErledigt[]>([]);
  const [karteOffen, setKarteOffen] = useState<{ id: string; aendern?: boolean } | null>(null);
  const [anfrageOffen, setAnfrageOffen] = useState(false);
  const [aktualisiert, setAktualisiert] = useState(false);
  const timer = useRef(new Map<string, { t: ReturnType<typeof setTimeout>; senden: () => void }>());

  const fehler = useCallback(
    (err: unknown) => {
      if (err instanceof ApiFehler && err.status === 401) return onAbmelden(err.message);
      toast({ text: err instanceof Error ? err.message : 'Da ist etwas schiefgelaufen.', fehler: true });
    },
    [onAbmelden, toast],
  );

  const ersetzeKarte = useCallback((k: PortalKarte) => {
    setDaten((d) => ({ ...d, karten: d.karten.some((x) => x.id === k.id) ? d.karten.map((x) => (x.id === k.id ? k : x)) : [...d.karten, k] }));
  }, []);

  const fuegeDateiHinzu = useCallback((datei: PortalDatei) => {
    setDaten((d) => ({ ...d, dateien: [datei, ...d.dateien.filter((x) => x.id !== datei.id)] }));
  }, []);

  const neuLaden = useCallback(async () => {
    try {
      const neu = await api.daten();
      setDaten(neu);
      setAktualisiert(true);
    } catch (err) {
      if (err instanceof ApiFehler && err.status === 401) onAbmelden(err.message);
      // otherwise keep showing what we have; the next refresh tries again
    }
  }, [api, onAbmelden]);

  // Fresh data when the tab comes back into view (the team may have answered meanwhile), at most once a minute.
  useEffect(() => {
    let zuletzt = Date.now();
    const sichtbar = () => {
      if (document.visibilityState === 'visible' && Date.now() - zuletzt > 60_000) {
        zuletzt = Date.now();
        void neuLaden();
      }
    };
    document.addEventListener('visibilitychange', sichtbar);
    return () => document.removeEventListener('visibilitychange', sichtbar);
  }, [neuLaden]);

  const sende = useCallback(
    async (k: PortalKarte) => {
      timer.current.delete(k.id);
      setGerade((g) => g.map((x) => (x.id === k.id ? { ...x, wartet: false } : x)));
      try {
        ersetzeKarte(await api.freigabe(k.id, 'freigegeben', ''));
      } catch (err) {
        setGerade((g) => g.filter((x) => x.id !== k.id));
        fehler(err);
      }
    },
    [api, ersetzeKarte, fehler],
  );

  const freigeben = useCallback(
    (k: PortalKarte) => {
      if (timer.current.has(k.id)) return;
      setGerade((g) => [...g.filter((x) => x.id !== k.id), { id: k.id, titel: k.titel, entscheidung: 'freigegeben', wartet: true }]);
      const senden = () => void sende(k);
      timer.current.set(k.id, { t: setTimeout(senden, RUECKGAENGIG_MS), senden });
    },
    [sende],
  );

  const rueckgaengig = useCallback((id: string) => {
    const eintrag = timer.current.get(id);
    if (!eintrag) return;
    clearTimeout(eintrag.t);
    timer.current.delete(id);
    setGerade((g) => g.filter((x) => x.id !== id));
  }, []);

  const merkeErledigt = useCallback((k: PortalKarte, entscheidung: 'freigegeben' | 'aenderung') => {
    setGerade((g) => [...g.filter((x) => x.id !== k.id), { id: k.id, titel: k.titel, entscheidung, wartet: false }]);
  }, []);

  // Leaving the page must not lose an approval that is still in its undo window.
  useEffect(() => {
    const alleSenden = () => {
      for (const { t, senden } of timer.current.values()) {
        clearTimeout(t);
        senden();
      }
    };
    window.addEventListener('pagehide', alleSenden);
    return () => {
      window.removeEventListener('pagehide', alleSenden);
      alleSenden();
    };
  }, []);

  const herunterladen = useCallback(
    async (d: PortalDatei) => {
      try {
        const { blob, name } = await api.datei(d.id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.append(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (err) {
        fehler(err);
      }
    },
    [api, fehler],
  );

  const wechseln = useCallback(
    async (firmaId: string) => {
      try {
        onWechsel(await api.wechseln(firmaId));
      } catch (err) {
        fehler(err);
      }
    },
    [api, onWechsel, fehler],
  );

  const wert = useMemo<PortalWert>(
    () => ({
      api,
      demo: props.demo,
      nurLesen: !!daten.vorschau,
      daten,
      neuSeit,
      aktualisiert,
      ersetzeKarte,
      fuegeDateiHinzu,
      neuLaden,
      abmelden: () => onAbmelden(),
      freigeben,
      rueckgaengig,
      merkeErledigt,
      gerade,
      karteOffen,
      oeffneKarte: (id, aendern) => setKarteOffen({ id, aendern }),
      schliesseKarte: () => setKarteOffen(null),
      anfrageOffen,
      setAnfrageOffen,
      herunterladen,
      wechseln,
      fehler,
    }),
    [api, props.demo, daten, neuSeit, aktualisiert, ersetzeKarte, fuegeDateiHinzu, neuLaden, onAbmelden, freigeben, rueckgaengig, merkeErledigt, gerade, karteOffen, anfrageOffen, herunterladen, wechseln, fehler],
  );

  return <Kontext.Provider value={wert}>{props.children}</Kontext.Provider>;
}
