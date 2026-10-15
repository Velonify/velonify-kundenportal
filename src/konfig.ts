/** Settings of the portal. The API address comes from the build (repo variable PORTAL_API_URL); without it the portal runs as a demo. */
export const API_URL = (import.meta.env.VITE_PORTAL_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
export const DEMO = !API_URL;

export const KONTAKT = {
  email: 'hallo@velonify.de',
  /** Shown as the emergency number ("wenn der Shop nicht läuft"). */
  telefon: '+49 1512 81 99 254',
  telefonLink: 'tel:+4915128199254',
};

export const RECHTLICHES = {
  impressum: 'https://velonify.de/impressum/',
  datenschutz: 'https://velonify.de/datenschutz/',
};

/** Client tools Velonify can switch on per client in the hub (ids as in the hub's `KUNDEN_WERKZEUGE`). */
export const WERKZEUGE: Record<string, { titel: string; text: string; seite?: 'utm' }> = {
  utm: { titel: 'UTM-Generator', text: 'Kampagnen-Links bauen, damit Google Analytics jeden Klick richtig zuordnet.', seite: 'utm' },
  'social-planer': { titel: 'Social-Media-Planer', text: 'Geplante Posts ansehen und freigeben. Kommt bald.' },
};
