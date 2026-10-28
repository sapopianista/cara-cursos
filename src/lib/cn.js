/** Junta classes ignorando valores falsos. */
export const cn = (...classes) => classes.filter(Boolean).join(' ');
