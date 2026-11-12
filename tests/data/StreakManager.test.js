import { describe, test, expect, beforeEach } from 'vitest';
import { DailyStreak } from '../../src/data/StreakManager.js';
import { createLocalStorageMock } from '../setup.js';

describe('Daily check-in saved on this device', () => {
  let storage, now, streak;
  beforeEach(() => {
    storage = createLocalStorageMock();
    now = new Date('2026-11-12T23:59:00Z');
    streak = new DailyStreak(storage, () => now);
  });
  test('starts empty and claims once per UTC day', () => {
    expect(streak.getStreak()).toBe(0);
    expect(streak.shouldShowCheckIn()).toBe(true);
    expect(streak.claim()).toBe(1);
    expect(streak.claim()).toBe(1);
    expect(streak.shouldShowCheckIn()).toBe(false);
    expect(streak.isStreakActive()).toBe(true);
  });
  test('advances at UTC midnight and resets after a missed day', () => {
    streak.claim();
    now = new Date('2026-11-13T00:01:00Z');
    expect(streak.claim()).toBe(2);
    now = new Date('2026-11-15T00:01:00Z');
    expect(streak.getStreak()).toBe(0);
    expect(streak.claim()).toBe(1);
  });
  test('restores the claim after a page reload', () => {
    streak.claim();
    const reloaded = new DailyStreak(storage, () => now);
    expect(reloaded.getStreak()).toBe(1);
    expect(reloaded.shouldShowCheckIn()).toBe(false);
    const data = JSON.parse(Object.values(storage._getStore())[0]);
    expect(data).toEqual({ version: 1, count: 1, lastClaim: '2026-11-12' });
  });
  test.each(['not json', '{"version":99}', '{"version":1,"count":-5,"lastClaim":"2026-11-12"}', '{"version":1,"count":10,"lastClaim":"2099-01-01"}'])('ignores corrupt or future saves: %s', raw => {
    storage.setItem('blockPuzzle_dailyStreakV1', raw);
    expect(streak.getStreak()).toBe(0);
    expect(streak.claim()).toBe(1);
  });
  test('remembers the current session when storage is blocked', () => {
    const unavailable = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    const session = new DailyStreak(unavailable, () => now);
    expect(session.claim()).toBe(1);
    expect(session.claim()).toBe(1);
    expect(session.shouldShowCheckIn()).toBe(false);
  });
  test('does not reread a stale claim when saving exceeds browser quota', () => {
    storage.setItem('blockPuzzle_dailyStreakV1', JSON.stringify({ version: 1, count: 3, lastClaim: '2026-11-11' }));
    storage.setItem.mockImplementation(() => { throw new Error('quota'); });
    expect(streak.claim()).toBe(4);
    expect(streak.claim()).toBe(4);
    expect(streak.shouldShowCheckIn()).toBe(false);
  });
});
