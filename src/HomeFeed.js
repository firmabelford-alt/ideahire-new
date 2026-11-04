export const homeFeedKey = item => `${item.showcase_kind === 'service' ? 'service' : 'job'}:${item.id}`;
export function mixHomeFeed(jobs = [], services = [], limit = 12) {
  const result = [], seen = new Set();
  const append = (row, kind) => {
    if (!row?.id || result.length >= limit) return;
    const item = { ...row, showcase_kind: kind }, key = homeFeedKey(item);
    if (seen.has(key)) return;
    seen.add(key); result.push(item);
  };
  for (let index = 0; index < Math.max(jobs.length, services.length) && result.length < limit; index++) {
    append(jobs[index], 'job'); append(services[index], 'service');
  }
  return result;
}
