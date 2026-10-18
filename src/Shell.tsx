import { useEffect, useRef, useState } from 'react';
import { Icon, Logo, type IconName } from './components/Icon';
import { KarteBlatt } from './seiten/KarteBlatt';
import { AnfrageBlatt } from './seiten/AnfrageBlatt';
import { TerminBlatt } from './seiten/TerminBlatt';
import { FeedbackBlatt } from './seiten/Feedback';
import { Start } from './seiten/Start';
import { Projekt } from './seiten/Projekt';
import { Dateien } from './seiten/Dateien';
import { Werkzeuge } from './seiten/Werkzeuge';
import { Einstellungen } from './seiten/Einstellungen';
import { Zahlen } from './seiten/Zahlen';
import { Bericht } from './seiten/Bericht';
import { Neu } from './seiten/Neu';
import { Rundgang } from './components/Rundgang';
import { Utm } from './seiten/Utm';
import { usePortal } from './portal';
import { initialen, wartendeKarten } from './lib/ansicht';
import { geheZu, pfadVon, type Route } from './lib/route';
import { KONTAKT, RECHTLICHES } from './konfig';

const TABS: { seite: 'start' | 'projekt' | 'zahlen' | 'dateien' | 'werkzeuge'; titel: string; icon: IconName }[] = [
  { seite: 'start', titel: 'Start', icon: 'home' },
  { seite: 'projekt', titel: 'Projekt', icon: 'projekt' },
  { seite: 'zahlen', titel: 'Zahlen', icon: 'kurve' },
  { seite: 'dateien', titel: 'Dateien', icon: 'datei' },
  { seite: 'werkzeuge', titel: 'Werkzeuge', icon: 'tool' },
];

