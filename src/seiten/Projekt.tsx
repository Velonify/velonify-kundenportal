import { useState } from 'react';
import type { PortalKarte } from '../api/vertrag';
import { datumKurz, datumRelativ, heute } from '../lib/datum';
import { usePortal } from '../portal';
import { Projektstand } from './Bausteine';

export function Projekt() {
  const { daten, oeffneKarte, setAnfrageOffen, nurLesen } = usePortal();
  const [erledigtOffen, setErledigtOffen] = useState(false);
  const nach = (phase: PortalKarte['phase']) => daten.karten.filter((k) => k.phase === phase);
  const erledigt = nach('erledigt').sort((a, b) => b.erledigt_am.localeCompare(a.erledigt_am));
  const arbeit = nach('arbeit').length;

  const zeile = (k: PortalKarte) => {
    const spaet = k.phase !== 'erledigt' && !!k.faellig_am && k.faellig_am < heute();
    const teile = [
      k.zustaendig.join(', '),
      k.phase === 'erledigt' ? (k.erledigt_am ? `erledigt ${datumKurz(k.erledigt_am)}` : 'erledigt') : k.faellig_am ? `bis ${datumRelativ(k.faellig_am)}` : '',
      k.kommentare.length ? `${k.kommentare.length} ${k.kommentare.length === 1 ? 'Nachricht' : 'Nachrichten'}` : '',
    ].filter(Boolean);
    return (
      <button key={k.id} className={`zeile ${k.phase}`} type="button" onClick={() => oeffneKarte(k.id)}>
        <span className="pkt" aria-hidden="true" />
        <span style={{ minWidth: 0 }}>
          <span className="t">{k.titel}</span>
          <span className="s" style={spaet ? { color: 'var(--warn)', fontWeight: 700 } : undefined}>{teile.join(' · ')}</span>
        </span>
        {k.phase === 'wartet' ? (
          <span className="pill himmel">Freigabe offen</span>
        ) : k.freigabe === 'aenderung' ? (
          <span className="pill warn">Änderung gewünscht</span>
        ) : k.freigabe === 'freigegeben' && k.phase !== 'erledigt' ? (
          <span className="pill ok">Freigegeben</span>
        ) : k.anfrage ? (
          <span className="pill blau">Eure Anfrage</span>
        ) : (
          <span />
        )}
      </button>
    );
  };

  const gruppe = (titel: string, liste: PortalKarte[], hint: string, cls = '') =>
    liste.length > 0 && (
      <section className={`gruppe ${cls}`} aria-label={titel}>
        <div className="gruppe-kopf">
          <h2>{titel}</h2>
          <span className="n">{liste.length}</span>
          {hint && <span className="hint">{hint}</span>}
        </div>
        {liste.map(zeile)}
      </section>
    );

  const offen = daten.karten.filter((k) => k.phase !== 'erledigt').length;

  return (
    <div className="seite einspaltig">
      <div className="haupt">
        <div className="kopf">
          <h1>Projekt</h1>
          <p>
            {arbeit} {arbeit === 1 ? 'Aufgabe' : 'Aufgaben'} in Arbeit, {erledigt.length} erledigt. Alles, was wir für euch tun, an einem Ort.
          </p>
        </div>
        <Projektstand fahrplan={daten.fahrplan} />
        <div className="gruppen">
          {gruppe('Wartet auf dich', nach('wartet'), 'bitte freigeben', 'dran')}
          {gruppe('In Arbeit', nach('arbeit'), 'macht gerade das Team')}
          {gruppe('Als Nächstes', nach('geplant'), '')}
          {offen === 0 && (
            <div className="alles-gut">
              Gerade ist nichts offen.{' '}
              {!nurLesen && <button className="textlink" type="button" onClick={() => setAnfrageOffen(true)}>
                Neue Anfrage stellen
              </button>}
            </div>
          )}
          {erledigt.length > 0 && (
            <section className={`gruppe ${erledigtOffen ? '' : 'zu'}`}>
              <button className="gruppe-kopf" type="button" aria-expanded={erledigtOffen} onClick={() => setErledigtOffen(!erledigtOffen)}>
                <h2>Erledigt</h2>
                <span className="n">{erledigt.length}</span>
                <span className="hint">{erledigtOffen ? 'ausblenden' : 'anzeigen'}</span>
              </button>
              {erledigtOffen && erledigt.map(zeile)}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
