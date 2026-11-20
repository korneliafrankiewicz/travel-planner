import { Redirect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { TripForm } from '../NewTrip/components/TripForm';
import { useTripForm } from '../NewTrip/hooks/useTripForm';
import type { Trip } from '../TripList/store/tripsStore';
import { useTripsStore } from '../TripList/store/tripsStore';

type EditTripFormProps = {
  trip: Trip;
};

const EditTripForm = ({ trip }: EditTripFormProps) => {
  const { t } = useTranslation('trips');
  const updateTrip = useTripsStore((state) => state.updateTrip);

  const form = useTripForm(
    {
      title: trip.title,
      destination: trip.destination,
      notes: trip.notes,
      startDate: trip.startDate,
      endDate: trip.endDate,
    },
    (input) => updateTrip(trip.id, input),
  );

  return <TripForm title={t('form.editTitle')} submitLabel={t('form.saveChanges')} form={form} />;
};

const EditTrip = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useTripsStore((state) => state.trips.find((item) => item.id === id));

  // An unknown id (e.g. a stale link) has nothing to edit, so go back to the list.
  if (trip === undefined) {
    return <Redirect href="/" />;
  }

  return <EditTripForm trip={trip} />;
};

export default EditTrip;