export function Shell({ route }: { route: Route }) {
  const p = usePortal();
  const { daten } = p;
  const offen = wartendeKarten(daten.karten).filter((k) => !p.gerade.some((g) => g.id === k.id)).length;
  const aktiv = route.seite === 'utm' ? 'werkzeuge' : route.seite === 'bericht' ? 'zahlen' : route.seite === 'anmelden' || route.seite === 'vorschau' ? 'start' : route.seite;

  // Deep link to a card (#/projekt/<id>) opens its sheet.
  const deepLink = route.seite === 'projekt' ? route.karte : undefined;
  const { oeffneKarte } = p;
  useEffect(() => {
    if (deepLink) oeffneKarte(deepLink);
  }, [deepLink, oeffneKarte]);

  const seitenSchluessel = route.seite === 'bericht' ? `bericht-${route.monat}` : aktiv;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [seitenSchluessel]);

  const karte = p.karteOffen ? daten.karten.find((k) => k.id === p.karteOffen!.id) : undefined;
  const schliesseKarte = () => {
    p.schliesseKarte();
    if (deepLink) geheZu({ seite: 'projekt' }, true);
  };

  return (
    <>
      <a className="sprung" href="#inhalt" onClick={(e) => { e.preventDefault(); document.getElementById('inhalt')?.focus(); }}>
        Zum Inhalt springen
      </a>
      {p.demo && <div className="demo-band">Demo mit Beispieldaten · nichts davon wird gespeichert</div>}
      {daten.vorschau && (
        <div className="vorschau-band" role="status">
          <span>
            <b>Team-Zugang</b> ({daten.vorschau}): Portal von {daten.kunde.name} mit allen Funktionen. Was du hier tust, wird als Velonify gespeichert.
          </span>
          <button type="button" onClick={() => { p.abmelden(); window.close(); }}>Team-Zugang beenden</button>
        </div>
      )}
      <header className="bar">
        <div className="bar-in">
          <div className="marke-zeile">
            <a className="marke" href={pfadVon({ seite: 'start' })} aria-label={`Velonify · ${daten.kunde.name}`}>
              <Logo /> VELONIFY {(daten.firmen?.length ?? 0) < 2 && <span className="kunde">{daten.kunde.name}</span>}
            </a>
            {(daten.firmen?.length ?? 0) > 1 && <FirmenWechsler />}
          </div>
          <nav className="tabs" aria-label="Portal">
            {TABS.filter((t) => t.seite !== 'zahlen' || daten.zahlen || daten.berichte?.length).map((t) => (
              <a key={t.seite} href={pfadVon({ seite: t.seite })} aria-current={aktiv === t.seite ? 'page' : undefined}>
                <Icon name={t.icon} />
                <span>{t.titel}</span>
                {t.seite === 'start' && offen > 0 && (
                  <span className="zahl" aria-label={`${offen} warten auf dich`}>
                    {offen}
                  </span>
                )}
              </a>
            ))}
          </nav>
          <span className="sp" />
          <button className="btn btn-anfrage" type="button" data-rundgang="anfrage" onClick={() => p.setAnfrageOffen(true)} aria-label="Neue Anfrage">
            <Icon name="plus" />
            <span className="t">Neue Anfrage</span>
          </button>
          <Menue />
        </div>
      </header>

      <main id="inhalt" tabIndex={-1} style={{ outline: 'none' }}>
        {aktiv === 'start' && <Start />}
        {aktiv === 'projekt' && <Projekt />}
        {aktiv === 'dateien' && <Dateien />}
        {route.seite === 'werkzeuge' && <Werkzeuge />}
        {route.seite === 'utm' && <Utm />}
        {route.seite === 'einstellungen' && <Einstellungen />}
        {route.seite === 'zahlen' && <Zahlen />}
        {route.seite === 'bericht' && <Bericht monat={route.monat} />}
        {route.seite === 'neu' && <Neu />}
      </main>

      <footer className="fuss">
        <span>
          Velonify · Fragen?{' '}
          {daten.slack ? (
            <a href={daten.slack.url} target="_blank" rel="noopener noreferrer">#{daten.slack.channel} in Slack</a>
          ) : (
            <a href={`mailto:${KONTAKT.email}`}>{KONTAKT.email}</a>
          )}
        </span>
        <button type="button" className="fuss-knopf" onClick={p.starteRundgang}>Hilfe &amp; Rundgang</button>
        <a href={RECHTLICHES.impressum} target="_blank" rel="noopener noreferrer">Impressum</a>
        <a href={RECHTLICHES.datenschutz} target="_blank" rel="noopener noreferrer">Datenschutz</a>
      </footer>

      {p.karteOffen && karte && <KarteBlatt karte={karte} aendern={p.karteOffen.aendern} onClose={schliesseKarte} />}
      {p.karteOffen && !karte && <KarteFehlt onClose={schliesseKarte} />}
      {p.anfrageOffen && <AnfrageBlatt onClose={() => p.setAnfrageOffen(false)} />}
      {p.feedbackOffen && <FeedbackBlatt onClose={() => p.setFeedbackOffen(false)} />}
      {p.terminMit && daten.termine?.[p.terminMit] && <TerminBlatt person={p.terminMit} link={daten.termine[p.terminMit]} onClose={() => p.setTerminMit(null)} />}
      {p.tour && <Rundgang tour={p.tour} onEnde={p.beendeTour} />}
    </>
  );
}

