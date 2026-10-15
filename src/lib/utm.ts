export interface UtmEingabe {
  url: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
}

export const UTM_FELDER = ['source', 'medium', 'campaign', 'content', 'term'] as const;

/** Lower case, spaces and underscores to hyphens, no umlauts: values GA4 groups cleanly. */
export function utmWert(wert: string): string {
  return wert
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9.\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Adds https:// when missing; null when it is not a usable web address. */
export function zielUrl(roh: string): URL | null {
  const text = roh.trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? (url.hostname.includes('.') ? url : null) : null;
  } catch {
    return null;
  }
}

/** The tagged link, or null while url, source, medium or campaign is missing. Existing utm_ parameters are replaced. */
export function baueUtmLink(e: UtmEingabe): string | null {
  const url = zielUrl(e.url);
  if (!url || !utmWert(e.source) || !utmWert(e.medium) || !utmWert(e.campaign)) return null;
  for (const feld of UTM_FELDER) {
    url.searchParams.delete(`utm_${feld}`);
    const wert = utmWert(e[feld]);
    if (wert) url.searchParams.set(`utm_${feld}`, wert);
  }
  return url.toString();
}
