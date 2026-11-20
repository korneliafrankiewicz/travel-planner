import { create } from 'zustand';

type ProfileState = {
  displayName: string;
  email: string;
};

// TODO: replace the placeholder identity with the signed-in user's account data once
// authentication exists. Nothing here is saved or sent anywhere.
export const useProfileStore = create<ProfileState>()(() => ({
  displayName: 'Alex Traveler',
  email: 'alex.traveler@example.com',
}));