function KarteFehlt({ onClose }: { onClose: () => void }) {
  const { fehler } = usePortal();
  useEffect(() => {
    fehler(new Error('Diese Aufgabe gibt es hier nicht (mehr).'));
    onClose();
    // once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function Menue() {
  const { daten, abmelden, wechseln, setTerminMit, setFeedbackOffen, starteRundgang } = usePortal();
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const name = `${daten.ich.vorname} ${daten.ich.nachname}`.trim() || daten.ich.email;

  useEffect(() => {
    if (!offen) return;
    const zu = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOffen(false);
    };
    document.addEventListener('mousedown', zu);
    document.addEventListener('keydown', zu);
    return () => {
      document.removeEventListener('mousedown', zu);
      document.removeEventListener('keydown', zu);
    };
  }, [offen]);

  return (
    <div className="menue" ref={ref}>
      <button className="avatar-btn" type="button" data-rundgang="menue" aria-expanded={offen} aria-haspopup="true" onClick={() => setOffen(!offen)}>
        <span className="av">{initialen(name)}</span>
        <span className="name">{daten.ich.vorname || name}</span>
      </button>
      {offen && (
        <div className="menue-liste">
          <div className="wer">
            <strong>{name}</strong>
            <span>{daten.ich.email}</span>
            <br />
            <span>{daten.kunde.name}</span>
          </div>
          {(daten.firmen?.length ?? 0) > 1 && (
            <div className="menue-firmen">
              <span className="unterkopf">Kunde wechseln</span>
              {daten.firmen!.map((f) => (
                <button key={f.id} type="button" aria-current={f.name === daten.kunde.name ? 'true' : undefined} onClick={() => { setOffen(false); if (f.name !== daten.kunde.name) void wechseln(f.id); }}>
                  {f.name === daten.kunde.name ? <Icon name="check" /> : <span className="i" />}
                  {f.name}
                </button>
              ))}
            </div>
          )}
          {daten.slack && (
            <a href={daten.slack.url} target="_blank" rel="noopener noreferrer">
              <Icon name="slack" />
              In Slack schreiben
            </a>
          )}
          <a href={`mailto:${KONTAKT.email}`}>
            <Icon name="post" />
            {daten.slack ? 'E-Mail schreiben' : 'Velonify schreiben'}
          </a>
          {Object.keys(daten.termine ?? {}).map((person) => (
            <button key={person} type="button" onClick={() => { setOffen(false); setTerminMit(person); }}>
              <Icon name="kalender" />
              {Object.keys(daten.termine ?? {}).length > 1 ? `Termin mit ${person}` : 'Termin buchen'}
            </button>
          ))}
          <button type="button" onClick={() => { setOffen(false); setFeedbackOffen(true); }}>
            <Icon name="stern" />
            Feedback an Velonify
          </button>
          <a href={pfadVon({ seite: 'einstellungen' })} onClick={() => setOffen(false)}>
            <Icon name="glocke" />
            Benachrichtigungen
          </a>
          <button type="button" onClick={() => { setOffen(false); starteRundgang(); }}>
            <Icon name="funke" />
            Rundgang starten
          </button>
          <a href={pfadVon({ seite: 'neu' })} onClick={() => setOffen(false)}>
            <Icon name="info" />
            Neu im Portal
          </a>
          <button type="button" onClick={abmelden}>
            <Icon name="aus" />
            Abmelden
          </button>
        </div>
      )}
    </div>
  );
}

/** Switcher next to the logo for people who look after several clients. */
function FirmenWechsler() {
  const { daten, wechseln } = usePortal();
  const [offen, setOffen] = useState(false);
  const [laeuft, setLaeuft] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!offen) return;
    const zu = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOffen(false);
    };
    document.addEventListener('mousedown', zu);
    document.addEventListener('keydown', zu);
    return () => {
      document.removeEventListener('mousedown', zu);
      document.removeEventListener('keydown', zu);
    };
  }, [offen]);

  return (
    <div className="menue firmenwechsler" ref={ref}>
      <button className="wechsler-btn" type="button" aria-expanded={offen} aria-haspopup="true" onClick={() => setOffen(!offen)}>
        <span>{daten.kunde.name}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {offen && (
        <div className="menue-liste links">
          <span className="unterkopf" style={{ padding: '8px 10px 4px' }}>Deine Kunden</span>
          {daten.firmen!.map((f) => {
            const aktuell = f.name === daten.kunde.name;
            return (
              <button
                key={f.id}
                type="button"
                aria-current={aktuell ? 'true' : undefined}
                disabled={!!laeuft}
                onClick={async () => {
                  if (aktuell) return setOffen(false);
                  setLaeuft(f.id);
                  await wechseln(f.id);
                  setLaeuft('');
                  setOffen(false);
                }}
              >
                {aktuell ? <Icon name="check" /> : laeuft === f.id ? <span className="lade" /> : <span className="i" />}
                {f.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
