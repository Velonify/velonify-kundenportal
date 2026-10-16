import type { SpeedMessung, TrackingDaten, Zeitraum } from '../api/vertrag';
import { usePortal } from '../portal';

const zahl = (n: number, stellen = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: stellen, maximumFractionDigits: stellen });
const euro = (n: number, waehrung = 'EUR') => n.toLocaleString('de-DE', { style: 'currency', currency: waehrung, maximumFractionDigits: 0 });
const prozent = (anteil: number, stellen = 1) => `${zahl(anteil * 100, stellen)} %`;
const datum = (tag: string) => tag.split('-').reverse().join('.');
const zeitraumText = (z: Zeitraum) => `${datum(z.von)} – ${datum(z.bis)}`;

/** Change against the 28 days before, as text with direction; lower is better for the search position. */
function Veraenderung({ jetzt, vorher, besserWennKleiner = false }: { jetzt: number; vorher: number; besserWennKleiner?: boolean }) {
  if (!vorher) return <span className="delta">kein Vergleich</span>;
  const wert = ((jetzt - vorher) / vorher) * 100;
  if (Math.abs(wert) < 0.5) return <span className="delta">± 0 %</span>;
  const gut = besserWennKleiner ? wert < 0 : wert > 0;
  return (
    <span className={`delta ${gut ? 'gut' : 'schlecht'}`}>
      {wert > 0 ? '▲' : '▼'} {zahl(Math.abs(wert), Math.abs(wert) < 10 ? 1 : 0)} %
    </span>
  );
}

function Kachel({ titel, wert, jetzt, vorher, besserWennKleiner }: { titel: string; wert: string; jetzt: number; vorher: number; besserWennKleiner?: boolean }) {
  return (
    <div className="kennzahl">
      <span className="k-titel">{titel}</span>
      <strong>{wert}</strong>
      <Veraenderung jetzt={jetzt} vorher={vorher} besserWennKleiner={besserWennKleiner} />
    </div>
  );
}

/** One series per day as a thin line with an area; every day has a hover target with its value. */
function Verlauf({ punkte, titel, format }: { punkte: { tag: string; wert: number }[]; titel: string; format: (n: number) => string }) {
  if (punkte.length < 2) return null;
  const B = 600;
  const H = 120;
  const max = Math.max(...punkte.map((p) => p.wert), 1);
  const x = (i: number) => (i / (punkte.length - 1)) * B;
  const y = (w: number) => H - 6 - (w / max) * (H - 16);
  const linie = punkte.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.wert).toFixed(1)}`).join(' ');
  const breite = B / punkte.length;
  return (
    <figure className="verlauf">
      <figcaption>{titel}</figcaption>
      <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${titel}, ${punkte.length} Tage`}>
        <line x1="0" x2={B} y1={H - 6} y2={H - 6} className="achse" />
        <path d={`${linie} L${B},${H - 6} L0,${H - 6} Z`} className="flaeche" />
        <path d={linie} className="linie" vectorEffect="non-scaling-stroke" />
        {punkte.map((p, i) => (
          <rect key={p.tag} x={x(i) - breite / 2} y="0" width={breite} height={H} className="treffer">
            <title>{`${datum(p.tag)}: ${format(p.wert)}`}</title>
          </rect>
        ))}
      </svg>
      <div className="verlauf-achse">
        <span>{datum(punkte[0].tag)}</span>
        <span>höchster Tag: {format(max)}</span>
        <span>{datum(punkte[punkte.length - 1].tag)}</span>
      </div>
    </figure>
  );
}

/** Google's thresholds: good / needs improvement / poor, always with a word next to the colour. */
const AMPEL = {
  score: (w: number) => (w >= 90 ? 'gut' : w >= 50 ? 'mittel' : 'schlecht'),
  lcp: (ms: number) => (ms <= 2500 ? 'gut' : ms <= 4000 ? 'mittel' : 'schlecht'),
  cls: (w: number) => (w <= 0.1 ? 'gut' : w <= 0.25 ? 'mittel' : 'schlecht'),
  inp: (ms: number) => (ms <= 200 ? 'gut' : ms <= 500 ? 'mittel' : 'schlecht'),
} as const;
const AMPEL_TEXT = { gut: 'gut', mittel: 'ausbaufähig', schlecht: 'langsam' } as const;

