import { getGoogleMapsSearchUrl } from './maps';

const PREFIX = 'https://www.google.com/maps/search/?api=1&query=';

// The value of the `query` parameter, read back the way Google Maps would read it.
const queryOf = (url: string) => decodeURIComponent(url.slice(PREFIX.length));

describe('getGoogleMapsSearchUrl', () => {
  it('builds an https Google Maps search link', () => {
    expect(getGoogleMapsSearchUrl('Lisbon, Portugal')).toBe(`${PREFIX}Lisbon%2C%20Portugal`);
  });

  it('trims the search text', () => {
    expect(getGoogleMapsSearchUrl('  Zakopane  ')).toBe(`${PREFIX}Zakopane`);
  });

  it.each([
    'Café & Bar #1',
    'Kraków/Łódź',
    'a=b',
    '100% sure?',
    'emoji 🏔️',
    'new\nline',
  ])('keeps %p intact as one query value', (text) => {
    const url = getGoogleMapsSearchUrl(text);
    expect(url.startsWith(PREFIX)).toBe(true);
    expect(queryOf(url)).toBe(text.trim());
    // Only the fixed `api` and `query` parameters: nothing in the text can add another.
    expect(url.split('&')).toHaveLength(2);
    expect(url.split('#')).toHaveLength(1);
  });

  it('cannot be used to inject extra parameters or a different link', () => {
    const url = getGoogleMapsSearchUrl('x&query=evil" onerror=');
    expect(url.split('&')).toHaveLength(2);
    expect(queryOf(url)).toBe('x&query=evil" onerror=');
    expect(url.startsWith('https://www.google.com/')).toBe(true);
  });
});
