import { useState } from 'react';
import { Blatt } from '../components/Blatt';
import { Icon } from '../components/Icon';
import { einbettAdresse } from '../lib/termin';
import { usePortal } from '../portal';

/** "Termin buchen": the booking page of a team member inside the portal, or a button to open it when it cannot be embedded. */
export function TerminBlatt({ person, link, onClose }: { person: string; link: string; onClose: () => void }) {
  const { daten } = usePortal();
  const [geladen, setGeladen] = useState(false);
  const name = `${daten.ich.vorname} ${daten.ich.nachname}`.trim();
  // In the team access the "contact" is the team member; nothing to fill in for the client then.
  const adresse = einbettAdresse(link, daten.vorschau ? { name: '', email: '' } : { name, email: daten.ich.email }, location.host);
  const extern = (
    <a className="textlink" href={link} target="_blank" rel="noopener noreferrer">
      In neuem Tab öffnen ↗
    </a>
  );

  return (
    <Blatt titel={`Termin mit ${person}`} oben={<span className="unterkopf">Termin buchen</span>} onClose={onClose} breit>
      {adresse ? (
        <div className="termin-rahmen">
          {!geladen && (
            <div className="termin-laedt" aria-hidden="true">
              <span className="lade" /> Freie Termine werden geladen …
            </div>
          )}
          <iframe src={adresse} title={`Buchungskalender von ${person}`} onLoad={() => setGeladen(true)} allow="payment" />
          <p className="termin-fuss muted klein">
            Du bekommst die Bestätigung mit dem Link zum Call per E-Mail. Lädt der Kalender nicht? {extern}
          </p>
        </div>
      ) : (
        <div className="blatt-inhalt">
          <p>Wähl auf der Buchungsseite von {person} einen freien Termin. Die Bestätigung mit dem Link zum Call kommt per E-Mail.</p>
          <a className="btn" href={link} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            <Icon name="kalender" /> Buchungsseite öffnen ↗
          </a>
        </div>
      )}
    </Blatt>
  );
}