function Messwert({ titel, wert, stufe, hilfe }: { titel: string; wert: string; stufe: keyof typeof AMPEL_TEXT; hilfe: string }) {
  return (
    <div className="messwert" title={hilfe}>
      <span className="k-titel">{titel}</span>
      <strong>{wert}</strong>
      <span className={`ampel ${stufe}`}>
        <span className="punkt" aria-hidden="true" />
        {AMPEL_TEXT[stufe]}
      </span>
    </div>
  );
}

function Speed({ titel, m }: { titel: string; m: SpeedMessung | null }) {
  if (!m) return null;
  return (
    <div className="speed">
      <h3>{titel}</h3>
      <div className="messwerte">
        {m.score !== null && <Messwert titel="PageSpeed-Wert" wert={`${m.score} / 100`} stufe={AMPEL.score(m.score)} hilfe="Gesamtwert von Google Lighthouse" />}
        {m.lcp_ms !== null && <Messwert titel="Ladezeit (LCP)" wert={`${zahl(m.lcp_ms / 1000, 1)} s`} stufe={AMPEL.lcp(m.lcp_ms)} hilfe="Bis der größte Inhalt sichtbar ist" />}
        {m.cls !== null && <Messwert titel="Verrutschen (CLS)" wert={zahl(m.cls, 2)} stufe={AMPEL.cls(m.cls)} hilfe="Wie stark Inhalte beim Laden springen" />}
        {m.inp_ms !== null && <Messwert titel="Reaktion (INP)" wert={`${zahl(m.inp_ms)} ms`} stufe={AMPEL.inp(m.inp_ms)} hilfe="Wie schnell die Seite auf Klicks reagiert" />}
      </div>
      <p className="klein muted">{m.quelle === 'feld' ? 'PageSpeed-Wert aus dem Labortest, die übrigen Werte von echten Besuchern der letzten 28 Tage (Chrome-Nutzerdaten).' : 'Alle Werte aus einem Labortest, für echte Besucherdaten hat Google noch zu wenige Besuche.'}</p>
    </div>
  );
}

