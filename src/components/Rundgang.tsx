import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Tour } from '../lib/rundgang';
import { geheZu, leseRoute } from '../lib/route';
import { Icon } from './Icon';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ABSTAND = 8;
const KARTE_BREIT = 360;
const HANDY = 760;

/** The target's box in the viewport plus some air, cut to what is visible (big pages stay inside the screen). */
function miss(el: Element): Box {
  const r = el.getBoundingClientRect();
  const oben = Math.max(r.top - ABSTAND, ABSTAND);
  const unten = Math.min(r.bottom + ABSTAND, window.innerHeight - ABSTAND);
  const links = Math.max(r.left - ABSTAND, ABSTAND);
  const rechts = Math.min(r.right + ABSTAND, window.innerWidth - ABSTAND);
  return { x: links, y: oben, w: Math.max(rechts - links, 0), h: Math.max(unten - oben, 0) };
}

/** Where the card goes: next to the spotlight on wide screens, on the opposite half of the screen on phones. */
function kartenPlatz(box: Box | null, hoehe: number): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!box) return { top: Math.max((vh - hoehe) / 2, 16), left: Math.max((vw - Math.min(KARTE_BREIT, vw - 32)) / 2, 16) };
  if (vw <= HANDY) {
    const unten = box.y + box.h / 2 < vh / 2;
    return { left: 16, right: 16, top: unten ? Math.max(vh - hoehe - 88, 16) : 16 };
  }
  const left = Math.min(Math.max(box.x, 16), vw - KARTE_BREIT - 16);
  if (vh - (box.y + box.h) >= hoehe + 28) return { top: box.y + box.h + 14, left };
  if (box.y >= hoehe + 28) return { top: box.y - hoehe - 14, left };
  // Tall target: beside it, or over its lower end when there is no room.
  const top = Math.min(Math.max(box.y + 16, 16), vh - hoehe - 16);
  if (vw - (box.x + box.w) >= KARTE_BREIT + 28) return { top, left: box.x + box.w + 14 };
  if (box.x >= KARTE_BREIT + 28) return { top, left: box.x - KARTE_BREIT - 14 };
  return { top: vh - hoehe - 24, left };
}

/**
 * Tour overlay: dims the page, cuts a spotlight around the element of the step and glides it to the next one; the
 * card follows. Switches tabs when a step lives on another page. Esc ends, arrow keys step, focus stays in the card.
 */
