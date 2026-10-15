import { useCallback, useEffect, useMemo, useState } from 'react';
import { HttpApi } from './api/client';
import { DemoApi } from './api/demo';
import { ApiFehler, type Kundensicht, type PortalApi } from './api/vertrag';
import { Icon } from './components/Icon';
import { Shell } from './Shell';
import { PortalBereich } from './portal';
import { Login } from './seiten/Login';
import { API_URL, DEMO } from './konfig';
import { geheZu, useRoute } from './lib/route';
import { holeSitzung, speichereSitzung } from './lib/sitzung';

type Zustand =
  | { art: 'login'; hinweis?: string }
  | { art: 'einloesen' }
  | { art: 'laden' }
  | { art: 'fehler'; text: string }
  | { art: 'bereit'; daten: Kundensicht };

export function App() {
  const route = useRoute();
  const [sitzung, setSitzung] = useState(() => holeSitzung());
  const api: PortalApi = useMemo(() => (DEMO ? new DemoApi() : new HttpApi(API_URL, () => holeSitzung(), speichereSitzung)), []);
  const [zustand, setZustand] = useState<Zustand>(() => (route.seite === 'anmelden' ? { art: 'einloesen' } : sitzung || route.seite === 'vorschau' ? { art: 'laden' } : { art: 'login' }));

  // Team preview from the hub ("Als Kunde ansehen"): the session comes in the address and replaces any other.
  const vorschauToken = route.seite === 'vorschau' ? route.token : null;
  useEffect(() => {
    if (!vorschauToken) return;
    const s = { sitzung: vorschauToken, gueltig_bis: new Date(Date.now() + 8 * 3_600_000).toISOString() };
    speichereSitzung(s);
    setSitzung(s.sitzung);
    geheZu({ seite: 'start' }, true);
  }, [vorschauToken]);

  const abmelden = useCallback((hinweis?: string) => {
    speichereSitzung(null);
    setSitzung(null);
    setZustand({ art: 'login', hinweis });
    geheZu({ seite: 'start' }, true);
  }, []);

  const laden = useCallback(async () => {
    setZustand({ art: 'laden' });
    try {
      setZustand({ art: 'bereit', daten: await api.daten() });
    } catch (err) {
      if (err instanceof ApiFehler && err.status === 401) return abmelden(err.message);
      setZustand({ art: 'fehler', text: err instanceof Error ? err.message : 'Das Portal konnte nicht geladen werden.' });
    }
  }, [api, abmelden]);

  // The link from the login mail: trade it for a session, then drop the token from the address bar.
  const token = route.seite === 'anmelden' ? route.token : null;
  useEffect(() => {
    if (!token) return;
    let aktiv = true;
    setZustand({ art: 'einloesen' });
    api
      .einloesen(token)
      .then((s) => {
        if (!aktiv) return;
        speichereSitzung(s);
        setSitzung(s.sitzung);
        geheZu({ seite: 'start' }, true);
      })
      .catch((err) => {
        if (!aktiv) return;
        geheZu({ seite: 'start' }, true);
        // A second click on an old link while still logged in is no problem.
        if (holeSitzung()) return void laden();
        setZustand({ art: 'login', hinweis: err instanceof Error ? err.message : undefined });
      });
    return () => {
      aktiv = false;
    };
  }, [token, api, laden]);

  useEffect(() => {
    if (sitzung && !token && !vorschauToken) void laden();
  }, [sitzung, token, vorschauToken, laden]);

  useEffect(() => {
    document.title = zustand.art === 'bereit' ? `${zustand.daten.vorschau ? 'Vorschau: ' : ''}${zustand.daten.kunde.name} · Velonify` : 'Velonify Kundenportal';
  }, [zustand]);

  if (zustand.art === 'login') {
    return (
      <Login
        api={api}
        hinweis={zustand.hinweis}
        demoAnmelden={
          DEMO
            ? () => {
                speichereSitzung({ sitzung: 'demo', gueltig_bis: new Date(Date.now() + 30 * 864e5).toISOString() });
                setSitzung('demo');
              }
            : undefined
        }
      />
    );
  }
  if (zustand.art === 'bereit') {
    return (
      <PortalBereich api={api} demo={DEMO} start={zustand.daten} onAbmelden={abmelden}>
        <Shell route={route} />
      </PortalBereich>
    );
  }
  if (zustand.art === 'fehler') {
    return (
      <div className="mitte">
        <div className="box">
          <Icon name="warn" />
          <h1 style={{ fontSize: 20 }}>Das hat gerade nicht geklappt</h1>
          <p className="muted">{zustand.text}</p>
          <button className="btn" type="button" onClick={() => void laden()}>
            Noch einmal versuchen
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="mitte" aria-busy="true">
      <div className="box">
        <span className="btn leise" aria-hidden="true">
          <span className="lade" />
        </span>
        <p className="muted">{zustand.art === 'einloesen' ? 'Du wirst angemeldet …' : 'Dein Projekt wird geladen …'}</p>
      </div>
    </div>
  );
}
