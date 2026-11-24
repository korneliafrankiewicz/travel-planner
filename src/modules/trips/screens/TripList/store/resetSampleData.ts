import { useStopsStore } from './stopsStore';
import { useTripsStore } from './tripsStore';

// Replaces all saved trips and stops with the sample ones, as on the very first launch. The
// samples are only used on a first launch, so without this a device that already holds saved
// data never gets a change to them. Trips and stops are reset together, so no stop is left
// pointing at a trip that is gone. Used by the development section of Settings.
export const resetSampleData = (): void => {
  useTripsStore.getState().resetToSamples();
  useStopsStore.getState().resetToSamples();
};
