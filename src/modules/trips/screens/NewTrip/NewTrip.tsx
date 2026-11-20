import { useTranslation } from 'react-i18next';

import { useTripsStore } from '../TripList/store/tripsStore';
import { TripForm } from './components/TripForm';
import { useTripForm } from './hooks/useTripForm';
import { emptyNewTripValues } from './schema/newTripSchema';

const NewTrip = () => {
  const { t } = useTranslation('trips');
  const addTrip = useTripsStore((state) => state.addTrip);
  const form = useTripForm(emptyNewTripValues, addTrip);

  return <TripForm title={t('newTrip')} submitLabel={t('form.save')} form={form} />;
};

export default NewTrip;
