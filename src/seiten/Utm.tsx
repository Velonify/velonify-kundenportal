import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { baueUtmLink, zielUrl, type UtmEingabe } from '../lib/utm';
import { pfadVon } from '../lib/route';
import { speicher } from '../lib/speicher';
import { usePortal } from '../portal';

interface Gemerkt {
  name: string;
  url: string;
}

const LEER: UtmEingabe = { url: '', source: '', medium: '', campaign: '', content: '', term: '' };
const VORSCHLAEGE = {
  source: ['instagram', 'facebook', 'tiktok', 'newsletter', 'google', 'pinterest'],
  medium: ['social', 'email', 'cpc', 'paid-social', 'influencer', 'qr-code'],
};

export function Utm() {
  const { daten } = usePortal();
  const toast = useToast();
  const key = `velonify-portal.utm.${daten.kunde.kuerzel || daten.kunde.name}`;
  const [e, setE] = useState<UtmEingabe>(LEER);
  const [gemerkt, setGemerkt] = useState<Gemerkt[]>(() => {
    try {
      return JSON.parse(speicher.lies(key) ?? '[]') as Gemerkt[];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    speicher.schreib(key, JSON.stringify(gemerkt.slice(0, 30)));
  }, [key, gemerkt]);

  if (!daten.werkzeuge.includes('utm')) {
    return (
      <div className="seite einspaltig">
        <div className="alles-gut">Der UTM-Generator ist für euch gerade nicht freigeschaltet.</div>
      </div>
    );
  }

  const link = baueUtmLink(e);
  const urlFalsch = e.url.trim() !== '' && !zielUrl(e.url);
  const setze = (feld: keyof UtmEingabe) => (ev: { target: { value: string } }) => setE({ ...e, [feld]: ev.target.value });
  const basis = link ? link.split('?')[0] : '';
  const rest = link ? link.slice(basis.length) : '';

  async function kopieren(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast({ text: 'Link kopiert.' });
    } catch {
      toast({ text: 'Kopieren ging nicht. Markier den Link und kopier ihn von Hand.', fehler: true });
    }
  }

  const feld = (id: keyof UtmEingabe, label: string, hint: string, extra: Record<string, unknown> = {}) => (
    <div className="feld">
      <label htmlFor={`u-${id}`}>{label}</label>
      <input id={`u-${id}`} value={e[id]} onChange={setze(id)} autoComplete="off" autoCapitalize="none" spellCheck={false} {...extra} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );

  return (
    <div className="seite breit">
      <div className="haupt">
        <div className="kopf">
          <a className="textlink" href={pfadVon({ seite: 'werkzeuge' })}>← Werkzeuge</a>
          <h1 style={{ marginTop: 10 }}>UTM-Generator</h1>
          <p>Häng das an jeden Link in Newsletter, Posts oder Anzeigen. Dann sehen wir in Google Analytics, woher Besucher und Umsatz kommen.</p>
        </div>
        <div className="utm">
          <form className="panel form" onSubmit={(ev) => ev.preventDefault()}>
            <div className="feld">
              <label htmlFor="u-url">Ziel-Link</label>
              <input id="u-url" type="url" inputMode="url" value={e.url} onChange={setze('url')} placeholder="https://euer-shop.de/collections/neu" autoComplete="off" autoCapitalize="none" spellCheck={false} aria-invalid={urlFalsch} />
              <span className={urlFalsch ? 'fehler-text' : 'hint'}>{urlFalsch ? 'Das sieht nicht wie eine Web-Adresse aus.' : 'Die Seite in eurem Shop, auf die der Link führt.'}</span>
            </div>
            <div className="zwei">
              {feld('source', 'Quelle (source)', 'Woher: instagram, newsletter …', { list: 'utm-source', placeholder: 'instagram' })}
              {feld('medium', 'Medium (medium)', 'Welche Art: social, email, cpc …', { list: 'utm-medium', placeholder: 'social' })}
            </div>
            {feld('campaign', 'Kampagne (campaign)', 'z. B. black-week-2026. Wir machen klein und mit Bindestrichen daraus.', { placeholder: 'black-week-2026' })}
            <div className="zwei">
              {feld('content', 'Variante (content)', 'optional, z. B. story oder banner-oben')}
              {feld('term', 'Suchbegriff (term)', 'optional, nur für bezahlte Suche')}
            </div>
            <datalist id="utm-source">{VORSCHLAEGE.source.map((v) => <option key={v} value={v} />)}</datalist>
            <datalist id="utm-medium">{VORSCHLAEGE.medium.map((v) => <option key={v} value={v} />)}</datalist>
          </form>
          <div className="panel">
            <b>Dein Link</b>
            <div className={`ergebnis${link ? '' : ' leer-erg'}`} aria-live="polite">
              {link ? (
                <>
                  {basis}
                  <span className="p">{rest}</span>
                </>
              ) : (
                'Ziel-Link, Quelle, Medium und Kampagne ausfüllen.'
              )}
            </div>
            <div className="aktionen">
              <button className="btn" type="button" disabled={!link} onClick={() => link && void kopieren(link)}>
                <Icon name="kopie" />
                Kopieren
              </button>
              <button
                className="btn zweit"
                type="button"
                disabled={!link}
                onClick={() => {
                  if (!link) return;
                  setGemerkt((g) => [{ name: [e.campaign, e.source, e.content].filter(Boolean).join(' · '), url: link }, ...g.filter((x) => x.url !== link)]);
                  toast({ text: 'Gemerkt. Nur in diesem Browser.' });
                }}
              >
                Merken
              </button>
              <button className="btn leise" type="button" onClick={() => setE(LEER)}>
                Leeren
              </button>
            </div>
            {gemerkt.length > 0 && (
              <div className="gemerkt">
                <span className="unterkopf">Gemerkt</span>
                {gemerkt.map((g) => (
                  <div className="gemerkt-zeile" key={g.url}>
                    <div style={{ minWidth: 0 }}>
                      <b className="klein">{g.name}</b>
                      <code>{g.url}</code>
                    </div>
                    <button className="ikon-btn" type="button" aria-label={`${g.name} kopieren`} onClick={() => void kopieren(g.url)}>
                      <Icon name="kopie" />
                    </button>
                    <button className="ikon-btn" type="button" aria-label={`${g.name} entfernen`} onClick={() => setGemerkt((x) => x.filter((y) => y.url !== g.url))}>
                      <Icon name="muell" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
