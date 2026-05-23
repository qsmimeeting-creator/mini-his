export const removeUndefinedDeep = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map(item => removeUndefinedDeep(item)) as T;
  }

  if (value && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, fieldValue]) => fieldValue !== undefined)
        .map(([key, fieldValue]) => [key, removeUndefinedDeep(fieldValue)])
    ) as T;
  }

  return value;
};
