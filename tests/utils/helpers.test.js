// Tests for utility helpers
// This file tests common utilities and helper functions

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createEmptyGrid, createFilledGrid, createGridFromPattern, createEventEmitterMock, createLocalStorageMock } from '../setup.js';
import { CONFIG } from '../../src/config.js';
import { SHAPES, SHAPE_GROUPS, ALL_SHAPE_TYPES } from '../../src/data/shapes.js';
import { EVENTS } from '../../src/events.js';

describe('Test Setup Helpers', () => {
  // ========================================
  // Grid Creation Helpers
  // ========================================
  describe('Grid Creation', () => {
    test('createEmptyGrid() создаёт пустую сетку заданного размера', () => {
      const grid = createEmptyGrid(8);

      expect(grid.length).toBe(8);
      expect(grid[0].length).toBe(8);

      // Все ячейки должны быть 0
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          expect(grid[y][x]).toBe(0);
        }
      }
    });

    test('createEmptyGrid() использует дефолтный размер', () => {
      const grid = createEmptyGrid();

      expect(grid.length).toBe(8);
    });

    test('createFilledGrid() создаёт заполненную сетку', () => {
      const grid = createFilledGrid(8);

      expect(grid.length).toBe(8);

      // Все ячейки должны быть 1
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          expect(grid[y][x]).toBe(1);
        }
      }
    });

    test('createGridFromPattern() создаёт копию паттерна', () => {
      const pattern = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1]
      ];

      const grid = createGridFromPattern(pattern);

      expect(grid).toEqual(pattern);

      // Проверяем что это копия, а не ссылка
      grid[0][0] = 999;
      expect(pattern[0][0]).toBe(1);
    });
  });

  // ========================================
  // Event Emitter Mock
  // ========================================
  describe('Event Emitter Mock', () => {
    let emitter;

    beforeEach(() => {
      emitter = createEventEmitterMock();
    });

    test('emit() записывает события', () => {
      emitter.emit('test:event', { value: 42 });

      const events = emitter.getEmittedEvents();

      expect(events.length).toBe(1);
      expect(events[0].event).toBe('test:event');
      expect(events[0].data.value).toBe(42);
    });

    test('on() регистрирует обработчик', () => {
      const handler = vi.fn();

      emitter.on('my:event', handler);
      emitter.emit('my:event', { foo: 'bar' });

      expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
    });

    test('off() удаляет обработчик', () => {
      const handler = vi.fn();

      emitter.on('my:event', handler);
      emitter.off('my:event', handler);
      emitter.emit('my:event', {});

      expect(handler).not.toHaveBeenCalled();
    });

    test('getLastEmitted() возвращает последнее событие указанного типа', () => {
      emitter.emit('type:a', { n: 1 });
      emitter.emit('type:b', { n: 2 });
      emitter.emit('type:a', { n: 3 });

      const lastA = emitter.getLastEmitted('type:a');

      expect(lastA.data.n).toBe(3);
    });

    test('getLastEmitted() возвращает null если нет событий', () => {
      const result = emitter.getLastEmitted('nonexistent');

      expect(result).toBeNull();
    });

    test('clearEmittedEvents() очищает историю', () => {
      emitter.emit('test', {});
      emitter.clearEmittedEvents();

      expect(emitter.getEmittedEvents().length).toBe(0);
    });
  });

  // ========================================
  // LocalStorage Mock
  // ========================================
  describe('LocalStorage Mock', () => {
    let storage;

    beforeEach(() => {
      storage = createLocalStorageMock();
    });

    test('setItem() и getItem() работают', () => {
      storage.setItem('key', 'value');

      expect(storage.getItem('key')).toBe('value');
    });

    test('getItem() возвращает null для несуществующего ключа', () => {
      expect(storage.getItem('nonexistent')).toBeNull();
    });

    test('removeItem() удаляет ключ', () => {
      storage.setItem('key', 'value');
      storage.removeItem('key');

      expect(storage.getItem('key')).toBeNull();
    });

    test('clear() очищает всё хранилище', () => {
      storage.setItem('a', '1');
      storage.setItem('b', '2');
      storage.clear();

      expect(storage.getItem('a')).toBeNull();
      expect(storage.getItem('b')).toBeNull();
    });

    test('_setStore() позволяет установить начальное состояние', () => {
      storage._setStore({
        'preloaded': 'data',
        'another': 'value'
      });

      expect(storage.getItem('preloaded')).toBe('data');
      expect(storage.getItem('another')).toBe('value');
    });

    test('setItem и getItem являются мок-функциями', () => {
      storage.setItem('test', 'value');

      expect(storage.setItem).toHaveBeenCalledWith('test', 'value');
    });
  });
});

