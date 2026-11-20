import { Redirect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { StopForm } from '../StopForm/StopForm';
import { useStopForm } from '../StopForm/hooks/useStopForm';
import { useStopsStore } from '../TripList/store/stopsStore';
import { useTripsStore, type Trip } from '../TripList/store/tripsStore';
import { getTripDays, toIsoDate } from '../TripList/utils/tripDates';

const DEFAULT_START_TIME = '09:00';
const DEFAULT_DURATION = '60';

type NewStopFormProps = {
  trip: Trip;
  // The day the form starts on.
  date: string;
};

const NewStopForm = ({ trip, date }: NewStopFormProps) => {
  const { t } = useTranslation('trips');
  const addStop = useStopsStore((state) => state.addStop);

  const form = useStopForm({
    trip,
    initialValues: {
      type: 'attraction',
      title: '',
      date,
      startTime: DEFAULT_START_TIME,
      duration: DEFAULT_DURATION,
      notes: '',
      url: '',
    },
    keepDate: null,
    onSave: (input) => addStop(trip.id, input),
  });

  return <StopForm title={t('stop.newTitle')} submitLabel={t('stop.save')} form={form} />;
};

const NewStop = () => {
  const { id, date } = useLocalSearchParams<{ id: string; date?: string }>();
  const trip = useTripsStore((state) => state.trips.find((item) => item.id === id));

  // An unknown id (e.g. a stale link) has nothing to add a stop to.
  if (trip === undefined) {
    return <Redirect href="/" />;
  }

  // Stops can only be planned for today or later. Start on the requested day if it is still
  // allowed, otherwise on the first allowed day of the trip.
  const today = toIsoDate(new Date());
  const plannableDays = getTripDays(trip).filter((day) => day >= today);
  const startDate = date !== undefined && plannableDays.includes(date) ? date : plannableDays[0];

  // A trip that is entirely in the past has no day left to plan.
  if (startDate === undefined) {
    return <Redirect href={{ pathname: '/trip/[id]', params: { id: trip.id } }} />;
  }

  return <NewStopForm trip={trip} date={startDate} />;
};

export default NewStop;
