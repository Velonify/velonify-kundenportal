import type { Kundensicht } from '../api/vertrag';
import { Text } from '../components/Text';
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
  const [offen, setOffen] = useState<Set<string>>(new Set());
  const eintraege = baueFeed(daten);
  const umschalten = (key: string) => setOffen((alt) => { const neu = new Set(alt); if (neu.has(key)) neu.delete(key); else neu.add(key); return neu; });
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
            // Only news that the two-line preview cuts off.
            const aufklappbar = e.key.startsWith('n-') && (e.detail.length > 110 || e.detail.includes('\n'));
            const istOffen = aufklappbar && offen.has(e.key);
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
                  {istOffen ? (
                    <Text text={e.detail} className="detail offen" />
                  ) : (
                    e.detail && <span className="detail" style={{ display: '-webkit-box' }}>{e.art === 'antwort' ? `„${e.detail}“` : e.detail}</span>
                  )}
                  {aufklappbar && <span className="weiter">{istOffen ? 'Weniger' : 'Ganz lesen'}</span>}
                </span>
                <span className="zeit">{uhrzeit(e.datum) && tagVon(e.datum) === tagVon(new Date()) ? uhrzeit(e.datum) : datumRelativ(e.datum)}</span>
              </>
            );
            if (aufklappbar) {
              // Links inside the opened text must stay clickable, so the opened entry is no button.
              return istOffen ? (
                <div key={e.key} className="eintrag offen" onClick={(ev) => { if (!(ev.target as HTMLElement).closest('a')) umschalten(e.key); }}>{inhalt}</div>
              ) : (
                <button key={e.key} type="button" className="eintrag" aria-expanded={false} onClick={() => umschalten(e.key)}>{inhalt}</button>
              );
            }
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
  const { daten, setTerminMit } = usePortal();
  const werkzeuge = daten.werkzeuge.filter((w) => WERKZEUGE[w]?.seite);
  const links = daten.links.slice(0, 6);
  return (
    <aside className="neben" aria-label="Team und Links">
      <div className="seitenkarte">
        <h2>Dein Team bei Velonify</h2>
        {daten.team.map((name) => (
          <div className="person" key={name}>
            <span className="av team">{initialen(name)}</span>
            <div>
              <strong>{name}</strong>
              {daten.telefone?.[name] && <a href={`tel:${daten.telefone[name].replace(/[^\d+]/g, '')}`}>{daten.telefone[name]}</a>}
              {daten.termine?.[name] && (
                <button type="button" className="termin-link" onClick={() => setTerminMit(name)}>
                  <Icon name="kalender" />
                  Termin buchen
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="kontaktwege">
          {daten.slack && (
            <a className="kontaktweg haupt" href={daten.slack.url} target="_blank" rel="noopener noreferrer">
              <span className="av klein"><Icon name="slack" /></span>
              <span><strong>#{daten.slack.channel}</strong><span>am schnellsten: schreib uns in Slack</span></span>
            </a>
          )}
          <a className="kontaktweg" href={`mailto:${KONTAKT.email}`}>
            <span className="av klein"><Icon name="post" /></span>
            <span><strong>{KONTAKT.email}</strong><span>{daten.slack ? 'per E-Mail' : 'für alles, was keine Aufgabe ist'}</span></span>
          </a>
          <a className="kontaktweg" href={KONTAKT.telefonLink}>
            <span className="av klein"><Icon name="tel" /></span>
            <span><strong>{KONTAKT.telefon}</strong><span>im Notfall, wenn der Shop nicht läuft</span></span>
          </a>
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
