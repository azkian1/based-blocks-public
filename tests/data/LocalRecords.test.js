import { describe, test, expect, beforeEach } from 'vitest';
import { LocalRecords } from '../../src/data/LocalRecords.js';
import { createLocalStorageMock } from '../setup.js';

describe('Local game records', () => {
  let records;
  beforeEach(() => { global.localStorage = createLocalStorageMock(); records = new LocalRecords(); });
  test('persists game totals and only the five highest scores', () => {
    for (const score of [100, 600, 200, 500, 300, 400]) records.recordGame(score, 2, new Date('2026-11-12T12:00:00Z'));
    const restored = new LocalRecords().getStats();
    expect(restored.gamesPlayed).toBe(6);
    expect(restored.totalLines).toBe(12);
    expect(restored.bestScore).toBe(600);
    expect(restored.records.map(item => item.score)).toEqual([600, 500, 400, 300, 200]);
  });
  test('preserves the previous device best score', () => {
    localStorage.setItem('blockPuzzle_bestScore', '700');
    records.recordGame(100, 1);
    expect(records.getStats().bestScore).toBe(700);
    expect(localStorage.getItem('blockPuzzle_bestScore')).toBe('700');
  });
  test('rejects invalid results and recovers from corrupt storage', () => {
    for (const score of [-1, NaN, Infinity, '100', 1e20]) expect(records.recordGame(score)).toBe(false);
    localStorage.setItem('blockPuzzle_recordsV1', '{broken');
    expect(records.getStats().gamesPlayed).toBe(0);
    expect(records.recordGame(250, 3)).toBe(true);
    expect(records.getStats().records[0].score).toBe(250);
  });
  test('keeps session progress if browser storage is unavailable', () => {
    global.localStorage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    records.recordGame(100, 1);
    records.recordGame(200, 2);
    expect(records.getStats()).toMatchObject({ gamesPlayed: 2, totalLines: 3, bestScore: 200 });
  });
  test('continues counting when a readable saved profile can no longer be written', () => {
    records.recordGame(100, 1);
    localStorage.setItem.mockImplementation(() => { throw new Error('quota'); });
    records.recordGame(200, 2);
    records.recordGame(300, 3);
    expect(records.getStats()).toMatchObject({ gamesPlayed: 3, totalLines: 6, bestScore: 300 });
  });
});
