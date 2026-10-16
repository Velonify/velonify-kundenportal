import { useState, type FormEvent } from 'react';
import type { Kanal, PortalEinstellungen, UpdateRhythmus } from '../api/vertrag';
import { usePortal } from '../portal';

const RHYTHMEN: { wert: UpdateRhythmus; titel: string; s: string }[] = [
  { wert: 'taeglich', titel: 'Täglich', s: 'werktags um 8 Uhr' },
  { wert: 'woechentlich', titel: 'Wöchentlich', s: 'montags um 8 Uhr' },
  { wert: 'monatlich', titel: 'Monatlich', s: 'am 1. des Monats um 8 Uhr' },
  { wert: 'aus', titel: 'Keine Updates', s: 'du schaust selbst ins Portal' },
];

const STANDARD: PortalEinstellungen = { updates: 'woechentlich', kanal_updates: 'email', kanal_hinweise: 'email' };

/** How often the contact gets a summary, and where summaries and instant notifications go. */
export function Einstellungen() {
  const p = usePortal();
  const { daten } = p;
  const gespeichert = daten.einstellungen ?? STANDARD;
  const [wahl, setWahl] = useState<PortalEinstellungen>(gespeichert);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');
  const [ok, setOk] = useState(false);
  const team = !!daten.vorschau;
  const geaendert = JSON.stringify(wahl) !== JSON.stringify(gespeichert);

  async function speichern(e: FormEvent) {
    e.preventDefault();
    setFehler('');
    setOk(false);
    setLaeuft(true);
    try {
      await p.api.einstellungen(wahl);
      await p.neuLaden();
      setOk(true);
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Das hat nicht geklappt.');
    } finally {
      setLaeuft(false);
    }
  }

  const kanalWahl = (name: 'kanal_updates' | 'kanal_hinweise', legende: string) => (
    <fieldset className="feld" style={{ border: 0, padding: 0, margin: 0 }} disabled={team}>
      <legend className="lbl" style={{ marginBottom: 6 }}>{legende}</legend>
      <div className="wahl">
        {(
          [
            ['email', 'E-Mail', daten.ich.email || 'an deine Adresse'],
            ['slack', 'Slack', daten.slack ? `in #${daten.slack.channel}` : 'kein Slack-Channel eingerichtet'],
            ['beide', 'E-Mail und Slack', 'beides'],
          ] as [Kanal, string, string][]
        ).map(([wert, titel, s]) => (
          <label key={wert} aria-disabled={wert !== 'email' && !daten.slack}>
            <input type="radio" name={name} checked={wahl[name] === wert} disabled={wert !== 'email' && !daten.slack} onChange={() => setWahl({ ...wahl, [name]: wert })} />
            <span className="rad" />
            <span><strong>{titel}</strong> <span className="s">· {s}</span></span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="seite einspaltig">
      <div className="haupt">
        <div className="kopf">
          <h1>Benachrichtigungen</h1>
          <p>Wie oft und wo du von uns hörst. Das gilt nur für dich, jede Person stellt es selbst ein.</p>
        </div>

        {team && (
          <div className="meldung info">
            Diese Einstellungen gehören zur jeweiligen Person. Im Hub kannst du sie unter „Portal“ für jeden Kontakt ändern.
          </div>
        )}

        <form className="form block" onSubmit={speichern}>
          <section className="einstellung">
            <h2>Updates</h2>
            <p className="muted">Eine Zusammenfassung: was erledigt ist, was auf dich wartet und woran wir gerade arbeiten. Gibt es nichts zu berichten, schicken wir nichts.</p>
            <fieldset className="feld" style={{ border: 0, padding: 0, margin: 0 }} disabled={team}>
              <legend className="lbl" style={{ marginBottom: 6 }}>Wie oft?</legend>
              <div className="wahl">
                {RHYTHMEN.map((r) => (
                  <label key={r.wert}>
                    <input type="radio" name="updates" checked={wahl.updates === r.wert} onChange={() => setWahl({ ...wahl, updates: r.wert })} />
                    <span className="rad" />
                    <span><strong>{r.titel}</strong> <span className="s">· {r.s}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            {wahl.updates !== 'aus' && kanalWahl('kanal_updates', 'Wohin?')}
          </section>

          <section className="einstellung">
            <h2>Sofort-Benachrichtigungen</h2>
            <p className="muted">Kommen sofort, wenn etwas Wichtiges passiert: eine neue Datei von uns, ein erreichter Meilenstein, etwas wartet auf deine Freigabe, das Team hat geantwortet, eine Neuigkeit. Sie lassen sich nicht abschalten, nur umleiten.</p>
            {kanalWahl('kanal_hinweise', 'Wohin?')}
          </section>

          {daten.slack && (wahl.kanal_updates !== 'email' || wahl.kanal_hinweise !== 'email') && (
            <div className="meldung info">Nachrichten in Slack sehen alle in #{daten.slack.channel}, nicht nur du.</div>
          )}
          {fehler && <div className="meldung fehler" role="alert">{fehler}</div>}
          {ok && !geaendert && <div className="meldung info" role="status">Gespeichert.</div>}
          {!team && (
            <div>
              <button className="btn" type="submit" disabled={laeuft || !geaendert}>
                {laeuft ? 'Speichert …' : 'Speichern'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