describe('Config Validation', () => {
  // ========================================
  // Grid Config
  // ========================================
  describe('Grid Config', () => {
    test('GRID_SIZE равен 8', () => {
      expect(CONFIG.GRID_SIZE).toBe(8);
    });

    test('CELL_SIZE определён', () => {
      expect(CONFIG.CELL_SIZE).toBeDefined();
      expect(typeof CONFIG.CELL_SIZE).toBe('number');
    });

    test('SHAPES_PER_TURN равен 3', () => {
      expect(CONFIG.SHAPES_PER_TURN).toBe(3);
    });
  });

  // ========================================
  // Score Config
  // ========================================
  describe('Score Config', () => {
    test('PER_CELL определён', () => {
      expect(CONFIG.SCORE.PER_CELL).toBeDefined();
    });

    test('PER_LINE равен 100', () => {
      expect(CONFIG.SCORE.PER_LINE).toBe(100);
    });

    test('LINE_MULTIPLIER определён', () => {
      expect(CONFIG.SCORE.LINE_MULTIPLIER).toBeDefined();
    });

    test('COMBO_BONUS определён', () => {
      expect(CONFIG.SCORE.COMBO_BONUS).toBeDefined();
    });
  });

  // ========================================
  // Adaptive Weights
  // ========================================
  describe('Adaptive Weights', () => {
    test('ADAPTIVE_WEIGHTS массив с тирами', () => {
      expect(Array.isArray(CONFIG.ADAPTIVE_WEIGHTS)).toBe(true);
      expect(CONFIG.ADAPTIVE_WEIGHTS.length).toBeGreaterThan(0);
    });

    test('каждый тир имеет threshold и weights', () => {
      CONFIG.ADAPTIVE_WEIGHTS.forEach(tier => {
        expect(tier.threshold).toBeDefined();
        expect(tier.weights).toBeDefined();
        expect(tier.weights.tiny).toBeDefined();
        expect(tier.weights.small).toBeDefined();
        expect(tier.weights.medium).toBeDefined();
        expect(tier.weights.large).toBeDefined();
        expect(tier.weights.xlarge).toBeDefined();
      });
    });

    test('веса в каждом тире суммируются до 1', () => {
      CONFIG.ADAPTIVE_WEIGHTS.forEach(tier => {
        const sum = tier.weights.tiny + tier.weights.small + tier.weights.medium + tier.weights.large + tier.weights.xlarge;
        expect(sum).toBeCloseTo(1, 2);
      });
    });
  });
});

describe('Shapes Data Validation', () => {
  // ========================================
  // Shape Definitions
  // ========================================
  describe('Shape Definitions', () => {
    test('все определённые типы имеют blocks', () => {
      ALL_SHAPE_TYPES.forEach(type => {
        expect(SHAPES[type]).toBeDefined();
        expect(SHAPES[type].blocks).toBeDefined();
        expect(Array.isArray(SHAPES[type].blocks)).toBe(true);
      });
    });

    test('все блоки имеют координаты [x, y]', () => {
      ALL_SHAPE_TYPES.forEach(type => {
        SHAPES[type].blocks.forEach(block => {
          expect(Array.isArray(block)).toBe(true);
          expect(block.length).toBe(2);
          expect(typeof block[0]).toBe('number');
          expect(typeof block[1]).toBe('number');
        });
      });
    });

    test('координаты блоков неотрицательные', () => {
      ALL_SHAPE_TYPES.forEach(type => {
        SHAPES[type].blocks.forEach(([x, y]) => {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  // ========================================
  // Shape Groups
  // ========================================
  describe('Shape Groups', () => {
    test('SHAPE_GROUPS содержит все категории', () => {
      expect(SHAPE_GROUPS.tiny).toBeDefined();
      expect(SHAPE_GROUPS.small).toBeDefined();
      expect(SHAPE_GROUPS.medium).toBeDefined();
      expect(SHAPE_GROUPS.large).toBeDefined();
      expect(SHAPE_GROUPS.xlarge).toBeDefined();
    });

    test('все типы в группах существуют в SHAPES', () => {
      Object.values(SHAPE_GROUPS).forEach(group => {
        group.forEach(type => {
          expect(SHAPES[type]).toBeDefined();
        });
      });
    });

    test('single в группе tiny', () => {
      expect(SHAPE_GROUPS.tiny).toContain('single');
    });

    test('square3 в группе xlarge', () => {
      expect(SHAPE_GROUPS.xlarge).toContain('square3');
    });
  });

  // ========================================
  // ALL_SHAPE_TYPES
  // ========================================
  describe('ALL_SHAPE_TYPES', () => {
    test('содержит все ключи из SHAPES', () => {
      const shapeKeys = Object.keys(SHAPES);

      expect(ALL_SHAPE_TYPES.length).toBe(shapeKeys.length);

      shapeKeys.forEach(key => {
        expect(ALL_SHAPE_TYPES).toContain(key);
      });
    });
  });
});

describe('Events Constants', () => {
  // ========================================
  // Event Names
  // ========================================
  describe('Event Names', () => {
    test('все основные события определены', () => {
      expect(EVENTS.SHAPE_PLACED).toBeDefined();
      expect(EVENTS.PLACEMENT_REJECTED).toBeDefined();
      expect(EVENTS.LINES_CLEARED).toBeDefined();
      expect(EVENTS.SCORE_UPDATED).toBeDefined();
      expect(EVENTS.NEW_SHAPES_GENERATED).toBeDefined();
      expect(EVENTS.GAME_OVER).toBeDefined();
      expect(EVENTS.GAME_RESTARTED).toBeDefined();
    });

    test('события имеют уникальные значения', () => {
      const eventValues = Object.values(EVENTS);
      const uniqueValues = new Set(eventValues);

      expect(uniqueValues.size).toBe(eventValues.length);
    });
  });
});
