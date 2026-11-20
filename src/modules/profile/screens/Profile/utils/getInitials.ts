const UNKNOWN_INITIALS = '?';

const firstLetter = (word: string): string => Array.from(word)[0].toUpperCase();

// Initials for an avatar: the first letter of the first and the last word of the name.
// "Alex Traveler" -> "AT", "anna maria kowalska" -> "AK", "Łukasz" -> "Ł".
export const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter((word) => word !== '');
  if (words.length === 0) {
    return UNKNOWN_INITIALS;
  }
  if (words.length === 1) {
    return firstLetter(words[0]);
  }
  return firstLetter(words[0]) + firstLetter(words[words.length - 1]);
};
