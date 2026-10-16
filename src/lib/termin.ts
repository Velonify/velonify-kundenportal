/**
 * Booking pages of the team (Calendly, Google appointment schedules) shown inside the portal. Only providers that
 * allow being embedded get an iframe; any other link opens in a new tab.
 */
export function einbettAdresse(link: string, wer: { name: string; email: string }, host: string): string | null {
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (url.hostname === 'calendly.com' || url.hostname.endsWith('.calendly.com')) {
    // Calendly's inline embed; name and e-mail are filled in so the client does not type them again.
    url.searchParams.set('embed_domain', host);
    url.searchParams.set('embed_type', 'Inline');
    url.searchParams.set('hide_gdpr_banner', '1');
    if (wer.name) url.searchParams.set('name', wer.name);
    if (wer.email) url.searchParams.set('email', wer.email);
    return url.toString();
  }
  // Google's own embed code is the long link with gv=true (the short calendar.app.google link cannot be embedded).
  if (url.hostname === 'calendar.google.com' && url.pathname.includes('/appointments/')) {
    url.searchParams.set('gv', 'true');
    return url.toString();
  }
  return null;
}
