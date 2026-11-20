// Builds a Google Maps search link. It opens the Google Maps app when installed,
// and Google Maps in the browser otherwise. Only https links are ever produced.
export const getGoogleMapsSearchUrl = (query: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.trim())}`;
