import { Icon } from '../components/Icon';
import { WERKZEUGE } from '../konfig';
import { pfadVon } from '../lib/route';
import { usePortal } from '../portal';

export function Werkzeuge() {
  const { daten } = usePortal();
  const werkzeuge = daten.werkzeuge.filter((w) => WERKZEUGE[w]);
  const tools = daten.links.filter((l) => l.art !== 'ressource');
  const ressourcen = daten.links.filter((l) => l.art === 'ressource');
  const linkKachel = (l: (typeof daten.links)[number]) => (
    <a className="tool link" key={l.url + l.titel} href={l.url} target="_blank" rel="noopener noreferrer">
      <span className="ti"><Icon name="link" /></span>
      <strong>{l.titel} <span aria-hidden="true">↗</span></strong>
      {l.beschreibung && <span>{l.beschreibung}</span>}
    </a>
  );

  return (
    <div className="seite einspaltig">
      <div className="haupt">
        <div className="kopf">
          <h1>Werkzeuge</h1>
          <p>Kleine Tools, die wir für euch gebaut haben, und eure wichtigsten Links.</p>
        </div>
        {werkzeuge.length > 0 && (
          <div className="block">
            <span className="unterkopf">Von Velonify für euch</span>
            <div className="tools">
              {werkzeuge.map((id) => {
                const w = WERKZEUGE[id];
                const inhalt = (
                  <>
                    <span className="ti"><Icon name="tool" /></span>
                    <strong>{w.titel}</strong>
                    <span>{w.text}</span>
                  </>
                );
                return w.seite ? (
                  <a className="tool" key={id} href={pfadVon({ seite: w.seite })}>{inhalt}</a>
                ) : (
                  <div className="tool" key={id} style={{ cursor: 'default', opacity: 0.7 }}>{inhalt}</div>
                );
              })}
            </div>
          </div>
        )}
        {tools.length > 0 && (
          <div className="block">
            <span className="unterkopf">Eure Zugänge</span>
            <div className="tools">{tools.map(linkKachel)}</div>
          </div>
        )}
        {ressourcen.length > 0 && (
          <div className="block">
            <span className="unterkopf">Unterlagen</span>
            <div className="tools">{ressourcen.map(linkKachel)}</div>
          </div>
        )}
        {werkzeuge.length === 0 && daten.links.length === 0 && (
          <div className="alles-gut">Hier landen Tools und Links, sobald wir sie für euch einrichten.</div>
        )}
      </div>
    </div>
  );
}
