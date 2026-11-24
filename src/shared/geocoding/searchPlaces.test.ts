import { MIN_QUERY_LENGTH, PlaceSearchError, searchPlaces } from './searchPlaces';

const feature = (
  properties: Record<string, unknown>,
  coordinates: unknown = [-9.2159288, 38.691586],
) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates } });

const belem = feature({
  osm_type: 'W',
  osm_id: 24341353,
  name: 'Tower of Belém',
  street: 'Avenida de Brasília',
  city: 'Lisbon',
  country: 'Portugal',
});

const respondWith = (features: unknown[], init: { ok?: boolean; status?: number } = {}) =>
  jest.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => ({ type: 'FeatureCollection', features }),
  } as Response);

const requestedUrl = (spy: jest.SpyInstance): string => String(spy.mock.calls[0][0]);

afterEach(() => {
  jest.restoreAllMocks();
});

describe('searchPlaces', () => {
  it('turns a result into a place with a name, details and coordinates', async () => {
    respondWith([belem]);

    expect(await searchPlaces('Belem Tower', { language: 'en' })).toEqual([
      {
        id: 'W24341353',
        name: 'Tower of Belém',
        details: 'Avenida de Brasília, Lisbon, Portugal',
        // The service sends longitude first.
        coordinates: { latitude: 38.691586, longitude: -9.2159288 },
      },
    ]);
  });

  it('does not search for a query that is too short', async () => {
    const spy = respondWith([belem]);

    expect(await searchPlaces('ab', { language: 'en' })).toEqual([]);
    expect(await searchPlaces('   ', { language: 'en' })).toEqual([]);
    expect(MIN_QUERY_LENGTH).toBe(3);
    expect(spy).not.toHaveBeenCalled();
  });

  describe('request', () => {
    it('encodes the text the user typed', async () => {
      const spy = respondWith([]);
      await searchPlaces('  Café & Bar / Łódź  ', { language: 'en' });
      expect(requestedUrl(spy)).toContain('q=Caf%C3%A9%20%26%20Bar%20%2F%20%C5%81%C3%B3d%C5%BA&');
    });

    it.each(['en', 'de', 'fr'])('passes on the language %s', async (language) => {
      const spy = respondWith([]);
      await searchPlaces('Lisbon', { language });
      expect(requestedUrl(spy)).toContain(`lang=${language}`);
    });

    it('leaves the language out when the service does not know it (Polish)', async () => {
      const spy = respondWith([]);
      await searchPlaces('Wawel', { language: 'pl' });
      expect(requestedUrl(spy)).not.toContain('lang=');
    });

    it('asks for results near a point when given one', async () => {
      const spy = respondWith([]);
      await searchPlaces('Lisbon', { language: 'en', near: { latitude: 38.7, longitude: -9.1 } });
      expect(requestedUrl(spy)).toContain('lat=38.7&lon=-9.1');
    });

    it('does not ask for a bias without a point', async () => {
      const spy = respondWith([]);
      await searchPlaces('Lisbon', { language: 'en', near: null });
      expect(requestedUrl(spy)).not.toContain('lat=');
    });

    it('only talks to the search service over https', async () => {
      const spy = respondWith([]);
      await searchPlaces('Lisbon', { language: 'en' });
      expect(requestedUrl(spy)).toMatch(/^https:\/\/photon\.komoot\.io\/api\/\?/);
    });

    it('passes the abort signal on, so a stale request can be cancelled', async () => {
      const spy = respondWith([]);
      const controller = new AbortController();
      await searchPlaces('Lisbon', { language: 'en', signal: controller.signal });
      expect(spy.mock.calls[0][1]).toEqual({ signal: controller.signal });
    });
  });

  describe('results', () => {
    it('shows at most five', async () => {
      respondWith(
        Array.from({ length: 9 }, (_, index) =>
          feature({ osm_type: 'N', osm_id: index, name: `Place ${index}` }),
        ),
      );
      expect(await searchPlaces('Place', { language: 'en' })).toHaveLength(5);
    });

    it('drops a place that is listed twice', async () => {
      respondWith([belem, belem]);
      expect(await searchPlaces('Belem', { language: 'en' })).toHaveLength(1);
    });

    it('keeps different places that share a name', async () => {
      respondWith([
        feature({ osm_type: 'N', osm_id: 1, name: 'Hotel Central' }, [-9.1, 38.7]),
        feature({ osm_type: 'N', osm_id: 2, name: 'Hotel Central' }, [19.9, 50.0]),
      ]);
      expect(await searchPlaces('Hotel Central', { language: 'en' })).toHaveLength(2);
    });

    it('names a place by its address when it has no name', async () => {
      respondWith([feature({ street: 'Rua Augusta', housenumber: '10', city: 'Lisbon' })]);
      const [place] = await searchPlaces('Rua Augusta 10', { language: 'en' });
      expect(place).toMatchObject({ name: 'Rua Augusta 10', details: 'Lisbon' });
    });

    it('names a place by its city when it has nothing else', async () => {
      respondWith([feature({ city: 'Lisbon', country: 'Portugal' })]);
      const [place] = await searchPlaces('Lisbon', { language: 'en' });
      expect(place).toMatchObject({ name: 'Lisbon', details: 'Portugal' });
    });

    it('does not repeat the name or a part in the details', async () => {
      respondWith([feature({ name: 'Lisbon', city: 'Lisbon', country: 'Portugal' })]);
      const [place] = await searchPlaces('Lisbon', { language: 'en' });
      expect(place.details).toBe('Portugal');
    });

    it('gives an id from the coordinates when the place has no OpenStreetMap id', async () => {
      respondWith([feature({ name: 'Somewhere' }, [10, 20])]);
      const [place] = await searchPlaces('Somewhere', { language: 'en' });
      expect(place.id).toBe('20,10');
    });

    it('trims the text', async () => {
      respondWith([feature({ name: '  Belém  ', city: ' Lisbon ' })]);
      const [place] = await searchPlaces('Belem', { language: 'en' });
      expect(place).toMatchObject({ name: 'Belém', details: 'Lisbon' });
    });

    it.each([
      ['has no name or address', feature({ country: 'Portugal' })],
      ['has no coordinates', { properties: { name: 'X' } }],
      ['has coordinates out of range', feature({ name: 'X' }, [200, 38])],
      ['has latitude out of range', feature({ name: 'X' }, [10, 95])],
      ['has text instead of coordinates', feature({ name: 'X' }, ['10', '20'])],
      ['is not an object', 'nonsense'],
      ['is null', null],
    ])('skips a result that %s, and keeps the good ones', async (_reason, bad) => {
      respondWith([bad, belem]);
      const places = await searchPlaces('Belem', { language: 'en' });
      expect(places.map((place) => place.name)).toEqual(['Tower of Belém']);
    });

    it('returns an empty list when nothing matches', async () => {
      respondWith([]);
      expect(await searchPlaces('qqqqqqqq', { language: 'en' })).toEqual([]);
    });
  });

  describe('failures', () => {
    it('rejects when the service cannot be reached', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
      await expect(searchPlaces('Lisbon', { language: 'en' })).rejects.toBeInstanceOf(
        PlaceSearchError,
      );
    });

    it.each([400, 429, 500, 503])('rejects when the service answers with status %p', async (status) => {
      respondWith([], { ok: false, status });
      await expect(searchPlaces('Lisbon', { language: 'en' })).rejects.toThrow(String(status));
    });

    it('rejects an answer that is not the expected shape', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'rate limited' }),
      } as Response);
      await expect(searchPlaces('Lisbon', { language: 'en' })).rejects.toBeInstanceOf(
        PlaceSearchError,
      );
    });

    it('rejects an answer that is not JSON', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token <');
        },
      } as unknown as Response);
      await expect(searchPlaces('Lisbon', { language: 'en' })).rejects.toBeInstanceOf(
        PlaceSearchError,
      );
    });

    it('passes a cancelled request on as it is, not as a search error', async () => {
      const controller = new AbortController();
      const abortError = new DOMException('Aborted', 'AbortError');
      jest.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        controller.abort();
        throw abortError;
      });

      await expect(
        searchPlaces('Lisbon', { language: 'en', signal: controller.signal }),
      ).rejects.toBe(abortError);
    });
  });
});
