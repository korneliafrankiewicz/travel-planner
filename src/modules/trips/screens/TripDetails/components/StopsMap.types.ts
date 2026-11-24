import type { StopMarker } from '../utils/mapMarkers';

export type StopsMapProps = {
  markers: StopMarker[];
  // Called when the label of a marker is tapped.
  onMarkerPress: (stopId: string) => void;
};
