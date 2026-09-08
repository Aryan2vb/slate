import { useEffect, useState } from 'react';

/**
 * A Date that re-renders on an interval, for countdowns and live clocks.
 * Defaults to 15s — fine for minute-granularity copy, cheap enough to leave on.
 */
export default function useNow(intervalMs = 15_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
