import { useState, type FormEvent } from 'react';
import type { PortalKarte } from '../api/vertrag';
import { FeedbackFrage } from './Feedback';
import { Blatt } from '../components/Blatt';
import { Icon } from '../components/Icon';
import { Text } from '../components/Text';
import { initialen, PHASE_TITEL } from '../lib/ansicht';
import { datumKurz, datumRelativ, uhrzeit } from '../lib/datum';
import { usePortal } from '../portal';
import { useToast } from '../components/Toast';

const MAX_TEXT = 5000;

export function KarteBlatt({ karte, aendern, onClose }: { karte: PortalKarte; aendern?: boolean; onClose: () => void }) {
  const p = usePortal();
  const toast = useToast();
  const [notiz, setNotiz] = useState('');
  const [notizFehler, setNotizFehler] = useState('');
  const [nachricht, setNachricht] = useState('');
  const [laeuft, setLaeuft] = useState<'' | 'frei' | 'aenderung' | 'kommentar'>('');
  const imUndo = p.gerade.find((g) => g.id === karte.id && g.wartet);
  const offen = karte.phase === 'wartet' && !imUndo;
  const fertig = karte.checkliste.filter((c) => c.erledigt).length;

  async function entscheide(entscheidung: 'freigegeben' | 'aenderung') {
    if (entscheidung === 'aenderung' && !notiz.trim()) {
      setNotizFehler('Bitte schreib kurz, was anders sein soll.');
      document.getElementById('b-notiz')?.focus();
      return;
    }
    setLaeuft(entscheidung === 'freigegeben' ? 'frei' : 'aenderung');
    try {
      const neu = await p.api.freigabe(karte.id, entscheidung, notiz.trim());
      p.ersetzeKarte(neu);
      p.merkeErledigt(karte, entscheidung);
      toast({ text: entscheidung === 'freigegeben' ? 'Freigegeben, das Team macht weiter.' : `Dein Änderungswunsch ist bei ${karte.zustaendig.join(' und ') || 'uns'}.` });
      onClose();
    } catch (err) {
      p.fehler(err);
    } finally {
      setLaeuft('');
    }
  }

  async function schreibe(e: FormEvent) {
    e.preventDefault();
    if (!nachricht.trim()) return;
    setLaeuft('kommentar');
    try {
      p.ersetzeKarte(await p.api.kommentar(karte.id, nachricht.trim()));
      setNachricht('');
      toast({ text: 'Nachricht gesendet.' });
    } catch (err) {
      p.fehler(err);
    } finally {
      setLaeuft('');
    }
  }

  const statusPill = offen ? 'himmel' : karte.phase === 'erledigt' ? 'ok' : karte.freigabe === 'aenderung' ? 'warn' : '';
  const statusText = imUndo ? 'Freigegeben' : karte.phase !== 'erledigt' && karte.freigabe === 'aenderung' ? 'Änderung gewünscht' : PHASE_TITEL[karte.phase];

  return (
    <Blatt titel={karte.titel} oben={<span className={`pill ${statusPill}`}>{statusText}</span>} onClose={onClose} fokus={aendern && offen ? '#b-notiz' : undefined}>
      <div className="blatt-inhalt">
        <div className="fakten">
          {karte.zustaendig.length > 0 && <div><span>Zuständig</span><b>{karte.zustaendig.join(', ')}</b></div>}
          {karte.phase === 'erledigt' ? (
            karte.erledigt_am && <div><span>Erledigt am</span><b>{datumKurz(karte.erledigt_am)}</b></div>
          ) : (
            <div><span>Fällig</span><b>{karte.faellig_am ? datumRelativ(karte.faellig_am) : 'noch offen'}</b></div>
          )}
          {karte.anfrage && <div><span>Herkunft</span><b>Eure Anfrage</b></div>}
          {karte.freigabe === 'freigegeben' && karte.freigabe_am && <div><span>Freigegeben</span><b>{datumKurz(karte.freigabe_am)}</b></div>}
        </div>

        {karte.beschreibung && <Text text={karte.beschreibung} />}

        {karte.checkliste.length > 0 && (
          <div style={{ display: 'grid', gap: 10 }}>
            <span className="unterkopf">Checkliste {fertig}/{karte.checkliste.length}</span>
            <ul className="check">
              {karte.checkliste.map((c, i) => (
                <li key={i} className={c.erledigt ? 'ja' : ''}>
                  <span className="k">{c.erledigt && <Icon name="check" />}</span>
                  {c.text}
                  <span className="sr">{c.erledigt ? '(erledigt)' : '(offen)'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {offen && (
          <div className="freigabe">
            <b>Passt das so?</b>
            <div className="feld">
              <label htmlFor="b-notiz">Anmerkung {aendern ? '' : '(optional beim Freigeben)'}</label>
              <textarea
                id="b-notiz"
                rows={3}
                maxLength={MAX_TEXT}
                value={notiz}
                aria-invalid={!!notizFehler}
                aria-describedby={notizFehler ? 'b-notiz-fehler' : undefined}
                placeholder="Bei „Änderung wünschen“ bitte kurz, was anders sein soll"
                onChange={(e) => {
                  setNotiz(e.target.value);
                  setNotizFehler('');
                }}
              />
              {notizFehler && <span className="fehler-text" id="b-notiz-fehler">{notizFehler}</span>}
            </div>
            <div className="aktionen">
              <button className="btn" type="button" disabled={!!laeuft} onClick={() => void entscheide('freigegeben')}>
                {laeuft === 'frei' ? <span className="lade" aria-hidden="true" /> : <Icon name="check" />}
                Freigeben
              </button>
              <button className="btn zweit" type="button" disabled={!!laeuft} onClick={() => void entscheide('aenderung')}>
                {laeuft === 'aenderung' && <span className="lade" aria-hidden="true" />}
                Änderung wünschen
              </button>
            </div>
          </div>
        )}

        {karte.phase === 'erledigt' && <FeedbackFrage anlass="karte" bezugId={karte.id} frage="Wie zufrieden bist du mit dem Ergebnis?" kompakt />}

        <div style={{ display: 'grid', gap: 14 }}>
          <span className="unterkopf">Gespräch</span>
          <div className="verlauf">
            {karte.kommentare.length === 0 && <span className="muted klein">Noch nichts geschrieben.</span>}
            {karte.kommentare.map((c, i) => (
              <div className="kom" key={i}>
                <span className={`av klein${c.team ? ' team' : ''}`}>{initialen(c.von)}</span>
                <div>
                  <div className="wer">
                    {c.ich ? 'Du' : c.von}{' '}
                    <span>
                      {c.team ? 'Velonify · ' : ''}
                      {datumRelativ(c.datum)}
                      {uhrzeit(c.datum) ? `, ${uhrzeit(c.datum)}` : ''}
                    </span>
                  </div>
                  <Text text={c.text} className="" />
                </div>
              </div>
            ))}
          </div>
          {!offen && (
            <form className="form" onSubmit={schreibe}>
              <div className="feld">
                <label htmlFor="b-kom">Nachricht{karte.zustaendig.length ? ` an ${karte.zustaendig.join(' und ')}` : ''}</label>
                <textarea id="b-kom" rows={3} maxLength={MAX_TEXT} value={nachricht} onChange={(e) => setNachricht(e.target.value)} />
              </div>
              <div>
                <button className="btn zweit" type="submit" disabled={!nachricht.trim() || !!laeuft}>
                  {laeuft === 'kommentar' && <span className="lade" aria-hidden="true" />}
                  Senden
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Blatt>
  );
}
