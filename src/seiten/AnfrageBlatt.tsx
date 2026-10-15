import { useRef, useState, type FormEvent } from 'react';
import { MAX_UPLOAD_BYTES, type PortalDatei } from '../api/vertrag';
import { zuGross } from '../api/client';
import { Blatt } from '../components/Blatt';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { KONTAKT } from '../konfig';
import { usePortal } from '../portal';

interface Anhang {
  name: string;
  anteil: number;
  datei?: PortalDatei;
  fehler?: string;
}

export function AnfrageBlatt({ onClose }: { onClose: () => void }) {
  const p = usePortal();
  const toast = useToast();
  const [titel, setTitel] = useState('');
  const [details, setDetails] = useState('');
  const [dringend, setDringend] = useState(false);
  const [anhaenge, setAnhaenge] = useState<Anhang[]>([]);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');
  const eingabe = useRef<HTMLInputElement>(null);
  const laedtHoch = anhaenge.some((a) => !a.datei && !a.fehler);

  function hochladen(dateien: FileList | null) {
    for (const datei of dateien ? [...dateien] : []) {
      if (datei.size > MAX_UPLOAD_BYTES) {
        setAnhaenge((a) => [...a, { name: datei.name, anteil: 0, fehler: zuGross(datei.name) }]);
        continue;
      }
      setAnhaenge((a) => [...a, { name: datei.name, anteil: 0 }]);
      const setze = (teil: Partial<Anhang>) => setAnhaenge((a) => a.map((x) => (x.name === datei.name && !x.datei && !x.fehler ? { ...x, ...teil } : x)));
      p.api
        .hochladen(datei, (anteil) => setze({ anteil }))
        .then((neu) => {
          setze({ datei: neu, anteil: 1 });
          p.fuegeDateiHinzu(neu);
        })
        .catch((err) => setze({ fehler: err instanceof Error ? err.message : 'Hochladen fehlgeschlagen.' }));
    }
    if (eingabe.current) eingabe.current.value = '';
  }

  async function senden(e: FormEvent) {
    e.preventDefault();
    if (!titel.trim()) {
      setFehler('Bitte schreib kurz, worum es geht.');
      document.getElementById('a-titel')?.focus();
      return;
    }
    setLaeuft(true);
    try {
      const karte = await p.api.anfrage({ titel: titel.trim(), details: details.trim(), dringend, datei_ids: anhaenge.flatMap((a) => (a.datei ? [a.datei.id] : [])) });
      p.ersetzeKarte(karte);
      toast({ text: 'Anfrage gesendet. Du findest sie unter Projekt.', aktion: { titel: 'Ansehen', tun: () => p.oeffneKarte(karte.id) } });
      onClose();
    } catch (err) {
      p.fehler(err);
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <Blatt titel="Was können wir für dich tun?" oben={<span className="unterkopf">Neue Anfrage</span>} onClose={onClose} fokus="#a-titel">
      <form className="blatt-inhalt form" onSubmit={senden} noValidate>
        <div className="feld">
          <label htmlFor="a-titel">Worum geht es?</label>
          <input
            id="a-titel"
            maxLength={200}
            value={titel}
            aria-invalid={!!fehler}
            aria-describedby={fehler ? 'a-titel-fehler' : undefined}
            placeholder="z. B. Bilder auf der Startseite laden langsam"
            onChange={(e) => {
              setTitel(e.target.value);
              setFehler('');
            }}
          />
          {fehler && <span className="fehler-text" id="a-titel-fehler">{fehler}</span>}
        </div>
        <div className="feld">
          <label htmlFor="a-text">Details</label>
          <textarea id="a-text" rows={5} maxLength={5000} value={details} placeholder="Wo passiert es, was hast du erwartet? Ein Link oder Screenshot hilft." onChange={(e) => setDetails(e.target.value)} />
        </div>
        <fieldset className="feld" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="lbl" style={{ marginBottom: 6 }}>Wie dringend?</legend>
          <div className="wahl">
            <label>
              <input type="radio" name="dringend" checked={!dringend} onChange={() => setDringend(false)} />
              <span className="rad" />
              <span><strong>Normal</strong> <span className="s">· wir planen es ein</span></span>
            </label>
            <label>
              <input type="radio" name="dringend" checked={dringend} onChange={() => setDringend(true)} />
              <span className="rad" />
              <span><strong>Dringend</strong> <span className="s">· der Shop oder Umsatz ist betroffen</span></span>
            </label>
          </div>
        </fieldset>
        {dringend && (
          <div className="meldung warn">
            <Icon name="tel" />
            <span>Kunden können gerade nicht kaufen? Ruf uns zusätzlich an: <a href={KONTAKT.telefonLink} style={{ fontWeight: 800 }}>{KONTAKT.telefon}</a></span>
          </div>
        )}
        <div className="feld">
          <span className="lbl">Anhänge</span>
          <label className="dropzone klein">
            <span className="box"><Icon name="hoch" /></span>
            <span><b>Screenshot oder Datei anhängen</b><br /><span className="muted klein">optional · bis 25 MB je Datei</span></span>
            <input ref={eingabe} className="sr" type="file" multiple onChange={(e) => hochladen(e.target.files)} />
          </label>
          {anhaenge.length > 0 && (
            <div className="anhaenge">
              {anhaenge.map((a, i) => (
                <div className="anhang" key={i}>
                  <Icon name={a.fehler ? 'warn' : a.datei ? 'check' : 'hoch'} />
                  <span className="name">
                    {a.name}
                    {a.fehler && <span className="fehler-text" style={{ display: 'block', fontWeight: 600 }}>{a.fehler}</span>}
                    {!a.datei && !a.fehler && <span className="fortschritt"><i style={{ width: `${Math.round(a.anteil * 100)}%` }} /></span>}
                  </span>
                  <button className="ikon-btn" style={{ width: 32, height: 32 }} type="button" aria-label={`${a.name} entfernen`} onClick={() => setAnhaenge((x) => x.filter((_, j) => j !== i))}>
                    <Icon name="x" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="aktionen">
          <button className="btn" type="submit" disabled={laeuft || laedtHoch}>
            {laeuft && <span className="lade" aria-hidden="true" />}
            Anfrage senden
          </button>
          <span className="muted klein">{laedtHoch ? 'Anhänge werden noch hochgeladen …' : `Landet direkt bei ${p.daten.team.join(' und ') || 'uns'} im Projekt.`}</span>
        </div>
      </form>
    </Blatt>
  );
}
