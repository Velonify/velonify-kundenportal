import { describe, expect, it } from 'vitest';
import { einbettAdresse } from './termin';

const wer = { name: 'Mara Lindner', email: 'mara@alpenglanz.example' };

describe('einbettAdresse', () => {
  it('embeds Calendly with the client filled in', () => {
    const url = new URL(einbettAdresse('https://calendly.com/velonify-lukas/30min', wer, 'kunden.velonify.de')!);
    expect(url.pathname).toBe('/velonify-lukas/30min');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ embed_domain: 'kunden.velonify.de', embed_type: 'Inline', name: 'Mara Lindner', email: 'mara@alpenglanz.example' });
  });

  it('embeds the long Google booking link, not the short one or other tools', () => {
    expect(einbettAdresse('https://calendar.google.com/calendar/appointments/schedules/AcZssZ1', wer, 'x')).toBe('https://calendar.google.com/calendar/appointments/schedules/AcZssZ1?gv=true');
    expect(einbettAdresse('https://calendar.app.google/abc123', wer, 'x')).toBeNull();
    expect(einbettAdresse('https://example.com/termin', wer, 'x')).toBeNull();
    expect(einbettAdresse('http://calendly.com/x', wer, 'x')).toBeNull();
    expect(einbettAdresse('kein link', wer, 'x')).toBeNull();
  });
});
