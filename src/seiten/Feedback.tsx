import { useId, useState } from 'react';
import type { FeedbackAnlass } from '../api/vertrag';
import { Blatt } from '../components/Blatt';
import { Icon } from '../components/Icon';
import { usePortal } from '../portal';

const STUFEN = ['', 'Gar nicht zufrieden', 'Eher unzufrieden', 'Geht so', 'Zufrieden', 'Begeistert'];

/** 1–5 stars as a radio group: arrow keys move, every star has its word for screen readers and on hover. */
export function Sterne({ wert, onChange, name, disabled }: { wert: number | null; onChange: (n: number) => void; name: string; disabled?: boolean }) {
  const [hover, setHover] = useState(0);
  const zeigen = hover || wert || 0;
  return (
    <div className="sterne-wahl" role="radiogroup" aria-label="Bewertung von 1 bis 5 Sternen" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className={n <= zeigen ? 'an' : ''} onMouseEnter={() => !disabled && setHover(n)} title={STUFEN[n]}>
          <input type="radio" className="sr" name={name} value={n} checked={wert === n} disabled={disabled} onChange={() => onChange(n)} />
          <span aria-hidden="true">★</span>
          <span className="sr">{`${n} ${n === 1 ? 'Stern' : 'Sterne'}: ${STUFEN[n]}`}</span>
        </label>
      ))}
      <span className="sterne-wort" aria-hidden="true">{zeigen ? STUFEN[zeigen] : ''}</span>
    </div>
  );
}

/** At 5 stars: thanks, and the Google review link when the hub has one. */
function Begeistert() {
  const { daten } = usePortal();
  const url = daten.feedback?.bewertung_url;
  return (
    <div className="feedback-danke begeistert">
      <p>
        <b>Das freut uns riesig, danke!</b>
        {url ? ' Magst du das auch anderen erzählen? Eine kurze Google-Bewertung hilft uns sehr.' : ''}
      </p>
      {url && (
        <a className="btn zweit" href={url} target="_blank" rel="noopener noreferrer">
          <Icon name="stern" /> Auf Google bewerten ↗
        </a>
      )}
    </div>
  );
}

/**
 * A rating question: stars, then an optional comment, sent with one click. After sending (or when this contact rated
 * it before) only a thank-you remains. In the team access everything shows, but nothing is sent.
 */
