import { useState, type FormEvent } from 'react';
import type { PortalApi } from '../api/vertrag';
import { Icon, Logo } from '../components/Icon';
import { KONTAKT, RECHTLICHES } from '../konfig';

export function Login(props: { api: PortalApi; hinweis?: string; demoAnmelden?: () => void }) {
  const [email, setEmail] = useState('');
  const [gesendet, setGesendet] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');

  async function senden(e?: FormEvent) {
    e?.preventDefault();
    setFehler('');
    setLaeuft(true);
    try {
      await props.api.anmelden(email.trim());
      setGesendet(true);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Das hat nicht geklappt.');
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div className="login">
      <div className="login-links">
        <a className="marke" href="https://velonify.de" aria-label="Velonify">
          <Logo /> VELONIFY
        </a>
        <div>
          <h1>
            Dein Shop-Projekt.
            <br />
            Alles an einem Ort.
          </h1>
          <p>Sieh, woran wir arbeiten, gib Entwürfe frei und schick uns Dateien und Wünsche.</p>
        </div>
        <div className="drei">
          <div><Icon name="check" /><span><b>Freigeben</b> mit einem Klick</span></div>
          <div><Icon name="projekt" /><span><b>Stand</b> jederzeit sehen</span></div>
          <div><Icon name="datei" /><span><b>Dateien</b> an einem Ort</span></div>
        </div>
      </div>
      <main className="login-rechts">
        <div className="login-box">
          {gesendet ? (
            <>
              <span className="post-icon"><Icon name="post" /></span>
              <h2>Schau in dein Postfach</h2>
              <p className="muted" aria-live="polite">
                Wenn <b style={{ color: 'var(--ink)', overflowWrap: 'anywhere' }}>{email.trim()}</b> bei uns freigeschaltet ist, kommt gleich eine Mail von {KONTAKT.email} mit deinem Anmeldelink. Er gilt 15 Minuten.
              </p>
              {props.demoAnmelden && (
                <button className="btn" type="button" onClick={props.demoAnmelden}>
                  Demo: Link aus der Mail öffnen
                </button>
              )}
              <p className="muted klein">
                Nichts angekommen? Schau im Spam-Ordner nach oder{' '}
                <button className="textlink" type="button" disabled={laeuft} onClick={() => void senden()}>
                  schick ihn nochmal
                </button>
                . Klappt es gar nicht, schreib uns an <a href={`mailto:${KONTAKT.email}`}>{KONTAKT.email}</a>.
              </p>
              <button className="textlink" type="button" style={{ justifySelf: 'start' }} onClick={() => setGesendet(false)}>
                Andere E-Mail-Adresse
              </button>
            </>
          ) : (
            <>
              <div>
                <h2>Anmelden</h2>
                <p className="muted" style={{ marginTop: 6 }}>Ohne Passwort. Wir schicken dir einen Link per E-Mail.</p>
              </div>
              {props.hinweis && <div className="meldung info" role="status"><Icon name="info" />{props.hinweis}</div>}
              <form className="form" onSubmit={senden} noValidate>
                <div className="feld">
                  <label htmlFor="mail">E-Mail-Adresse</label>
                  <input
                    id="mail"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    aria-invalid={!!fehler}
                    aria-describedby={fehler ? 'mail-fehler' : undefined}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {fehler && <span className="fehler-text" id="mail-fehler">{fehler}</span>}
                </div>
                <button className="btn" type="submit" disabled={laeuft || !email.trim()}>
                  {laeuft && <span className="lade" aria-hidden="true" />}
                  Anmeldelink schicken
                </button>
              </form>
              <p className="muted klein">Noch kein Zugang? Deine Ansprechperson bei Velonify schaltet dich frei.</p>
            </>
          )}
          <div className="login-fuss">
            <a href={RECHTLICHES.impressum} target="_blank" rel="noopener noreferrer">Impressum</a>
            <a href={RECHTLICHES.datenschutz} target="_blank" rel="noopener noreferrer">Datenschutz</a>
          </div>
        </div>
      </main>
    </div>
  );
}
