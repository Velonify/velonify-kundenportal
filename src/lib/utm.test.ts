import { describe, expect, it } from 'vitest';
import { baueUtmLink, utmWert, zielUrl } from './utm';

const basis = { url: 'shop.example/collections/neu', source: 'Instagram', medium: 'social', campaign: 'Black Week 2026', content: '', term: '' };

describe('utm', () => {
  it('cleans values for GA4', () => {
    expect(utmWert('  Black Week_Größe ')).toBe('black-week-groesse');
    expect(utmWert('a  &  b')).toBe('a-b');
  });
  it('adds https and rejects non web addresses', () => {
    expect(zielUrl('shop.example')?.toString()).toBe('https://shop.example/');
    expect(zielUrl('javascript:alert(1)')).toBeNull();
    expect(zielUrl('hallo')).toBeNull();
  });
  it('builds the link only with the required fields', () => {
    expect(baueUtmLink({ ...basis, campaign: '' })).toBeNull();
    expect(baueUtmLink(basis)).toBe('https://shop.example/collections/neu?utm_source=instagram&utm_medium=social&utm_campaign=black-week-2026');
  });
  it('keeps other parameters and replaces old utm values', () => {
    expect(baueUtmLink({ ...basis, url: 'https://shop.example/p?variant=1&utm_source=alt' })).toBe(
      'https://shop.example/p?variant=1&utm_source=instagram&utm_medium=social&utm_campaign=black-week-2026',
    );
  });
});
