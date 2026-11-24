import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';

import { StopForm } from '../StopForm/StopForm';
import { useStopForm } from '../StopForm/hooks/useStopForm';
import { useTripPlaces } from '../StopForm/hooks/useTripPlaces';
import type { Stop } from '../TripList/schema/stopSchema';
import { useStopsStore } from '../TripList/store/stopsStore';
import { useTripsStore, type Trip } from '../TripList/store/tripsStore';

type EditStopFormProps = {
  trip: Trip;
  stop: Stop;
};

const EditStopForm = ({ trip, stop }: EditStopFormProps) => {
  const { t } = useTranslation('trips');
  const updateStop = useStopsStore((state) => state.updateStop);
  const deleteStop = useStopsStore((state) => state.deleteStop);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const tripPlaces = useTripPlaces(trip.id, stop.id);

  const form = useStopForm({
    trip,
    initialValues: {
      type: stop.type,
      title: stop.title,
      date: stop.date,
      startTime: stop.startTime,
      duration: String(stop.durationMin),
      notes: stop.notes,
      url: stop.url,
      latitude: stop.coordinates !== null ? String(stop.coordinates.latitude) : '',
      longitude: stop.coordinates !== null ? String(stop.coordinates.longitude) : '',
    },
    // The stop's own day stays valid even if it is in the past or outside the trip.
    keepDate: stop.date,
    onSave: (input) => updateStop(stop.id, input),
  });

  const handleDelete = () => {
    setConfirmingDelete(false);
    deleteStop(stop.id);
    form.close();
  };

  return (
    <>
      <StopForm
        title={t('stop.editTitle')}
        submitLabel={t('form.saveChanges')}
        form={form}
        tripPlaces={tripPlaces}
        onDeleteRequest={() => setConfirmingDelete(true)}
      />
      <ConfirmDialog
        visible={confirmingDelete}
        title={t('stop.deleteConfirm.title')}
        message={t('stop.deleteConfirm.message', { title: stop.title })}
        confirmLabel={t('delete.confirm')}
        cancelLabel={t('form.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
};

const EditStop = () => {
  const { id, stopId } = useLocalSearchParams<{ id: string; stopId: string }>();
  const trip = useTripsStore((state) => state.trips.find((item) => item.id === id));
  const stop = useStopsStore((state) => state.stops.find((item) => item.id === stopId));

  // Keep showing the last known stop while the screen animates away after a delete,
  // instead of redirecting in the middle of closing.
  const [lastStop, setLastStop] = useState(stop);
  if (stop !== undefined && stop !== lastStop) {
    setLastStop(stop);
  }
  const shownStop = stop ?? lastStop;

  if (trip === undefined) {
    return <Redirect href="/" />;
  }
  // An unknown stop (e.g. a stale link) has nothing to edit, so go to the trip.
  if (shownStop === undefined) {
    return <Redirect href={{ pathname: '/trip/[id]', params: { id: trip.id } }} />;
  }

  return <EditStopForm trip={trip} stop={shownStop} />;
};

export default EditStop;
