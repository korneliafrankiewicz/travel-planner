import { z } from 'zod';

// Place search by name or address, using Photon (https://photon.komoot.io), a search service
// built on OpenStreetMap data. It needs no account or key, but the public server is meant for
// light, fair use: callers must wait for the user to stop typing and cancel stale requests.
// This is the only file that knows about Photon, so the provider can be swapped here.
const PHOTON_URL = 'https://photon.komoot.io/api/';

export const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 5;
const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;
// Photon only understands these languages; any other value makes it reject the request.
const PHOTON_LANGUAGES: readonly string[] = ['en', 'de', 'fr'];

export type PlaceCoordinates = { latitude: number; longitude: number };

export type PlaceResult = {
  // Stable for one place, so a list can use it as a key.
  id: string;
  name: string;
  // Where the place is, e.g. "Avenida de Brasília, Lisbon, Portugal".
  details: string;
  coordinates: PlaceCoordinates;
};

export class PlaceSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlaceSearchError';
  }
}

const optionalText = z.string().optional();

const featureSchema = z.object({
  geometry: z.object({
    // GeoJSON order: longitude first, then latitude.
    coordinates: z.tuple([
      z.number().min(-MAX_LONGITUDE).max(MAX_LONGITUDE),
      z.number().min(-MAX_LATITUDE).max(MAX_LATITUDE),
    ]),
  }),
  properties: z.object({
    osm_type: optionalText,
    osm_id: z.number().optional(),
    name: optionalText,
    street: optionalText,
    housenumber: optionalText,
    city: optionalText,
    state: optionalText,
    country: optionalText,
  }),
});

const responseSchema = z.object({ features: z.array(z.unknown()) });

const clean = (text: string | undefined): string => text?.trim() ?? '';

// Turns one feature of the response into a result, or null when it has no usable name or place.
const toPlaceResult = (feature: unknown): PlaceResult | null => {
  const parsed = featureSchema.safeParse(feature);
  if (!parsed.success) {
    return null;
  }
  const { geometry, properties } = parsed.data;
  const [longitude, latitude] = geometry.coordinates;

  const street = [clean(properties.street), clean(properties.housenumber)]
    .filter((part) => part !== '')
    .join(' ');
  const name = clean(properties.name) || street || clean(properties.city);
  if (name === '') {
    return null;
  }

  // The parts that say where the place is, without repeating its name or each other.
  const details = [street, clean(properties.city), clean(properties.country)].filter(
    (part, index, parts) => part !== '' && part !== name && parts.indexOf(part) === index,
  );

  const hasOsmId = properties.osm_type !== undefined && properties.osm_id !== undefined;
  return {
    id: hasOsmId ? `${properties.osm_type}${properties.osm_id}` : `${latitude},${longitude}`,
    name,
    details: details.join(', '),
    coordinates: { latitude, longitude },
  };
};

type SearchOptions = {
  // The language of the app. Only English is passed on; see PHOTON_LANGUAGES.
  language: string;
  // Results near this point are ranked higher, e.g. the other places of the trip.
  near?: PlaceCoordinates | null;
  signal?: AbortSignal;
};

// Finds places that match what the user typed. Returns an empty list for a query that is
// too short. Rejects with PlaceSearchError when the service cannot be reached or answers
// with something unusable; a cancelled request rejects with the AbortError it was given.
export const searchPlaces = async (
  query: string,
  { language, near = null, signal }: SearchOptions,
): Promise<PlaceResult[]> => {
  const text = query.trim();
  if (text.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const parameters = [`q=${encodeURIComponent(text)}`, `limit=${MAX_RESULTS * 2}`];
  if (PHOTON_LANGUAGES.includes(language)) {
    parameters.push(`lang=${language}`);
  }
  if (near !== null) {
    parameters.push(`lat=${near.latitude}`, `lon=${near.longitude}`);
  }

  let body: unknown;
  try {
    const response = await fetch(`${PHOTON_URL}?${parameters.join('&')}`, { signal });
    if (!response.ok) {
      throw new PlaceSearchError(`The search service answered with status ${response.status}`);
    }
    body = await response.json();
  } catch (error) {
    if (signal?.aborted === true || error instanceof PlaceSearchError) {
      throw error;
    }
    throw new PlaceSearchError('The search service could not be reached');
  }

  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    throw new PlaceSearchError('The search service answered with something unexpected');
  }

  // Photon can list one place twice, so ask for more than needed and drop the repeats.
  const seen = new Set<string>();
  return parsed.data.features
    .flatMap((feature) => toPlaceResult(feature) ?? [])
    .filter((place) => {
      const key = `${place.id}|${place.name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, MAX_RESULTS);
};
