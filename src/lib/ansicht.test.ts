import { describe, expect, it } from 'vitest';
import { baueFeed, gruppiereFeed, projektstand } from './ansicht';
import { datumRelativ, tageZwischen } from './datum';
import { istNeu } from './zuletzt';
import type { Kundensicht } from '../api/vertrag';

const jetzt = new Date('2026-10-15T10:00:00Z');

describe('projektstand', () => {
  it('takes the active stage and the last open dated milestone', () => {
    const s = projektstand(
      [
        { titel: 'A', datum: '2026-09-01', status: 'erledigt' },
        { titel: 'B', datum: '2026-10-20', status: 'aktiv' },
        { titel: 'Go-live', datum: '2026-11-28', status: 'offen' },
      ],
      jetzt,
    );
    expect(s.aktuell?.titel).toBe('B');
    expect(s.ziel?.titel).toBe('Go-live');
    expect(s.tageBisZiel).toBe(44);
    expect(s.erledigt).toBe(1);
  });
});

describe('feed', () => {
  const daten = {
    news: [{ id: 'n', art: 'meilenstein', titel: 'M', text: '', datum: '2026-10-14' }],
    dateien: [
      { id: 'a', name: 'von-uns.pdf', mimeType: 'application/pdf', geaendert: '2026-10-15T08:00:00Z', von: 'velonify' },
      { id: 'b', name: 'vom-kunden.zip', mimeType: 'application/zip', geaendert: '2026-10-15T09:00:00Z', von: 'kunde' },
    ],
    karten: [
      {
        id: 'k', titel: 'K', phase: 'erledigt', erledigt_am: '2026-10-01',
        kommentare: [{ von: 'Mara', team: false, ich: true, text: 'x', datum: '2026-10-02T09:00:00Z' }, { von: 'Julian', team: true, ich: false, text: 'y', datum: '2026-10-02T10:00:00Z' }],
      },
    ],
  } as unknown as Kundensicht;

  it('leaves out own uploads and sorts newest first', () => {
    const feed = baueFeed(daten);
    expect(feed.map((e) => e.key)).toEqual(['d-a', 'n-n', 'a-k', 'e-k']);
  });
  it('groups by day', () => {
    expect(gruppiereFeed(baueFeed(daten), jetzt).map((g) => g.titel)).toEqual(['Heute', 'Gestern', 'Diesen Monat']);
  });
});

describe('datum', () => {
  it('counts days and words them', () => {
    expect(tageZwischen('2026-10-15', '2026-11-28')).toBe(44);
    expect(datumRelativ('2026-10-16', jetzt)).toBe('morgen');
    expect(datumRelativ('2026-10-14T20:00:00Z', jetzt)).toBe('gestern');
  });
  it('marks new things only after a first visit', () => {
    expect(istNeu('2026-10-15T09:00:00Z', '')).toBe(false);
    expect(istNeu('2026-10-15T09:00:00Z', '2026-10-14T12:00:00Z')).toBe(true);
    expect(istNeu('2026-10-14', '2026-10-14T12:00:00Z')).toBe(false);
  });
});