export function FeedbackFrage({ anlass, bezugId, frage, kompakt = false }: { anlass: Exclude<FeedbackAnlass, 'frei'>; bezugId: string; frage: string; kompakt?: boolean }) {
  const p = usePortal();
  const id = useId();
  const schluessel = `${anlass}:${bezugId}`;
  const [sterne, setSterne] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [zitat, setZitat] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [gesendet, setGesendet] = useState<number | null>(null);
  const team = !!p.daten.vorschau;

  if (gesendet === 5) return <Begeistert />;
  if (gesendet !== null || p.daten.feedback?.gegeben.includes(schluessel)) {
    return (
      <div className="feedback-danke">
        <Icon name="check" /> Danke für dein Feedback{gesendet !== null && gesendet <= 3 ? ' – wir melden uns bei dir.' : '!'}
      </div>
    );
  }

  const senden = async () => {
    if (!sterne) return;
    setLaeuft(true);
    try {
      await p.api.feedback({ anlass, bezug_id: bezugId, sterne, text: text.trim(), zitat_ok: sterne === 5 && !!text.trim() && zitat });
      setGesendet(sterne);
      p.merkeFeedback(schluessel);
    } catch (err) {
      p.fehler(err);
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <div className={`feedback-frage${kompakt ? ' kompakt' : ''}`}>
      <span className="frage" id={`${id}-f`}>{frage}</span>
      <Sterne wert={sterne} onChange={setSterne} name={`${id}-s`} disabled={laeuft} />
      {sterne !== null && (
        <>
          <textarea
            rows={kompakt ? 2 : 3}
            maxLength={3000}
            value={text}
            aria-labelledby={`${id}-f`}
            placeholder={sterne <= 3 ? 'Was hätten wir besser machen können?' : 'Möchtest du noch etwas dazu sagen? (optional)'}
            onChange={(e) => setText(e.target.value)}
          />
          {sterne === 5 && text.trim() && (
            <label className="zitat-ok">
              <input type="checkbox" checked={zitat} onChange={(e) => setZitat(e.target.checked)} />
              Velonify darf meinen Kommentar als Kundenstimme zeigen (mit Vorname und Firma).
            </label>
          )}
          <div className="aktionen">
            <button className="btn" type="button" onClick={() => void senden()} disabled={laeuft || team}>
              {laeuft && <span className="lade" aria-hidden="true" />}
              Feedback senden
            </button>
            {team && <span className="muted klein">Im Team-Zugang nur zur Ansicht – Feedback gibt der Kunde.</span>}
          </div>
        </>
      )}
    </div>
  );
}

/** "Feedback an Velonify" from the menu: praise, criticism or ideas, at any time; stars optional. */
export function FeedbackBlatt({ onClose }: { onClose: () => void }) {
  const p = usePortal();
  const id = useId();
  const [sterne, setSterne] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [zitat, setZitat] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');
  const [gesendet, setGesendet] = useState<number | null | undefined>(undefined);
  const team = !!p.daten.vorschau;

  const senden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return setFehler('Schreib uns bitte ein paar Worte.');
    setLaeuft(true);
    try {
      await p.api.feedback({ anlass: 'frei', bezug_id: '', sterne, text: text.trim(), zitat_ok: sterne === 5 && zitat });
      setGesendet(sterne);
    } catch (err) {
      p.fehler(err);
    } finally {
      setLaeuft(false);
    }
  };

  return (
    <Blatt titel="Wie läuft es mit uns?" oben={<span className="unterkopf">Feedback an Velonify</span>} onClose={onClose} fokus={`#${CSS.escape(id)}-t`}>
      <div className="blatt-inhalt">
        {gesendet !== undefined ? (
          <>
            {gesendet === 5 ? <Begeistert /> : <div className="feedback-danke"><Icon name="check" /> Danke! {p.daten.team.join(' und ') || 'Das Team'} liest es sich an.</div>}
            <div className="aktionen">
              <button className="btn zweit" type="button" onClick={onClose}>Schließen</button>
            </div>
          </>
        ) : (
          <form className="form" onSubmit={senden} noValidate>
            <p className="muted">Lob, Kritik oder eine Idee – alles hilft uns, besser zu werden. Es lesen die Leute, die dein Projekt betreuen.</p>
            <div className="feld">
              <span className="lbl">Wie zufrieden bist du insgesamt? <span className="muted">(optional)</span></span>
              <Sterne wert={sterne} onChange={setSterne} name={`${id}-s`} />
            </div>
            <div className="feld">
              <label htmlFor={`${id}-t`}>Deine Nachricht</label>
              <textarea id={`${id}-t`} rows={5} maxLength={3000} value={text} aria-invalid={!!fehler} onChange={(e) => { setText(e.target.value); setFehler(''); }} />
              {fehler && <span className="fehler-text">{fehler}</span>}
            </div>
            {sterne === 5 && text.trim() && (
              <label className="zitat-ok">
                <input type="checkbox" checked={zitat} onChange={(e) => setZitat(e.target.checked)} />
                Velonify darf meinen Kommentar als Kundenstimme zeigen (mit Vorname und Firma).
              </label>
            )}
            <div className="aktionen">
              <button className="btn" type="submit" disabled={laeuft || team}>
                {laeuft && <span className="lade" aria-hidden="true" />}
                Feedback senden
              </button>
              {team && <span className="muted klein">Im Team-Zugang nur zur Ansicht.</span>}
            </div>
          </form>
        )}
      </div>
    </Blatt>
  );
}
