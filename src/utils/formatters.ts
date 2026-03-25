/**
 * Formats a Thai phone number string based on its type and length.
 * 
 * Mobile: 0XX-XXX-XXXX (10 digits)
 * Home (Bangkok): 02-XXX-XXXX (9 digits)
 * Home (Provinces): 0XX-XX-XXXX (9 digits)
 */
export const formatThaiPhone = (value: string, type: 'mobile' | 'home'): string => {
  // Strip all non-digits
  const digits = value.replace(/\D/g, '');
  
  if (type === 'mobile') {
    const limited = digits.slice(0, 10);
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  } else {
    const limited = digits.slice(0, 9);
    if (limited.startsWith('02')) {
      if (limited.length <= 2) return limited;
      if (limited.length <= 5) return `${limited.slice(0, 2)}-${limited.slice(2)}`;
      return `${limited.slice(0, 2)}-${limited.slice(2, 5)}-${limited.slice(5)}`;
    } else {
      if (limited.length <= 3) return limited;
      if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
      return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
    }
  }
};
