import type { Kundensicht } from '../api/vertrag';
import { Icon, type IconName } from '../components/Icon';
import { baueFeed, gruppiereFeed, initialen, projektstand, type FeedArt } from '../lib/ansicht';
import { datumKurz, datumRelativ, uhrzeit, tagVon } from '../lib/datum';
import { istNeu } from '../lib/zuletzt';
import { KONTAKT, WERKZEUGE } from '../konfig';
import { usePortal } from '../portal';
import { geheZu, pfadVon } from '../lib/route';
import { useState } from 'react';

/** Dark band with the current stage, days to the goal and one bar per milestone. Hidden without a roadmap. */
export function Projektstand({ fahrplan }: { fahrplan: Kundensicht['fahrplan'] }) {
  if (fahrplan.length === 0) return null;
  const stand = projektstand(fahrplan);
  const alleFertig = !stand.aktuell;
  return (
    <section className="status" aria-label="Projektstand">
      <div className="status-oben">
        <div>
          <span className="phase">{alleFertig ? 'Projektstand' : `Etappe ${stand.erledigt + 1} von ${fahrplan.length} · jetzt dran`}</span>
          <strong>{alleFertig ? 'Alle Etappen erledigt' : stand.aktuell!.titel}</strong>
        </div>
        {stand.ziel && stand.tageBisZiel !== null && stand.tageBisZiel >= 0 && (
          <div className="rest">
            <b>{stand.tageBisZiel === 0 ? 'Heute' : `${stand.tageBisZiel} ${stand.tageBisZiel === 1 ? 'Tag' : 'Tage'}`}</b>
            bis {stand.ziel.titel} am {datumKurz(stand.ziel.datum)}
          </div>
        )}
      </div>
      <ol className="etappen">
        {fahrplan.map((m, i) => (
          <li key={i} className={`etappe ${m === stand.aktuell ? 'aktiv' : m.status === 'erledigt' ? 'erledigt' : ''}`}>
            <i />
            <span>
              {m.titel}
              {m.datum && m.status !== 'erledigt' ? ` · ${datumKurz(m.datum)}` : ''}
            </span>
            <span className="sr">{m.status === 'erledigt' ? '(erledigt)' : m === stand.aktuell ? '(jetzt dran)' : '(geplant)'}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

const SYMBOL: Record<FeedArt, IconName> = { meilenstein: 'flagge', update: 'info', hinweis: 'warn', datei: 'datei', erledigt: 'check', antwort: 'kom' };

/** "Was neu ist": everything that happened, newest first, grouped by day. */
export function Feed({ max }: { max: number }) {
  const { daten, neuSeit, oeffneKarte, herunterladen } = usePortal();
  const [alle, setAlle] = useState(false);
  const eintraege = baueFeed(daten);
  const sichtbar = alle ? eintraege : eintraege.slice(0, max);
  if (eintraege.length === 0) {
    return <div className="feed"><p className="leer">Hier erscheint, was im Projekt passiert: Neuigkeiten, Dateien von uns und erledigte Aufgaben.</p></div>;
  }
  return (
    <div className="feed">
      {gruppiereFeed(sichtbar).map((g) => (
        <div key={g.titel}>
          <div className="tag-kopf">{g.titel}</div>
          {g.eintraege.map((e) => {
            const inhalt = (
              <>
                <span className={`sym ${e.art}`}><Icon name={SYMBOL[e.art]} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="was" style={{ display: 'block' }}>
                    <b>{e.wer}</b>
                    {e.art === 'antwort' ? ' hat geantwortet ' : ': '}
                    {e.was}
                    {istNeu(e.datum, neuSeit) && <> <span className="pill himmel">Neu</span></>}
                  </span>
                  {e.detail && <span className="detail" style={{ display: '-webkit-box' }}>{e.art === 'antwort' ? `„${e.detail}“` : e.detail}</span>}
                </span>
                <span className="zeit">{uhrzeit(e.datum) && tagVon(e.datum) === tagVon(new Date()) ? uhrzeit(e.datum) : datumRelativ(e.datum)}</span>
              </>
            );
            if (e.karte) return <button key={e.key} type="button" className="eintrag" onClick={() => oeffneKarte(e.karte!)}>{inhalt}</button>;
            if (e.datei) {
              const datei = daten.dateien.find((d) => d.id === e.datei);
              return <button key={e.key} type="button" className="eintrag" onClick={() => datei && void herunterladen(datei)} aria-label={`${e.was} herunterladen`}>{inhalt}</button>;
            }
            return <div key={e.key} className="eintrag">{inhalt}</div>;
          })}
        </div>
      ))}
      {eintraege.length > max && (
        <div className="mehr">
          <button className="textlink" type="button" onClick={() => setAlle(!alle)}>
            {alle ? 'Weniger anzeigen' : `Ältere anzeigen (${eintraege.length - max})`}
          </button>
        </div>
      )}
    </div>
  );
}

/** Side column: the team with the emergency number, and quick links to tools and the client's links. */
export function Neben() {
  const { daten } = usePortal();
  const werkzeuge = daten.werkzeuge.filter((w) => WERKZEUGE[w]?.seite);
  const links = daten.links.slice(0, 6);
  return (
    <aside className="neben" aria-label="Team und Links">
      <div className="seitenkarte">
        <h2>Dein Team bei Velonify</h2>
        {daten.team.map((name) => (
          <div className="person" key={name}>
            <span className="av team">{initialen(name)}</span>
            <div><strong>{name}</strong></div>
          </div>
        ))}
        <div className="person">
          <span className="av klein" style={{ width: 32, height: 32 }}><Icon name="post" /></span>
          <a href={`mailto:${KONTAKT.email}`}><strong>{KONTAKT.email}</strong><span>für alles, was keine Aufgabe ist</span></a>
        </div>
        <div className="person notfall">
          <span className="av klein" style={{ width: 32, height: 32 }}><Icon name="tel" /></span>
          <a href={KONTAKT.telefonLink}><strong>{KONTAKT.telefon}</strong><span>wenn der Shop nicht läuft</span></a>
        </div>
      </div>
      {(werkzeuge.length > 0 || links.length > 0) && (
        <div className="seitenkarte">
          <h2>Schnell öffnen</h2>
          <div className="schnell">
            {werkzeuge.map((w) => (
              <a key={w} href={pfadVon({ seite: WERKZEUGE[w].seite! })}>
                <Icon name="tool" />
                {WERKZEUGE[w].titel}
              </a>
            ))}
            {links.map((l) => (
              <a key={l.url + l.titel} href={l.url} target="_blank" rel="noopener noreferrer">
                <Icon name="link" />
                {l.titel}
                <span className="ext" aria-hidden="true">↗</span>
              </a>
            ))}
            {daten.links.length > links.length && (
              <button type="button" onClick={() => geheZu({ seite: 'werkzeuge' })}>
                <Icon name="pfeil" />
                Alle Links
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
