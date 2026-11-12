const KEY = 'blockPuzzle_dailyStreakV1';
const day = date => date.toISOString().slice(0, 10);

export class DailyStreak {
  constructor(storage = null, now = () => new Date()) {
    this.storage = storage;
    this.now = now;
    this.fallback = { version: 1, count: 0, lastClaim: null };
    this.sessionOnly = false;
  }
  read() {
    if (this.sessionOnly) return { ...this.fallback };
    try {
      const raw = (this.storage || globalThis.localStorage)?.getItem(KEY);
      if (!raw) return { ...this.fallback };
      const data = JSON.parse(raw);
      if (data.version !== 1 || !Number.isSafeInteger(data.count) || data.count < 1 || data.count > 100000 || !/^\d{4}-\d{2}-\d{2}$/.test(data.lastClaim) || data.lastClaim > day(this.now())) return { version: 1, count: 0, lastClaim: null };
      return { version: 1, count: data.count, lastClaim: data.lastClaim };
    } catch { return { ...this.fallback }; }
  }
  getStreak() {
    const data = this.read();
    const today = day(this.now());
    const yesterday = day(new Date(this.now().getTime() - 86400000));
    return data.lastClaim === today || data.lastClaim === yesterday ? data.count : 0;
  }
  shouldShowCheckIn() { return this.read().lastClaim !== day(this.now()); }
  claim() {
    const today = day(this.now());
    if (!this.shouldShowCheckIn()) return this.getStreak();
    const data = { version: 1, count: Math.min(100000, this.getStreak() + 1), lastClaim: today };
    this.fallback = data;
    try {
      const storage = this.storage || globalThis.localStorage;
      storage?.setItem(KEY, JSON.stringify(data));
      this.sessionOnly = !storage;
    } catch { this.sessionOnly = true; }
    return data.count;
  }
  isStreakActive() { return this.getStreak() > 0; }
}
export const StreakManager = new DailyStreak();