export function Rundgang({ tour, onEnde }: { tour: Tour; onEnde: () => void }) {
  const [i, setI] = useState(0);
  const schritt = tour.schritte[i];
  const letzter = i === tour.schritte.length - 1;
  const [box, setBox] = useState<Box | null>(null);
  const [gleiten, setGleiten] = useState(true);
  const [platz, setPlatz] = useState<CSSProperties>({ opacity: 0 });
  const karte = useRef<HTMLDivElement>(null);
  const titel = useRef<HTMLHeadingElement>(null);
  const ziel = useRef<Element | null>(null);

  // A new step: open its page, wait for the element, bring it into view, then let the spotlight glide there.
  useEffect(() => {
    let weg = false;
    ziel.current = null;
    if (schritt.seite && leseRoute(location.hash).seite !== schritt.seite) geheZu({ seite: schritt.seite });
    if (!schritt.ziel) {
      setGleiten(true);
      setBox(null);
      return;
    }
    const start = performance.now();
    const suche = () => {
      if (weg) return;
      const el = document.querySelector(`[data-rundgang="${schritt.ziel}"]`);
      if (el && el.getBoundingClientRect().height > 0) {
        ziel.current = el;
        const r = el.getBoundingClientRect();
        if (r.top < 72 || r.bottom > window.innerHeight - 96) el.scrollIntoView({ block: r.height > window.innerHeight * 0.55 ? 'start' : 'center' });
        setGleiten(true);
        setBox(miss(el));
      } else if (performance.now() - start < 2000) {
        warten = setTimeout(suche, 40);
      } else {
        setBox(null);
      }
    };
    // A timer, not requestAnimationFrame: the new page renders first, and it also runs in a background tab.
    let warten = setTimeout(suche, 0);
    return () => {
      weg = true;
      clearTimeout(warten);
    };
  }, [schritt]);

  // Scrolling or resizing: follow the element right away, without gliding behind it.
  useEffect(() => {
    let frame = 0;
    let ruhe: ReturnType<typeof setTimeout> | undefined;
    const folge = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!ziel.current) return;
        setGleiten(false);
        setBox(miss(ziel.current));
        clearTimeout(ruhe);
        ruhe = setTimeout(() => setGleiten(true), 150);
      });
    };
    window.addEventListener('scroll', folge, { passive: true });
    window.addEventListener('resize', folge);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(ruhe);
      window.removeEventListener('scroll', folge);
      window.removeEventListener('resize', folge);
    };
  }, []);

  useLayoutEffect(() => {
    setPlatz(kartenPlatz(box, karte.current?.offsetHeight ?? 220));
  }, [box, i]);

  useEffect(() => {
    titel.current?.focus({ preventScroll: true });
  }, [i]);

  const weiter = useCallback(() => (letzter ? onEnde() : setI((x) => x + 1)), [letzter, onEnde]);
  const zurueck = useCallback(() => setI((x) => Math.max(x - 1, 0)), []);

  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onEnde();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        weiter();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        zurueck();
      } else if (e.key === 'Tab' && karte.current) {
        // Keep the focus inside the card.
        const teile = [...karte.current.querySelectorAll<HTMLElement>('button')];
        if (!teile.length) return;
        const pos = teile.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        teile[(pos + (e.shiftKey ? -1 : 1) + teile.length) % teile.length].focus();
      }
    };
    document.addEventListener('keydown', taste);
    return () => document.removeEventListener('keydown', taste);
  }, [weiter, zurueck, onEnde]);

  const neu = tour.art === 'neu';
  const loch: CSSProperties = box
    ? { top: box.y, left: box.x, width: box.w, height: box.h }
    : { top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 };

  return (
    <div className="rg">
      <div className="rg-schirm" />
      <div className={`rg-loch${gleiten ? ' gleitet' : ''}${box ? '' : ' leer'}`} style={loch} aria-hidden="true" />
      <div
        ref={karte}
        className={`rg-karte${gleiten ? ' gleitet' : ''}`}
        style={platz}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rg-titel"
        aria-describedby="rg-text"
      >
        <div className="rg-kopf">
          <span>{neu ? 'Neu im Portal' : `Rundgang · ${i + 1} von ${tour.schritte.length}`}</span>
          <button type="button" className="rg-zu" onClick={onEnde} aria-label={neu ? 'Schließen' : 'Rundgang beenden'}>
            <Icon name="x" />
          </button>
        </div>
        <div className="rg-inhalt" key={schritt.id}>
          <h2 id="rg-titel" ref={titel} tabIndex={-1}>
            {schritt.titel}
          </h2>
          <p id="rg-text">{schritt.text}</p>
        </div>
        <div className="rg-fuss">
          {tour.schritte.length > 1 && (
            <span className="rg-punkte" aria-hidden="true">
              {tour.schritte.map((s, n) => (
                <span key={s.id} className={n === i ? 'an' : undefined} />
              ))}
            </span>
          )}
          <span className="sp" />
          {i > 0 ? (
            <button type="button" className="btn leise" onClick={zurueck}>
              Zurück
            </button>
          ) : (
            !neu && tour.schritte.length > 1 && (
              <button type="button" className="btn leise" onClick={onEnde}>
                Überspringen
              </button>
            )
          )}
          <button type="button" className="btn" onClick={weiter}>
            {letzter ? (neu ? 'Verstanden' : "Los geht's") : 'Weiter'}
            {!letzter && <Icon name="pfeil" />}
          </button>
        </div>
      </div>
      <div className="sr" aria-live="polite">
        {neu ? schritt.titel : `Schritt ${i + 1} von ${tour.schritte.length}: ${schritt.titel}`}
      </div>
    </div>
  );
}
