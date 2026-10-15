import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ToastDaten {
  id: number;
  text: string;
  fehler?: boolean;
  aktion?: { titel: string; tun: () => void };
  dauer?: number;
}

type Zeige = (t: Omit<ToastDaten, 'id'>) => void;
const ToastKontext = createContext<Zeige>(() => {});
export const useToast = () => useContext(ToastKontext);

export function ToastBereich({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastDaten | null>(null);
  const zaehler = useRef(0);
  const zeige = useCallback<Zeige>((t) => setToast({ ...t, id: ++zaehler.current }), []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.dauer ?? (toast.fehler ? 6000 : 3200));
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastKontext.Provider value={zeige}>
      {children}
      <div aria-live="polite" role="status">
        {toast && (
          <div className={`toast${toast.fehler ? ' fehler' : ''}`} key={toast.id}>
            <Icon name={toast.fehler ? 'warn' : 'check'} />
            <span>{toast.text}</span>
            {toast.aktion && (
              <button
                type="button"
                onClick={() => {
                  toast.aktion!.tun();
                  setToast(null);
                }}
              >
                {toast.aktion.titel}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastKontext.Provider>
  );
}
