import { useEffect, useState } from 'react';

/**
 * Hash routes, because GitHub Pages has no rewrites. The login mail links to `#/anmelden/<token>`.
 * `#/projekt/k1` opens card k1 on the project page.
 */
export type Route =
  | { seite: 'start' }
  | { seite: 'projekt'; karte?: string }
  | { seite: 'dateien' }
  | { seite: 'werkzeuge' }
  | { seite: 'utm' }
  | { seite: 'einstellungen' }
  | { seite: 'anmelden'; token: string }
  | { seite: 'vorschau'; token: string };

export function leseRoute(hash: string): Route {
  const teile = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  switch (teile[0]) {
    case 'projekt':
      return { seite: 'projekt', karte: teile[1] };
    case 'dateien':
      return { seite: 'dateien' };
    case 'einstellungen':
      return { seite: 'einstellungen' };
    case 'werkzeuge':
      return teile[1] === 'utm' ? { seite: 'utm' } : { seite: 'werkzeuge' };
    case 'anmelden':
      return teile[1] ? { seite: 'anmelden', token: teile[1] } : { seite: 'start' };
    case 'vorschau':
      return teile[1] ? { seite: 'vorschau', token: teile[1] } : { seite: 'start' };
    default:
      return { seite: 'start' };
  }
}

export function pfadVon(route: Route): string {
  switch (route.seite) {
    case 'start':
      return '#/';
    case 'projekt':
      return route.karte ? `#/projekt/${encodeURIComponent(route.karte)}` : '#/projekt';
    case 'utm':
      return '#/werkzeuge/utm';
    case 'anmelden':
      return `#/anmelden/${route.token}`;
    case 'vorschau':
      return `#/vorschau/${route.token}`;
    default:
      return `#/${route.seite}`;
  }
}

export function geheZu(route: Route, ersetzen = false): void {
  const ziel = pfadVon(route);
  if (ersetzen) history.replaceState(null, '', ziel);
  else history.pushState(null, '', ziel);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => leseRoute(location.hash));
  useEffect(() => {
    const neu = () => setRoute(leseRoute(location.hash));
    window.addEventListener('hashchange', neu);
    window.addEventListener('popstate', neu);
    return () => {
      window.removeEventListener('hashchange', neu);
      window.removeEventListener('popstate', neu);
    };
  }, []);
  return route;
}
