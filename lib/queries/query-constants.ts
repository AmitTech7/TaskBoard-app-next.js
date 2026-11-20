const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

/**
 * How long fetched data counts as "fresh" (no refetch). Never type a staleTime number
 * in a hook; pick one of these.
 */
export const STALE_TIME_REALTIME = 0;
export const STALE_TIME_SHORT = 30 * MS_PER_SECOND;
export const STALE_TIME_MEDIUM = 5 * SECONDS_PER_MINUTE * MS_PER_SECOND;
