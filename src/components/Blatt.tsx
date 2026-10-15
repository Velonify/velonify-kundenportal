import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

/**
 * Side sheet (full screen on phones). Escape and a click on the backdrop close it, focus stays inside
 * and goes back to where it came from; the page behind does not scroll.
 */
export function Blatt(props: { titel: ReactNode; oben?: ReactNode; onClose: () => void; children: ReactNode; fokus?: string }) {
  const { onClose } = props;
  const titelId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const schliessen = useRef(onClose);
  schliessen.current = onClose;

  useEffect(() => {
    const vorher = document.activeElement as HTMLElement | null;
    const ziel = (props.fokus && ref.current?.querySelector<HTMLElement>(props.fokus)) || ref.current?.querySelector<HTMLElement>('[data-zu]');
    ziel?.focus();
    const ueberlauf = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') schliessen.current();
      if (e.key !== 'Tab' || !ref.current) return;
      const fokussierbar = [...ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (fokussierbar.length === 0) return;
      const erstes = fokussierbar[0];
      const letztes = fokussierbar[fokussierbar.length - 1];
      if (e.shiftKey && document.activeElement === erstes) {
        e.preventDefault();
        letztes.focus();
      } else if (!e.shiftKey && document.activeElement === letztes) {
        e.preventDefault();
        erstes.focus();
      }
    };
    document.addEventListener('keydown', taste);
    return () => {
      document.removeEventListener('keydown', taste);
      document.body.style.overflow = ueberlauf;
      vorher?.focus?.();
    };
    // Only on open; the focus target is read once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="schleier" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="blatt" role="dialog" aria-modal="true" aria-labelledby={titelId} ref={ref}>
        <div className="blatt-kopf">
          <div className="oben">
            {props.oben ?? <span />}
            <button className="ikon-btn" type="button" data-zu aria-label="Schließen" onClick={onClose}>
              <Icon name="x" />
            </button>
          </div>
          <h2 id={titelId}>{props.titel}</h2>
        </div>
        {props.children}
      </div>
    </div>
  );
}
