import { Icon, Logo } from '../components/Icon';
import { usePortal } from '../portal';
import { pfadVon } from '../lib/route';
import { datum, Ga4, Gsc, Ladezeit } from './Zahlen';
import { FeedbackFrage } from './Feedback';

const monatsname = (titel: string) => titel.split(' ')[0];

/**
 * One monthly report: the team's assessment, what got done, the numbers of the month against the month before and
 * what comes next. "Als PDF speichern" prints the page; the print styles leave out the portal around it.
 */
export function Bericht({ monat }: { monat: string }) {
  const { daten } = usePortal();
  const b = daten.berichte?.find((x) => x.monat === monat);

  if (!b) {
    return (
      <div className="seite einspaltig">
        <div className="haupt">
          <a className="zurueck-link" href={pfadVon({ seite: 'zahlen' })}>
            <Icon name="zurueck" /> Zahlen
          </a>
          <div className="meldung info">Diesen Bericht gibt es (noch) nicht.</div>
        </div>
      </div>
    );
  }

  const { zahlen, erledigt, meilensteine, naechstes } = b.daten;
  const name = monatsname(b.titel);
  const stand = new Date(b.freigegeben_am || b.daten.stand_am);
  return (
    <div className="seite einspaltig bericht">
      <div className="haupt">
        <a className="zurueck-link nicht-drucken" href={pfadVon({ seite: 'zahlen' })}>
          <Icon name="zurueck" /> Zahlen
        </a>
        <div className="druck-marke" aria-hidden="true">
          <Logo /> VELONIFY
        </div>
        <div className="kopf bericht-kopf">
          <div>
            <span className="augenbraue">Monatsbericht · {daten.kunde.name}</span>
            <h1>{b.titel}</h1>
            <p>Was im {name} passiert ist, wie sich der Shop entwickelt hat und was als Nächstes kommt. Veränderungen jeweils zum Vormonat.</p>
          </div>
          <button type="button" className="btn zweit nicht-drucken" onClick={() => window.print()}>
            <Icon name="drucker" /> Als PDF speichern
          </button>
        </div>

        {b.status === 'entwurf' && <div className="meldung warn nicht-drucken">Entwurf: nur im Team-Zugang sichtbar. Freigegeben wird im Hub unter Portal → Monatsberichte.</div>}

        {b.kommentar && (
          <section className="einschaetzung" aria-label="Einschätzung von Velonify">
            <h2>Unsere Einschätzung</h2>
            <p>{b.kommentar}</p>
            {b.von && <span className="von">{b.von}, Velonify</span>}
          </section>
        )}

        {(erledigt.length > 0 || meilensteine.length > 0) && (
          <section className="block" aria-labelledby="b-erledigt">
            <div className="block-kopf">
              <h2 id="b-erledigt">Erledigt im {name}</h2>
              <span className="muted klein">{erledigt.length + meilensteine.length} Punkte</span>
            </div>
            <ul className="bericht-liste">
              {meilensteine.map((m) => (
                <li key={`m-${m.titel}`} className="meilenstein">
                  <Icon name="flagge" />
                  <span>
                    <b>Meilenstein erreicht:</b> {m.titel}
                  </span>
                  <span className="muted klein">{datum(m.datum)}</span>
                </li>
              ))}
              {erledigt.map((k) => (
                <li key={`k-${k.titel}-${k.datum}`}>
                  <Icon name="check" />
                  <span>{k.titel}</span>
                  <span className="muted klein">{datum(k.datum)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {zahlen.ga4 && <Ga4 d={zahlen.ga4} />}
        {zahlen.gsc && <Gsc d={zahlen.gsc} />}
        {zahlen.pagespeed && <Ladezeit d={zahlen.pagespeed} />}

        {naechstes.length > 0 && (
          <section className="block" aria-labelledby="b-naechstes">
            <div className="block-kopf">
              <h2 id="b-naechstes">Als Nächstes</h2>
            </div>
            <ul className="bericht-liste">
              {naechstes.map((n) => (
                <li key={`${n.art}-${n.titel}`} className={n.art}>
                  <Icon name={n.art === 'meilenstein' ? 'flagge' : 'pfeil'} />
                  <span>{n.art === 'meilenstein' ? <><b>Meilenstein:</b> {n.titel}</> : n.titel}</span>
                  <span className="muted klein">{n.datum ? `bis ${datum(n.datum)}` : ''}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="block nicht-drucken bericht-feedback" aria-label="Feedback zum Monat">
          <FeedbackFrage anlass="bericht" bezugId={b.monat} frage={`Wie zufrieden warst du im ${name} mit uns?`} />
        </section>

        <p className="bericht-fuss muted klein">
          Velonify · Monatsbericht {b.titel} für {daten.kunde.name}
          {Number.isNaN(stand.getTime()) ? '' : ` · Stand ${stand.toLocaleDateString('de-DE')}`}
        </p>
      </div>
    </div>
  );
}
