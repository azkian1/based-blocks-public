// Tests for ScoreManager
// Тестируемый файл: src/core/ScoreManager.js

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { ScoreManager } from '../../src/core/ScoreManager.js';
import { createEventEmitterMock, createLocalStorageMock } from '../setup.js';
import { CONFIG } from '../../src/config.js';

describe('ScoreManager', () => {
  let scoreManager;
  let eventEmitter;
  let localStorageMock;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = createLocalStorageMock();
    global.localStorage = localStorageMock;

    eventEmitter = createEventEmitterMock();
    scoreManager = new ScoreManager(eventEmitter);
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  // ========================================
  // Базовые операции со счётом
  // ========================================
  describe('Basic Score Operations', () => {
    test('getScore() возвращает 0 изначально', () => {
      expect(scoreManager.getScore()).toBe(0);
    });

    test('addScore() увеличивает текущий счёт', () => {
      scoreManager.addScore(100);

      expect(scoreManager.getScore()).toBe(100);
    });

    test('addScore() накапливает очки', () => {
      scoreManager.addScore(100);
      scoreManager.addScore(50);
      scoreManager.addScore(25);

      expect(scoreManager.getScore()).toBe(175);
    });

    test('addScore() игнорирует негативные значения', () => {
      scoreManager.addScore(100);
      scoreManager.addScore(-50);

      expect(scoreManager.getScore()).toBe(100);
    });

    test('addScore() игнорирует невалидные значения', () => {
      scoreManager.addScore(100);
      scoreManager.addScore(NaN);
      scoreManager.addScore(Infinity);

      expect(scoreManager.getScore()).toBe(100);
    });
  });

  // ========================================
  // Очки за размещение
  // ========================================
  describe('Placement Score', () => {
    test('addPlacementScore() начисляет очки за ячейки', () => {
      // 10 points per cell (CONFIG.SCORE.PER_CELL)
      const points = scoreManager.addPlacementScore(4);

      expect(points).toBe(4 * CONFIG.SCORE.PER_CELL);
      expect(scoreManager.getScore()).toBe(4 * CONFIG.SCORE.PER_CELL);
    });
  });

  // ========================================
  // Расчёт очков за линии
  // ========================================
  describe('Line Clear Score Calculation', () => {
    test('addLineClearScore() - 1 линия = 100 очков базово', () => {
      const points = scoreManager.addLineClearScore(1);

      // 1 line: 100 * 1 * 1 = 100 (no multiplier for 1 line)
      expect(points).toBe(100);
    });

    test('addLineClearScore() - 2 линии = 300 очков (×1.5)', () => {
      const points = scoreManager.addLineClearScore(2);

      // 2 lines: 2 * 100 * 1.5 = 300
      expect(points).toBe(300);
    });

    test('addLineClearScore() - 3 линии = 600 очков (×2)', () => {
      const points = scoreManager.addLineClearScore(3);

      // 3 lines: 3 * 100 * 2 = 600
      expect(points).toBe(600);
    });

    test('addLineClearScore() - 4 линии = 1000 очков (×2.5)', () => {
      const points = scoreManager.addLineClearScore(4);

      // 4 lines: 4 * 100 * 2.5 = 1000
      expect(points).toBe(1000);
    });

    test('addLineClearScore() - 0 линий = 0 очков', () => {
      const points = scoreManager.addLineClearScore(0);

      expect(points).toBe(0);
      expect(scoreManager.getScore()).toBe(0);
    });
  });

  // ========================================
  // Combo система
  // ========================================
  describe('Combo System', () => {
    test('getCombo() возвращает 0 изначально', () => {
      expect(scoreManager.getCombo()).toBe(0);
    });

    test('combo увеличивается при consecutive clears', () => {
      scoreManager.addLineClearScore(1); // combo = 1
      expect(scoreManager.getCombo()).toBe(1);

      scoreManager.addLineClearScore(1); // combo = 2
      expect(scoreManager.getCombo()).toBe(2);

      scoreManager.addLineClearScore(1); // combo = 3
      expect(scoreManager.getCombo()).toBe(3);
    });

    test('combo сбрасывается при пропуске (0 линий)', () => {
      scoreManager.addLineClearScore(1); // combo = 1
      scoreManager.addLineClearScore(1); // combo = 2

      scoreManager.addLineClearScore(0); // combo reset

      expect(scoreManager.getCombo()).toBe(0);
    });

    test('combo bonus = 50 × (номер комбо - 1)', () => {
      // First clear: no combo bonus
      scoreManager.addLineClearScore(1);
      expect(scoreManager.getScore()).toBe(100); // base only

      // Second clear: combo = 2, bonus = 50 * 1 = 50
      scoreManager.addLineClearScore(1);
      expect(scoreManager.getScore()).toBe(100 + 100 + 50);

      // Third clear: combo = 3, bonus = 50 * 2 = 100
      scoreManager.addLineClearScore(1);
      expect(scoreManager.getScore()).toBe(100 + 150 + 200);
    });

    test('resetCombo() сбрасывает combo', () => {
      scoreManager.addLineClearScore(1);
      scoreManager.addLineClearScore(1);
      expect(scoreManager.getCombo()).toBe(2);

      scoreManager.resetCombo();

      expect(scoreManager.getCombo()).toBe(0);
    });
  });

  // ========================================
  // Best Score
  // ========================================
  describe('Best Score', () => {
    test('getBestScore() возвращает 0 изначально', () => {
      expect(scoreManager.getBestScore()).toBe(0);
    });

    test('best score автоматически обновляется', () => {
      scoreManager.addScore(500);

      expect(scoreManager.getBestScore()).toBe(500);
    });

    test('best score не уменьшается', () => {
      scoreManager.addScore(1000);
      expect(scoreManager.getBestScore()).toBe(1000);

      // Reset и добавление меньшего счёта
      scoreManager.reset();
      scoreManager.addScore(500);

      expect(scoreManager.getBestScore()).toBe(1000);
    });

    test('best score сохраняется в localStorage', () => {
      scoreManager.addScore(1234);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'blockPuzzle_bestScore',
        '1234'
      );
    });

    test('best score загружается из localStorage', () => {
      localStorageMock._setStore({ 'blockPuzzle_bestScore': '9999' });

      const newScoreManager = new ScoreManager(eventEmitter);

      expect(newScoreManager.getBestScore()).toBe(9999);
    });
  });

  // ========================================
  // Лимиты
  // ========================================
  describe('Score Limits', () => {
    test('score не превышает MAX_SCORE', () => {
      const MAX_SCORE = 999999999;

      scoreManager.addScore(MAX_SCORE);
      scoreManager.addScore(1000);

      expect(scoreManager.getScore()).toBe(MAX_SCORE);
    });
  });

  // ========================================
  // Reset
  // ========================================
  describe('Reset', () => {
    test('reset() сбрасывает счёт', () => {
      scoreManager.addScore(1000);

      scoreManager.reset();

      expect(scoreManager.getScore()).toBe(0);
    });

    test('reset() сбрасывает combo', () => {
      scoreManager.addLineClearScore(1);
      scoreManager.addLineClearScore(1);

      scoreManager.reset();

      expect(scoreManager.getCombo()).toBe(0);
    });

    test('reset() сохраняет best score', () => {
      scoreManager.addScore(5000);
      const bestBefore = scoreManager.getBestScore();

      scoreManager.reset();

      expect(scoreManager.getBestScore()).toBe(bestBefore);
    });

    test('reset() эмитит SCORE_UPDATED', () => {
      scoreManager.addScore(100);
      eventEmitter.clearEmittedEvents();

      scoreManager.reset();

      const lastEvent = eventEmitter.getLastEmitted('score:updated');
      expect(lastEvent).not.toBeNull();
      expect(lastEvent.data.score).toBe(0);
    });
  });

  // ========================================
  // События
  // ========================================
  describe('Events', () => {
    test('addScore() эмитит SCORE_UPDATED', () => {
      scoreManager.addScore(100);

      const lastEvent = eventEmitter.getLastEmitted('score:updated');

      expect(lastEvent).not.toBeNull();
      expect(lastEvent.data.score).toBe(100);
      expect(lastEvent.data.delta).toBe(100);
    });

    test('SCORE_UPDATED содержит bestScore и combo', () => {
      scoreManager.addLineClearScore(1);

      const lastEvent = eventEmitter.getLastEmitted('score:updated');

      expect(lastEvent.data.bestScore).toBeDefined();
      expect(lastEvent.data.combo).toBe(1);
    });
  });

  // ========================================
  // Edge Cases
  // ========================================
  describe('Edge Cases', () => {
    test('обрабатывает ошибки localStorage gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const newScoreManager = new ScoreManager(eventEmitter);

      expect(newScoreManager.getBestScore()).toBe(0);
    });

    test('обрабатывает невалидные значения из localStorage', () => {
      localStorageMock._setStore({ 'blockPuzzle_bestScore': 'invalid' });

      const newScoreManager = new ScoreManager(eventEmitter);

      expect(newScoreManager.getBestScore()).toBe(0);
    });

    test('обрабатывает отрицательные значения из localStorage', () => {
      localStorageMock._setStore({ 'blockPuzzle_bestScore': '-100' });

      const newScoreManager = new ScoreManager(eventEmitter);

      expect(newScoreManager.getBestScore()).toBe(0);
    });
  });
});
