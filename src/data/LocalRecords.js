import { safeGetItem, safeSetItem } from '../utils/storage.js';

const KEY = 'blockPuzzle_recordsV1';
const MAX_SCORE = 999999999;
const validNumber = value => Number.isSafeInteger(value) && value >= 0 && value <= MAX_SCORE;
const empty = () => ({ version: 1, gamesPlayed: 0, totalLines: 0, records: [] });

export class LocalRecords {
  constructor() { this.fallback = empty(); this.sessionOnly = false; }

  read() {
    if (this.sessionOnly) return structuredClone(this.fallback);
    const raw = safeGetItem(KEY);
    if (!raw) return structuredClone(this.fallback);
    try {
      if (raw.length > 50000) return empty();
      const data = JSON.parse(raw);
      if (data.version !== 1 || !validNumber(data.gamesPlayed) || !validNumber(data.totalLines) || !Array.isArray(data.records)) return empty();
      const records = data.records.filter(entry => validNumber(entry?.score) && typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date))
        .sort((a, b) => b.score - a.score).slice(0, 5).map(({ score, date }) => ({ score, date }));
      return { version: 1, gamesPlayed: data.gamesPlayed, totalLines: data.totalLines, records };
    } catch { return empty(); }
  }

  getStats() {
    const data = this.read();
    const previousBest = Number(safeGetItem('blockPuzzle_bestScore', '0'));
    return { ...data, bestScore: Math.max(data.records[0]?.score || 0, validNumber(previousBest) ? previousBest : 0) };
  }

  recordGame(score, lines = 0, date = new Date()) {
    if (!validNumber(score) || !validNumber(lines) || !Number.isFinite(date.getTime())) return false;
    const data = this.read();
    data.gamesPlayed = Math.min(MAX_SCORE, data.gamesPlayed + 1);
    data.totalLines = Math.min(MAX_SCORE, data.totalLines + lines);
    data.records.push({ score, date: date.toISOString().slice(0, 10) });
    data.records.sort((a, b) => b.score - a.score);
    data.records = data.records.slice(0, 5);
    const bestScore = Math.max(score, this.getStats().bestScore);
    this.fallback = structuredClone(data);
    safeSetItem('blockPuzzle_bestScore', String(bestScore));
    this.sessionOnly = !safeSetItem(KEY, JSON.stringify(data));
    return true;
  }
}

export const Records = new LocalRecords();
