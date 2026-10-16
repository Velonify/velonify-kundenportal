const PFADE = {
  home: 'M3 11l9-7 9 7v9h-6v-6H9v6H3z',
  projekt: 'M4 6h2M9 6h11M4 12h2M9 12h11M4 18h2M9 18h11',
  datei: 'M6 3h8l5 5v13H6zM14 3v5h5',
  tool: 'M14 4l6 6-3 3-6-6zM11 7l-7 7v6h6l7-7',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5 9-10',
  kom: 'M4 5h16v11H9l-5 4z',
  hoch: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  runter: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  link: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  post: 'M3 6h18v12H3zM3 6l9 7 9-7',
  flagge: 'M5 21V4h12l-2 4 2 4H5',
  info: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 11v5M12 8v.5',
  pfeil: 'M9 6l6 6-6 6',
  zurueck: 'M15 6l-6 6 6 6',
  aus: 'M15 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  tel: 'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  kopie: 'M8 8h12v12H8zM16 8V4H4v12h4',
  stern: 'M12 4l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z',
  neu: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  warn: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  muell: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  slack: 'M9 3v18M15 3v18M3 9h18M3 15h18',
  kurve: 'M4 19h16M5 15l4-5 4 3 6-8',
  drucker: 'M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7z',
  glocke: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
} as const;

export type IconName = keyof typeof PFADE;

export function Icon({ name, label }: { name: IconName; label?: string }) {
  return (
    <svg className="i" viewBox="0 0 24 24" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      <path d={PFADE[name]} />
    </svg>
  );
}

export function Logo() {
  return (
    <svg viewBox="0 0 22 18" aria-hidden="true">
      <path d="M0 0h6l5 10 5-10h6L13 18H9z" />
    </svg>
  );
}