function Ga4({ d }: { d: NonNullable<TrackingDaten['ga4']> }) {
  return (
    <section className="block" aria-labelledby="z-ga4">
      <div className="block-kopf">
        <h2 id="z-ga4">Besucher und Umsatz</h2>
        <span className="muted klein">Google Analytics · {zeitraumText(d.zeitraum)}</span>
      </div>
      <div className="kennzahlen">
        <Kachel titel="Besucher" wert={zahl(d.nutzer)} jetzt={d.nutzer} vorher={d.vorher.nutzer} />
        <Kachel titel="Sitzungen" wert={zahl(d.sitzungen)} jetzt={d.sitzungen} vorher={d.vorher.sitzungen} />
        <Kachel titel="Umsatz" wert={euro(d.umsatz, d.waehrung)} jetzt={d.umsatz} vorher={d.vorher.umsatz} />
        <Kachel titel="Bestellungen" wert={zahl(d.transaktionen)} jetzt={d.transaktionen} vorher={d.vorher.transaktionen} />
        <Kachel titel="Conversion-Rate" wert={prozent(d.conversion_rate, 2)} jetzt={d.conversion_rate} vorher={d.vorher.conversion_rate} />
      </div>
      <Verlauf titel="Sitzungen pro Tag" punkte={d.verlauf.map((v) => ({ tag: v.tag, wert: v.sitzungen }))} format={(n) => `${zahl(n)} Sitzungen`} />
      {d.kanaele.length > 0 && (
        <table className="tabelle">
          <caption>Woher die Besucher kommen</caption>
          <thead>
            <tr>
              <th scope="col">Kanal</th>
              <th scope="col" className="r">Sitzungen</th>
              <th scope="col" className="r">Umsatz</th>
            </tr>
          </thead>
          <tbody>
            {d.kanaele.map((k) => (
              <tr key={k.name}>
                <td>{k.name}</td>
                <td className="r">{zahl(k.sitzungen)}</td>
                <td className="r">{euro(k.umsatz, d.waehrung)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Gsc({ d }: { d: NonNullable<TrackingDaten['gsc']> }) {
  return (
    <section className="block" aria-labelledby="z-gsc">
      <div className="block-kopf">
        <h2 id="z-gsc">Google-Suche</h2>
        <span className="muted klein">Search Console · {zeitraumText(d.zeitraum)}</span>
      </div>
      <div className="kennzahlen">
        <Kachel titel="Klicks" wert={zahl(d.klicks)} jetzt={d.klicks} vorher={d.vorher.klicks} />
        <Kachel titel="Impressionen" wert={zahl(d.impressionen)} jetzt={d.impressionen} vorher={d.vorher.impressionen} />
        <Kachel titel="Klickrate" wert={prozent(d.ctr)} jetzt={d.ctr} vorher={d.vorher.ctr} />
        <Kachel titel="Ø Position" wert={zahl(d.position, 1)} jetzt={d.position} vorher={d.vorher.position} besserWennKleiner />
      </div>
      <Verlauf titel="Klicks pro Tag" punkte={d.verlauf.map((v) => ({ tag: v.tag, wert: v.klicks }))} format={(n) => `${zahl(n)} Klicks`} />
      {d.suchanfragen.length > 0 && (
        <table className="tabelle">
          <caption>Top-Suchanfragen</caption>
          <thead>
            <tr>
              <th scope="col">Suchanfrage</th>
              <th scope="col" className="r">Klicks</th>
              <th scope="col" className="r">Impressionen</th>
              <th scope="col" className="r">Position</th>
            </tr>
          </thead>
          <tbody>
            {d.suchanfragen.map((s) => (
              <tr key={s.suchanfrage}>
                <td>{s.suchanfrage}</td>
                <td className="r">{zahl(s.klicks)}</td>
                <td className="r">{zahl(s.impressionen)}</td>
                <td className="r">{zahl(s.position, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/** "Zahlen": the last snapshot of Google Analytics, Search Console and PageSpeed, fetched once a day. */
export function Zahlen() {
  const { daten } = usePortal();
  const z = daten.zahlen;
  if (!z) return null;
  const stand = new Date(z.stand_am);
  return (
    <div className="seite einspaltig">
      <div className="haupt">
        <div className="kopf">
          <h1>Zahlen</h1>
          <p>
            Die letzten 28 Tage im Vergleich zu den 28 davor. Wird jeden Morgen aktualisiert
            {Number.isNaN(stand.getTime()) ? '.' : `, zuletzt am ${stand.toLocaleDateString('de-DE')} um ${stand.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr.`}
          </p>
        </div>
        {daten.vorschau && !z.sichtbar_kunde && <div className="meldung warn">Nur im Team-Zugang sichtbar: Für den Kunden ist der Bereich noch nicht freigegeben (Hub → Portal → Tracking).</div>}
        {z.daten.ga4 && <Ga4 d={z.daten.ga4} />}
        {z.daten.gsc && <Gsc d={z.daten.gsc} />}
        {z.daten.pagespeed && (
          <section className="block" aria-labelledby="z-speed">
            <div className="block-kopf">
              <h2 id="z-speed">Ladezeit</h2>
              <span className="muted klein">PageSpeed · {z.daten.pagespeed.url.replace(/^https?:\/\//, '')}</span>
            </div>
            <div className="speed-paar">
              <Speed titel="Handy" m={z.daten.pagespeed.mobil} />
              <Speed titel="Desktop" m={z.daten.pagespeed.desktop} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
