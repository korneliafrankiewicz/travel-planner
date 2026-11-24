import { useEffect, useState } from 'react';

import {
  MIN_QUERY_LENGTH,
  searchPlaces,
  type PlaceCoordinates,
  type PlaceResult,
} from '@/shared/geocoding/searchPlaces';

// How long the user must stop typing before a search is sent. The public search server is
// meant for light use, so a search per keystroke is not acceptable.
export const SEARCH_DEBOUNCE_MS = 500;

export type PlaceSearchState =
  // Nothing typed yet, or too little to search for.
  | { status: 'idle'; results: [] }
  // Typing or waiting for the answer.
  | { status: 'loading'; results: [] }
  | { status: 'success'; results: PlaceResult[] }
  | { status: 'error'; results: [] };

type Settled = { key: string; state: PlaceSearchState };

// Searches for places while the user types: waits for a pause, and drops the answer of any
// search that has been replaced by a newer one.
export const usePlaceSearch = (
  query: string,
  language: string,
  near: PlaceCoordinates | null,
): PlaceSearchState => {
  const text = query.trim();
  const nearLatitude = near?.latitude ?? null;
  const nearLongitude = near?.longitude ?? null;
  const key = `${text}|${language}|${nearLatitude}|${nearLongitude}`;
  const [settled, setSettled] = useState<Settled | null>(null);

  useEffect(() => {
    if (text.length < MIN_QUERY_LENGTH) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const point =
        nearLatitude !== null && nearLongitude !== null
          ? { latitude: nearLatitude, longitude: nearLongitude }
          : null;
      searchPlaces(text, { language, near: point, signal: controller.signal })
        .then((results) => setSettled({ key, state: { status: 'success', results } }))
        .catch(() => {
          // A search that was replaced is cancelled on purpose and is not an error.
          if (!controller.signal.aborted) {
            setSettled({ key, state: { status: 'error', results: [] } });
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, text, language, nearLatitude, nearLongitude]);

  if (text.length < MIN_QUERY_LENGTH) {
    return { status: 'idle', results: [] };
  }
  // The answer on hand belongs to an earlier query, so it is not shown.
  return settled?.key === key ? settled.state : { status: 'loading', results: [] };
};
