import { useRef, useState, type DragEvent } from 'react';
import { MAX_UPLOAD_BYTES, type PortalDatei } from '../api/vertrag';
import { zuGross } from '../api/client';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { dateiTyp, istGoogleDatei } from '../lib/ansicht';
import { datumRelativ } from '../lib/datum';
import { istNeu } from '../lib/zuletzt';
import { usePortal } from '../portal';

type Filter = 'alle' | 'velonify' | 'kunde';
interface Upload {
  key: number;
  name: string;
  anteil: number;
}

export function Dateien() {
  const p = usePortal();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('alle');
  const [drueber, setDrueber] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [laedt, setLaedt] = useState<string | null>(null);
  const eingabe = useRef<HTMLInputElement>(null);
  const zaehler = useRef(0);
  
  const liste = p.daten.dateien.filter((d) => filter === 'alle' || d.von === filter);

  function hochladen(dateien: FileList | File[] | null) {
    const alle = dateien ? [...dateien] : [];
    if (alle.length) setFilter('alle');
    for (const datei of alle) {
      if (datei.size > MAX_UPLOAD_BYTES) {
        toast({ text: zuGross(datei.name), fehler: true, dauer: 9000 });
        continue;
      }
      const key = ++zaehler.current;
      setUploads((u) => [...u, { key, name: datei.name, anteil: 0 }]);
      p.api
        .hochladen(datei, (anteil) => setUploads((u) => u.map((x) => (x.key === key ? { ...x, anteil } : x))))
        .then((neu) => {
          p.fuegeDateiHinzu(neu);
          toast({ text: `„${neu.name}“ ist bei uns angekommen.` });
        })
        .catch((err) => p.fehler(err))
        .finally(() => setUploads((u) => u.filter((x) => x.key !== key)));
    }
    if (eingabe.current) eingabe.current.value = '';
  }

  async function laden(d: PortalDatei) {
    setLaedt(d.id);
    await p.herunterladen(d);
    setLaedt(null);
  }

  const drop = (e: DragEvent) => {
    e.preventDefault();
    setDrueber(false);
    hochladen(e.dataTransfer.files);
  };

  return (
    <div className="seite einspaltig">
      <div className="haupt" data-rundgang="dateien">
        <div className="kopf">
          <h1>Dateien</h1>
          <p>Was wir euch schicken und was ihr uns schickt, neueste zuerst.</p>
        </div>

        <label
          className={`dropzone${drueber ? ' drueber' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDrueber(true);
          }}
          onDragLeave={() => setDrueber(false)}
          onDrop={drop}
        >
          <span className="box"><Icon name="hoch" /></span>
          <span>
            <b>Datei an Velonify schicken</b>
            <br />
            <span className="muted klein">hierher ziehen oder klicken · bis 25 MB je Datei, größere bitte als Link per Anfrage</span>
          </span>
          <input ref={eingabe} className="sr" type="file" multiple onChange={(e) => hochladen(e.target.files)} />
        </label>

        <div className="block">
          <div className="filter" role="group" aria-label="Dateien filtern">
            {(
              [
                ['alle', 'Alle'],
                ['velonify', 'Von Velonify'],
                ['kunde', 'Von euch'],
              ] as const
            ).map(([wert, titel]) => (
              <button key={wert} type="button" aria-pressed={filter === wert} onClick={() => setFilter(wert)}>
                {titel}
              </button>
            ))}
          </div>
          <div className="dateiliste">
            {uploads.map((u) => (
              <div className="datei" key={`u${u.key}`} aria-busy="true">
                <span className="dt kunde"><Icon name="hoch" /></span>
                <div style={{ minWidth: 0 }}>
                  <div className="name">{u.name}</div>
                  <div className="s">wird hochgeladen … {Math.round(u.anteil * 100)} %</div>
                  <div className="fortschritt"><i style={{ width: `${Math.round(u.anteil * 100)}%` }} /></div>
                </div>
                <span />
              </div>
            ))}
            {liste.length === 0 && uploads.length === 0 && (
              <p className="leer">
                {filter === 'kunde' ? 'Ihr habt uns noch nichts geschickt.' : filter === 'velonify' ? 'Wir haben euch hier noch nichts geteilt.' : 'Noch keine Dateien. Sobald wir etwas teilen, liegt es hier.'}
              </p>
            )}
            {liste.map((d) => {
              const typ = dateiTyp(d);
              const vonKunde = d.von === 'kunde';
              return (
                <div className="datei" key={d.id}>
                  <span className={`dt${typ === 'PDF' ? ' pdf' : ''}${vonKunde ? ' kunde' : ''}`} aria-hidden="true">{typ.slice(0, 5)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="name">
                      {d.name}
                      {!vonKunde && istNeu(d.geaendert, p.neuSeit) && <> <span className="pill himmel">Neu</span></>}
                    </div>
                    <div className="s">
                      {vonKunde ? 'von euch' : 'von Velonify'} · {datumRelativ(d.geaendert)}
                      {istGoogleDatei(d) ? ' · lädt als PDF' : ''}
                    </div>
                  </div>
                  <button className="ikon-btn" type="button" disabled={laedt === d.id} aria-label={`${d.name} herunterladen`} onClick={() => void laden(d)}>
                    {laedt === d.id ? <span className="btn leise" style={{ padding: 0, minHeight: 0 }}><span className="lade" /></span> : <Icon name="runter" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
