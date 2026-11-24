import type { Coordinates } from '../../TripList/schema/stopSchema';

export type LocationPickerProps = {
  visible: boolean;
  // The stop's current place; the pin starts here.
  initialCoordinates: Coordinates | null;
  // Places of the trip's other stops, used to centre the map when the stop has no place yet.
  tripPlaces: Coordinates[];
  onConfirm: (coordinates: Coordinates) => void;
  onCancel: () => void;
};
