import { Excalidraw, restoreElements } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { BinaryFileData, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useEffect, useState } from 'react';
import { ApiFehler, type PortalWhiteboardInhalt } from '../api/vertrag';
import { pfadVon } from '../lib/route';
import { usePortal } from '../portal';

// Fonts come from the portal itself (copied by scripts/excalidraw-schriften.mjs), not from a CDN.
(window as { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = `${import.meta.env.BASE_URL}excalidraw/`;

const alsDataUrl = (blob: Blob) =>
  new Promise<string>((ok, fehler) => {
    const leser = new FileReader();
    leser.onload = () => ok(String(leser.result));
    leser.onerror = () => fehler(leser.error);
    leser.readAsDataURL(blob);
  });

/** Frames in the order the team named them ("1 …", "2 …"), the rest left to right. */
function frames(api: ExcalidrawImperativeAPI) {
  const nummer = (name: string | null) => Number(/^\s*(\d+)/.exec(name ?? '')?.[1] ?? Infinity);
  return api
    .getSceneElements()
    .filter((e) => e.type === 'frame')
    .sort((a, b) => nummer((a as { name: string | null }).name) - nummer((b as { name: string | null }).name) || (Math.abs(a.y - b.y) < 200 ? a.x - b.x : a.y - b.y));
}

/** One whiteboard, read-only: zoom, pan and step through the frames. Editing stays in the hub (stage 1). */
export function WhiteboardSeite({ id }: { id: string }) {
  const { api } = usePortal();
  const [board, setBoard] = useState<PortalWhiteboardInhalt | null>(null);
  const [fehler, setFehler] = useState('');
  const [ex, setEx] = useState<ExcalidrawImperativeAPI | null>(null);
  const [frame, setFrame] = useState(-1);
  const anzahlFrames = ex ? frames(ex).length : 0;

  useEffect(() => {
    let weg = false;
    api.whiteboard(id).then(
      (b) => !weg && setBoard(b),
      (err: unknown) => !weg && setFehler(err instanceof ApiFehler ? err.message : 'Das Whiteboard konnte nicht geladen werden.'),
    );
    return () => {
      weg = true;
    };
  }, [api, id]);

  // Images come after the drawing; the scene itself goes in as initialData, so Excalidraw loads its fonts with it.
  useEffect(() => {
    if (!ex || !board || board.dateien.length === 0) return;
    void Promise.all(
      board.dateien.map(async (dateiId) => {
        const blob = await api.whiteboardDatei(board.id, dateiId);
        return { id: dateiId, dataURL: await alsDataUrl(blob), mimeType: blob.type || 'image/png', created: Date.now() } as BinaryFileData;
      }),
    ).then((dateien) => ex.addFiles(dateien), () => undefined);
  }, [ex, board, api]);

  const zeige = (nr: number) => {
    if (!ex) return;
    const liste = frames(ex);
    if (nr < 0 || nr >= liste.length) {
      setFrame(-1);
      ex.scrollToContent(undefined, { fitToViewport: true, animate: true });
      return;
    }
    setFrame(nr);
    ex.scrollToContent(liste[nr], { fitToViewport: true, viewportZoomFactor: 0.92, animate: true });
  };

  return (
    <div className="seite einspaltig wb-seite">
      <div className="kopf wb-kopf">
        <a className="btn leise" href={pfadVon({ seite: 'dateien' })}>
          ← Dateien
        </a>
        <h1>{board?.titel ?? 'Whiteboard'}</h1>
        {anzahlFrames > 0 && (
          <div className="wb-frames" role="group" aria-label="Bereiche">
            <button type="button" className="btn leise" disabled={frame < 0} onClick={() => zeige(frame - 1)} aria-label="Vorheriger Bereich">
              ‹
            </button>
            <span className="klein">{frame < 0 ? `${anzahlFrames} Bereiche` : `${frame + 1} / ${anzahlFrames}`}</span>
            <button type="button" className="btn leise" disabled={frame >= anzahlFrames - 1} onClick={() => zeige(frame + 1)} aria-label="Nächster Bereich">
              ›
            </button>
          </div>
        )}
      </div>
      {fehler ? (
        <p className="leer">{fehler}</p>
      ) : !board ? (
        <div className="wb-flaeche">
          <span className="lade" />
        </div>
      ) : (
        <div className="wb-flaeche">
          <Excalidraw
            excalidrawAPI={setEx}
            initialData={{ elements: restoreElements(board.elemente as never, null), scrollToContent: true }}
            viewModeEnabled langCode="de-DE" UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false, saveAsImage: false, clearCanvas: false, changeViewBackgroundColor: false, toggleTheme: false } }} />
        </div>
      )}
    </div>
  );
}
