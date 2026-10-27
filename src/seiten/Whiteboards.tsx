import { useEffect, useState } from 'react';
import type { PortalWhiteboard } from '../api/vertrag';
import { datumRelativ } from '../lib/datum';
import { pfadVon } from '../lib/route';
import { usePortal } from '../portal';

/** The whiteboards the team shares, below the files. Nothing shows while there are none. */
export function WhiteboardListe() {
  const { api } = usePortal();
  const [boards, setBoards] = useState<PortalWhiteboard[] | null>(null);
  useEffect(() => {
    let weg = false;
    api.whiteboards().then(
      (b) => !weg && setBoards(b),
      () => !weg && setBoards([]),
    );
    return () => {
      weg = true;
    };
  }, [api]);
  if (!boards || boards.length === 0) return null;
  return (
    <div className="block wb-liste">
      <h2>Whiteboards</h2>
      <p className="muted klein">Skizzen, Sitemaps und Abläufe, an denen wir mit euch arbeiten. Zum Ansehen, zoomen und durchklicken.</p>
      <div className="wb-kacheln">
        {boards.map((b) => (
          <a key={b.id} className="wb-kachel" href={pfadVon({ seite: 'whiteboard', id: b.id })}>
            <span className="wb-bild">{b.vorschau ? <img src={b.vorschau} alt="" loading="lazy" /> : <span className="wb-raster" aria-hidden="true" />}</span>
            <span className="wb-text">
              <b>{b.titel}</b>
              <span className="muted klein">{b.geaendert_am ? `zuletzt geändert ${datumRelativ(b.geaendert_am)}` : ''}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
