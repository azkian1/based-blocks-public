import { CONFIG } from '../config.js';
import { EVENTS } from '../events.js';

// ScoreManager - Handles scoring and combo tracking
// Owner: Agent A (Core Logic)
//
// API Contract:
// - getScore(): number - current score
// - getBestScore(): number - best score (from localStorage)
// - getCombo(): number - current combo count
// - addPlacementScore(cellCount): number - add points for placing shape
// - addLineClearScore(lineCount): number - add points for clearing lines
// - resetCombo(): void - reset combo to 0
// - reset(): void - reset score and combo

const STORAGE_KEY = 'blockPuzzle_bestScore';
const MAX_SCORE = 999999999;

export class ScoreManager {
  constructor(eventEmitter) {
    this.events = eventEmitter;
    this.score = 0;
    this.combo = 0;
    this.bestScore = this.loadBestScore();
    this.bestScoreAtStart = this.bestScore;
  }

  // Load best score from localStorage
  loadBestScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return 0;

      const parsed = parseInt(saved, 10);

      // Validate: must be finite, non-negative, within max limit
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_SCORE) {
        console.warn('Invalid best score in storage, resetting');
        localStorage.removeItem(STORAGE_KEY);
        return 0;
      }

      return parsed;
    } catch (e) {
      console.error('Error loading best score:', e);
      return 0;
    }
  }

  // Save best score to localStorage
  saveBestScore() {
    try {
      // Validate before saving
      if (!Number.isFinite(this.bestScore) || this.bestScore < 0) {
        console.warn('Invalid best score, not saving:', this.bestScore);
        return;
      }
      localStorage.setItem(STORAGE_KEY, this.bestScore.toString());
    } catch (e) {
      console.error('Error saving best score:', e);
    }
  }

  // Get current score
  getScore() {
    return this.score;
  }

  // Get best score
  getBestScore() {
    return this.bestScore;
  }

  // Get current combo
  getCombo() {
    return this.combo;
  }

  // Add score for placing a shape
  addPlacementScore(cellCount) {
    const points = cellCount * CONFIG.SCORE.PER_CELL;
    this.addScore(points);
    return points;
  }

  // Add score for clearing lines (with multiplier and combo)
  addLineClearScore(lineCount) {
    if (lineCount === 0) {
      this.resetCombo();
      return 0;
    }

    // Increment combo
    this.combo++;

    // Calculate line score with multiplier
    // multiplier = 1 + (lineCount - 1) * 0.5
    // So: 1 line = x1, 2 lines = x1.5, 3 lines = x2, 4 lines = x2.5, etc.
    const multiplier = 1 + (lineCount - 1) * CONFIG.SCORE.LINE_MULTIPLIER;
    const lineScore = Math.floor(lineCount * CONFIG.SCORE.PER_LINE * multiplier);

    // Add combo bonus
    const comboBonus = this.combo > 1 ? (this.combo - 1) * CONFIG.SCORE.COMBO_BONUS : 0;

    const totalPoints = lineScore + comboBonus;
    this.addScore(totalPoints);

    return totalPoints;
  }

  // Add points and emit update event
  addScore(points) {
    // Validate points
    if (!Number.isFinite(points) || points < 0) {
      console.warn('Invalid points value:', points);
      return;
    }

    const newScore = this.score + points;

    // Overflow protection
    if (newScore > MAX_SCORE) {
      console.warn('Score capped at maximum');
      this.score = MAX_SCORE;
    } else {
      this.score = newScore;
    }

    // Check for new best
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveBestScore();
    }

    // Emit score update
    this.events.emit(EVENTS.SCORE_UPDATED, {
      score: this.score,
      bestScore: this.bestScore,
      combo: this.combo,
      delta: points
    });
  }

  // Reset combo counter
  resetCombo() {
    this.combo = 0;
  }

  // Get best score at the start of this game session (before any in-game updates)
  getBestScoreAtStart() {
    return this.bestScoreAtStart;
  }

  // Reset score for new game
  reset() {
    this.score = 0;
    this.combo = 0;
    this.bestScoreAtStart = this.bestScore;
    this.events.emit(EVENTS.SCORE_UPDATED, {
      score: 0,
      bestScore: this.bestScore,
      combo: 0,
      delta: 0
    });
  }
}
