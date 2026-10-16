import { describe, expect, it } from 'vitest';
import { leseRoute, pfadVon } from './route';

describe('Routen', () => {
  it('opens a monthly report and comes back to the same address', () => {
    expect(leseRoute('#/bericht/2026-10')).toEqual({ seite: 'bericht', monat: '2026-10' });
    expect(pfadVon({ seite: 'bericht', monat: '2026-10' })).toBe('#/bericht/2026-10');
    expect(leseRoute('#/bericht')).toEqual({ seite: 'zahlen' });
  });

  it('keeps the target page of a team access from the hub', () => {
    expect(leseRoute('#/vorschau/abc.def')).toEqual({ seite: 'vorschau', token: 'abc.def', ziel: undefined });
    expect(leseRoute('#/vorschau/abc.def/bericht/2026-10')).toEqual({ seite: 'vorschau', token: 'abc.def', ziel: 'bericht/2026-10' });
  });
});
