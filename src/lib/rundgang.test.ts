import { describe, expect, it } from 'vitest';
import type { Kundensicht } from '../api/vertrag';
import type { Neuerung } from '../neuerungen';
import { automatischeTour, offeneNeuerungen, rundgangSchritte } from './rundgang';

const basis: Kundensicht = {
  kunde: { name: 'Beispiel GmbH', kuerzel: 'BSP' },
  ich: { vorname: 'Kim', nachname: 'Test', email: 'kim@example.com' },
  team: ['Lukas', 'Julian'],
  fahrplan: [],
  karten: [],
  news: [],
  links: [],
  werkzeuge: [],
  dateien: [],
  rundgang: { gesehen_am: '', neuerungen: [] },
};

const neu = (id: string, datum: string, extra: Partial<Neuerung> = {}): Neuerung => ({ id, datum, titel: id, text: '', ...extra });

describe('Rundgang', () => {
  it('only shows steps for what the client has', () => {
    const ids = rundgangSchritte(basis).map((s) => s.id);
    expect(ids).toEqual(['willkommen', 'zu-tun', 'projekt', 'anfrage', 'dateien', 'team', 'benachrichtigungen']);
    const voll = rundgangSchritte({ ...basis, werkzeuge: ['utm'], termine: { Lukas: 'https://x' }, berichte: [{} as never] });
    expect(voll.map((s) => s.id)).toContain('zahlen');
    expect(voll.find((s) => s.id === 'dateien')!.titel).toBe('Dateien und Werkzeuge');
    expect(voll.find((s) => s.id === 'team')!.titel).toBe('Dein Team und Termine');
    expect(rundgangSchritte(basis)[0].text).toContain('Lukas und Julian');
  });

  it('starts the tour by itself only for a contact who has not seen it, never in the team access or without the server', () => {
    expect(automatischeTour(basis, [], '2026-10-18')?.art).toBe('rundgang');
    expect(automatischeTour({ ...basis, vorschau: 'lukas@velonify.de', rundgang: null }, [], '2026-10-18')).toBeNull();
    expect(automatischeTour({ ...basis, rundgang: undefined }, [], '2026-10-18')).toBeNull();
  });

  it('shows new features released after the tour once, if they apply', () => {
    const daten = { ...basis, rundgang: { gesehen_am: '2026-10-18T09:00:00.000Z', neuerungen: ['gesehen'] } };
    const liste = [
      neu('vorher', '2026-10-18'),
      neu('gesehen', '2026-11-02'),
      neu('passt-nicht', '2026-11-03', { bedingung: (d) => d.werkzeuge.length > 0 }),
      neu('zukunft', '2026-12-01'),
      neu('b', '2026-11-05'),
      neu('a', '2026-11-04'),
    ];
    expect(offeneNeuerungen(liste, daten, '2026-11-10').map((n) => n.id)).toEqual(['a', 'b']);
    const tour = automatischeTour(daten, liste, '2026-11-10');
    expect(tour).toMatchObject({ art: 'neu', ids: ['a', 'b'] });
    // too old to show on its own
    expect(offeneNeuerungen(liste, daten, '2027-02-01')).toEqual([]);
  });
});
