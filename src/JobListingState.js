import { useEffect, useState } from 'react';

// Old listings may contain punctuation-only tags. Keep their stored data intact.
export function visibleJobSkills(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.filter(skill => typeof skill === 'string').map(skill => skill.trim())
    .filter(skill => {
      const key = skill.toLocaleLowerCase();
      if (!/[\p{L}\p{N}]/u.test(skill) || seen.has(key)) return false;
      seen.add(key); return true;
    });
}

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


// Settlement status comes from an owner-scoped server read. Missing finance data
// must never turn a chosen, private collaboration back into an open listing.
export function ownedJobState(job, now = Date.now()) {
  if (job?.listing_stage === 'assigned' || job?.assigned_at) {
    return job.workspace_stage === 'archived' ? 'archived' : 'assigned';
  }
  if (job?.visibility === 'private') return 'hidden';
  return getJobExpiryInfo(job?.expires_at, now).expired ? 'expired' : 'active';
}
