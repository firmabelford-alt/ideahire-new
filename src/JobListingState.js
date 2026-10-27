import { useEffect, useState } from 'react';

export function nextListingExpiryDelay(jobs, now = Date.now()) {
  const future = jobs.map(job => new Date(job.expires_at || '').getTime()).filter(time => Number.isFinite(time) && time > now);
  return future.length ? Math.min(2147483647, Math.max(50, Math.min(...future) - now + 50)) : null;
}

// One timer at the next expiry, with a refresh when a background tab is resumed.
export function useListingClock(jobs) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const delay = nextListingExpiryDelay(jobs);
    const timer = delay === null ? null : window.setTimeout(refresh, delay);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      if (timer !== null) clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [jobs, now]);
  return Math.max(now, Date.now());
}

export function getJobExpiryInfo(expiresAt, now = Date.now()) {
  const expiryTime = new Date(expiresAt || "").getTime();

  if (!Number.isFinite(expiryTime)) {
    return {
      expired: false,
      label: "Aktywne ogłoszenie",
    };
  }

  const remainingMilliseconds = expiryTime - now;

  if (remainingMilliseconds <= 0) {
    return {
      expired: true,
      label: "Ogłoszenie wygasło",
    };
  }

  const remainingHours = Math.ceil(
    remainingMilliseconds / (60 * 60 * 1000)
  );

  if (remainingHours <= 24) {
    return {
      expired: false,
      label:
        remainingHours === 1
          ? "Wygasa za godzinę"
          : `Wygasa za ${remainingHours} godz.`,
    };
  }

  const remainingDays = Math.ceil(remainingHours / 24);

  return {
    expired: false,
    label: `Wygasa za ${remainingDays} dni`,
  };
}

