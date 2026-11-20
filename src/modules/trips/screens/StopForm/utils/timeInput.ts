// Turns whatever the user types into a time being built up as HH:mm:
// "9" -> "9", "093" -> "09:3", "0930" -> "09:30", "09:30abc" -> "09:30".
// Only digits are kept, at most four, and the colon is added after the hours.
export const formatTimeInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
};
