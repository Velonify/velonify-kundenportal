import type { PortalKarte } from '../api/vertrag';
import { Icon } from '../components/Icon';
import { wartendeKarten } from '../lib/ansicht';
import { datumRelativ, heute, tagVon } from '../lib/datum';
import { usePortal } from '../portal';
import { Feed, Neben, Projektstand } from './Bausteine';

const ZAHLWORT = ['Keine', 'Eine', 'Zwei', 'Drei', 'Vier', 'Fünf', 'Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn'];

function begruessung(): string {
  const stunde = Number(new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  if (stunde < 11) return 'Guten Morgen';
  if (stunde >= 18) return 'Guten Abend';
  return 'Hallo';
}

export function Start() {
  const p = usePortal();
  const { daten, gerade } = p;
  const wartend = wartendeKarten(daten.karten).filter((k) => !gerade.some((g) => g.id === k.id));
  const arbeit = daten.karten.filter((k) => k.phase === 'arbeit').length;
  const n = wartend.length;
  const satz = n
    ? `${ZAHLWORT[n] ?? n} ${n === 1 ? 'Sache wartet' : 'Sachen warten'} auf deine Freigabe.${arbeit ? ` Das Team arbeitet gerade an ${arbeit} ${arbeit === 1 ? 'Aufgabe' : 'Aufgaben'}.` : ''}`
    : arbeit
      ? `Gerade wartet nichts auf dich. Das Team arbeitet an ${arbeit} ${arbeit === 1 ? 'Aufgabe' : 'Aufgaben'}.`
      : 'Gerade wartet nichts auf dich.';

  return (
    <div className="seite">
      <div className="haupt">
        <div className="kopf">
          <h1>
            {begruessung()}
            {daten.ich.vorname && !daten.vorschau ? ` ${daten.ich.vorname}` : ''}
          </h1>
          <p>{satz}</p>
        </div>

        <section className="block" aria-labelledby="zu-tun">
          <div className="block-kopf">
            <h2 id="zu-tun">
              Für dich zu tun {n > 0 && <span className="n">{n}</span>}
            </h2>
          </div>
          {gerade.map((g) => (
            <div className="todo fertig" key={g.id} role="status">
              <Icon name="check" />
              <span>
                <b>{g.titel}</b> · {g.entscheidung === 'freigegeben' ? 'freigegeben' : 'Änderung gewünscht'}
                {g.wartet ? '' : ', das Team ist informiert'}
              </span>
              {g.wartet && (
                <button className="textlink" type="button" onClick={() => p.rueckgaengig(g.id)}>
                  Rückgängig
                </button>
              )}
            </div>
          ))}
          {wartend.map((k) => <TodoKarte key={k.id} karte={k} />)}
          {n === 0 && gerade.length === 0 && (
            <div className="alles-gut">
              <Icon name="check" />
              Nichts offen. Wir melden uns, sobald es etwas zu prüfen gibt.
            </div>
          )}
        </section>

        <Projektstand fahrplan={daten.fahrplan} />

        <section className="block" aria-labelledby="neu">
          <div className="block-kopf">
            <h2 id="neu">Was neu ist</h2>
          </div>
          <Feed max={6} />
        </section>
      </div>
      <Neben />
    </div>
  );
}

function TodoKarte({ karte }: { karte: PortalKarte }) {
  const p = usePortal();
  const faellig = karte.faellig_am ? tagVon(karte.faellig_am) : '';
  const spaet = !!faellig && faellig < heute();
  const vorschau = karte.beschreibung.split('\n').filter(Boolean).slice(0, 3).join('\n');
  return (
    <article className="todo" aria-labelledby={`t-${karte.id}`}>
      <div>
        <h3 id={`t-${karte.id}`}>{karte.titel}</h3>
        {vorschau && <p className="warum">{vorschau}</p>}
      </div>
      <div className="aktionen">
        <button className="btn" type="button" onClick={() => p.freigeben(karte)}>
          <Icon name="check" />
          Freigeben
        </button>
        <button className="btn zweit" type="button" onClick={() => p.oeffneKarte(karte.id, true)}>
          Änderung wünschen
        </button>
        <button className="btn leise" type="button" onClick={() => p.oeffneKarte(karte.id)}>
          Details{karte.kommentare.length > 0 ? ` · ${karte.kommentare.length}` : ''}
        </button>
        <span className={`meta${spaet ? ' spaet' : ''}`}>
          {karte.zustaendig.length > 0 && `von ${karte.zustaendig.join(' und ')}`}
          {faellig && `${karte.zustaendig.length ? ' · ' : ''}${spaet ? 'war fällig ' : 'bis '}${datumRelativ(faellig)}`}
        </span>
      </div>
    </article>
  );
}
