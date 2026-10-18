import { Icon } from '../components/Icon';
import { datumKurz } from '../lib/datum';
import { NEUERUNGEN } from '../neuerungen';
import { usePortal } from '../portal';

/** "Neu im Portal": everything new, newest first, each with a spotlight on where to find it. */
export function Neu() {
  const { daten, starteRundgang, zeigeNeuerung } = usePortal();
  const liste = NEUERUNGEN.filter((n) => !n.bedingung || n.bedingung(daten));
  return (
    <div className="seite einspaltig">
      <div className="haupt">
        <div className="kopf">
          <h1>Neu im Portal</h1>
          <p>Was wir zuletzt für dich eingebaut haben. Den Rundgang durchs ganze Portal kannst du jederzeit neu starten.</p>
        </div>
        <div>
          <button type="button" className="btn zweit" onClick={starteRundgang}>
            <Icon name="funke" />
            Rundgang starten
          </button>
        </div>
        <div className="neu-liste">
          {liste.map((n) => (
            <article className="neu-eintrag" key={n.id}>
              <span className="datum">{datumKurz(n.datum)}</span>
              <h2>{n.titel}</h2>
              <p>{n.text}</p>
              {n.ziel && (
                <button type="button" className="btn leise" onClick={() => zeigeNeuerung(n)}>
                  Zeig mir, wo
                  <Icon name="pfeil" />
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
