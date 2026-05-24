import { parseISO, isValid } from 'date-fns';

export const getLocalDateKey = (value: string | Date = new Date()) => {
  const date = value instanceof Date ? value : parseISO(value);
  if (!isValid(date)) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isVisitToday = (timestamp?: string) => {
  if (!timestamp) return false;
  return getLocalDateKey(timestamp) === getLocalDateKey();
};
