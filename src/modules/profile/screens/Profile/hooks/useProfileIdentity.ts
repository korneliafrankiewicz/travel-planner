import { useCurrentUser } from '@/shared/auth/sessionStore';

// The name and email of the person who is logged in, for the profile screen and the places that
// show who they are. Empty strings when nobody is logged in; those screens are only reachable
// when someone is.
export const useProfileIdentity = (): { displayName: string; email: string } => {
  const user = useCurrentUser();
  return { displayName: user?.name ?? '', email: user?.email ?? '' };
};
