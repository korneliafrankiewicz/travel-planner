import { MAX_LATITUDE, MAX_LONGITUDE, type Coordinates } from '../../TripList/schema/stopSchema';
import {
  getRegionForCoordinates,
  type MapRegion,
} from '../../TripDetails/utils/mapMarkers';
import { parseCoordinate } from '../schema/stopFormSchema';

// Shown when there is nothing to centre the picker on: roughly all of Europe.
export const DEFAULT_PICKER_REGION: MapRegion = {
  latitude: 50,
  longitude: 10,
  latitudeDelta: 30,
  longitudeDelta: 30,
};

const DECIMALS = 6;
const FULL_TURN = 360;

const round = (value: number): number => Number(value.toFixed(DECIMALS));

// A tapped point can lie outside the valid range when the map is panned past the date line
// (longitude 190 is really -170). Brings it back into range and rounds it to about 10 cm,
// which is far more precise than a stop needs.
export const toPickedCoordinates = ({ latitude, longitude }: Coordinates): Coordinates => ({
  latitude: round(Math.min(MAX_LATITUDE, Math.max(-MAX_LATITUDE, latitude))),
  longitude: round(
    longitude > MAX_LONGITUDE || longitude < -MAX_LONGITUDE
      ? ((((longitude + MAX_LONGITUDE) % FULL_TURN) + FULL_TURN) % FULL_TURN) - MAX_LONGITUDE
      : longitude,
  ),
});

// A coordinate as it is typed into the form: "38.7223", never "3.87223e+1".
export const formatCoordinate = (value: number): string => String(round(value));

// The place the form currently holds, or null when it is empty or not valid yet.
export const getFormCoordinates = (values: {
  latitude: string;
  longitude: string;
}): Coordinates | null => {
  const latitude = parseCoordinate(values.latitude, MAX_LATITUDE);
  const longitude = parseCoordinate(values.longitude, MAX_LONGITUDE);
  return latitude !== null && longitude !== null ? { latitude, longitude } : null;
};

// Where the picker map starts: on the stop's current place, otherwise around the trip's
// other places, otherwise on Europe.
export const getPickerRegion = (current: Coordinates | null, tripPlaces: Coordinates[]): MapRegion =>
  getRegionForCoordinates(current !== null ? [current] : tripPlaces) ?? DEFAULT_PICKER_REGION;
