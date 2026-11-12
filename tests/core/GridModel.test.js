// Tests for GridModel
// Тестируемый файл: src/core/GridModel.js

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GridModel } from '../../src/core/GridModel.js';
import { ShapeModel } from '../../src/core/ShapeModel.js';
import { createEventEmitterMock } from '../setup.js';
import { CONFIG } from '../../src/config.js';

describe('GridModel', () => {
  let gridModel;
  let eventEmitter;

  beforeEach(() => {
    eventEmitter = createEventEmitterMock();
    gridModel = new GridModel(eventEmitter);
  });

  // ========================================
  // Инициализация
  // ========================================
  describe('Initialization', () => {
    test('создаёт пустую сетку 8x8', () => {
      const state = gridModel.getState();

      expect(state.length).toBe(CONFIG.GRID_SIZE);
      expect(state[0].length).toBe(CONFIG.GRID_SIZE);

      // Все ячейки должны быть пустыми (0)
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          expect(state[y][x]).toBe(0);
        }
      }
    });

    test('getState() возвращает сетку', () => {
      const state = gridModel.getState();

      expect(state).toBeDefined();
      expect(Array.isArray(state)).toBe(true);
      expect(state.length).toBe(CONFIG.GRID_SIZE);
    });
  });

  // ========================================
  // Проверка позиций
  // ========================================
  describe('Position Validation', () => {
    test('isValidPosition() - true для валидных координат', () => {
      expect(gridModel.isValidPosition(0, 0)).toBe(true);
      expect(gridModel.isValidPosition(7, 7)).toBe(true);
      expect(gridModel.isValidPosition(4, 4)).toBe(true);
    });

    test('isValidPosition() - false за границами', () => {
      expect(gridModel.isValidPosition(-1, 0)).toBe(false);
      expect(gridModel.isValidPosition(0, -1)).toBe(false);
      expect(gridModel.isValidPosition(8, 0)).toBe(false);
      expect(gridModel.isValidPosition(0, 8)).toBe(false);
      expect(gridModel.isValidPosition(10, 10)).toBe(false);
    });

    test('getCellState() возвращает 0 для пустой ячейки', () => {
      expect(gridModel.getCellState(0, 0)).toBe(0);
      expect(gridModel.getCellState(5, 5)).toBe(0);
    });

    test('getCellState() возвращает -1 за границами', () => {
      expect(gridModel.getCellState(-1, 0)).toBe(-1);
      expect(gridModel.getCellState(0, 8)).toBe(-1);
    });

    test('isCellEmpty() возвращает true для пустой ячейки', () => {
      expect(gridModel.isCellEmpty(0, 0)).toBe(true);
    });
  });

  // ========================================
  // Размещение фигур
  // ========================================
  describe('Shape Placement', () => {
    test('canPlaceShape() - true для валидной позиции', () => {
      const shape = new ShapeModel('line3h', 1);

      expect(gridModel.canPlaceShape(shape, 0, 0)).toBe(true);
      expect(gridModel.canPlaceShape(shape, 5, 0)).toBe(true);
    });

    test('canPlaceShape() - false за границами', () => {
      const shape = new ShapeModel('line3h', 1);

      // Линия 3 блока горизонтально не влезет начиная с x=6
      expect(gridModel.canPlaceShape(shape, 6, 0)).toBe(false);
      expect(gridModel.canPlaceShape(shape, 7, 0)).toBe(false);
    });

    test('canPlaceShape() - false для занятых ячеек', () => {
      const shape1 = new ShapeModel('line3h', 1);
      const shape2 = new ShapeModel('single', 2);

      // Разместим первую фигуру
      gridModel.placeShape(shape1, 0, 0);

      // Попробуем разместить вторую на занятые ячейки
      expect(gridModel.canPlaceShape(shape2, 0, 0)).toBe(false);
      expect(gridModel.canPlaceShape(shape2, 1, 0)).toBe(false);
      expect(gridModel.canPlaceShape(shape2, 2, 0)).toBe(false);

      // Но соседняя ячейка свободна
      expect(gridModel.canPlaceShape(shape2, 3, 0)).toBe(true);
    });

    test('placeShape() размещает блоки на сетке', () => {
      const shape = new ShapeModel('line3h', 1);

      gridModel.placeShape(shape, 0, 0);

      expect(gridModel.getCellState(0, 0)).toBe(1);
      expect(gridModel.getCellState(1, 0)).toBe(1);
      expect(gridModel.getCellState(2, 0)).toBe(1);
      expect(gridModel.getCellState(3, 0)).toBe(0); // Соседняя пустая
    });

    test('placeShape() возвращает true при успехе', () => {
      const shape = new ShapeModel('single', 1);

      const result = gridModel.placeShape(shape, 0, 0);

      expect(result).toBe(true);
    });

    test('placeShape() возвращает false при неудаче', () => {
      const shape1 = new ShapeModel('single', 1);
      const shape2 = new ShapeModel('single', 2);

      gridModel.placeShape(shape1, 0, 0);
      const result = gridModel.placeShape(shape2, 0, 0);

      expect(result).toBe(false);
    });

    test('placeShape() эмитит SHAPE_PLACED при успехе', () => {
      const shape = new ShapeModel('single', 1);

      gridModel.placeShape(shape, 0, 0);

      const lastEvent = eventEmitter.getLastEmitted('shape:placed');
      expect(lastEvent).not.toBeNull();
      expect(lastEvent.data.shapeId).toBe(shape.id);
      expect(lastEvent.data.gridX).toBe(0);
      expect(lastEvent.data.gridY).toBe(0);
    });

    test('placeShape() эмитит PLACEMENT_REJECTED при неудаче', () => {
      const shape1 = new ShapeModel('single', 1);
      const shape2 = new ShapeModel('single', 2);

      gridModel.placeShape(shape1, 0, 0);
      gridModel.placeShape(shape2, 0, 0);

      const lastEvent = eventEmitter.getLastEmitted('shape:rejected');
      expect(lastEvent).not.toBeNull();
      expect(lastEvent.data.reason).toBe('occupied');
    });

    test('placeShape() сохраняет colorId', () => {
      const shape = new ShapeModel('single', 5);

      gridModel.placeShape(shape, 3, 3);

      expect(gridModel.getCellState(3, 3)).toBe(5);
    });
  });

  // ========================================
  // Поиск позиций
  // ========================================
  describe('Finding Valid Positions', () => {
    test('findValidPositions() находит все валидные позиции', () => {
      const shape = new ShapeModel('single', 1);

      const positions = gridModel.findValidPositions(shape);

      // Single shape can be placed at all 64 positions on empty grid
      expect(positions.length).toBe(64);
    });

    test('findValidPositions() учитывает размер фигуры', () => {
      const shape = new ShapeModel('line5h', 1);

      const positions = gridModel.findValidPositions(shape);

      // 5-block horizontal line: x can be 0-3 (4 positions), y can be 0-7 (8 rows)
      expect(positions.length).toBe(4 * 8);
    });

    test('findValidPositions() возвращает [] когда нет места', () => {
      // Заполним всю сетку
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          gridModel.grid[y][x] = 1;
        }
      }

      const shape = new ShapeModel('single', 1);
      const positions = gridModel.findValidPositions(shape);

      expect(positions.length).toBe(0);
    });

    test('findValidPositions() обходит занятые ячейки', () => {
      // Разместим одну фигуру
      const shape1 = new ShapeModel('single', 1);
      gridModel.placeShape(shape1, 0, 0);

      const shape2 = new ShapeModel('single', 2);
      const positions = gridModel.findValidPositions(shape2);

      expect(positions.length).toBe(63); // 64 - 1
      expect(positions.find(p => p.x === 0 && p.y === 0)).toBeUndefined();
    });
  });

  // ========================================
  // Метрики
  // ========================================
  describe('Occupancy Metrics', () => {
    test('getOccupancy() возвращает 0 для пустой сетки', () => {
      expect(gridModel.getOccupancy()).toBe(0);
    });

    test('getOccupancy() возвращает корректное значение', () => {
      const shape = new ShapeModel('square2', 1); // 4 блока
      gridModel.placeShape(shape, 0, 0);

      // 4 / 64 = 0.0625
      expect(gridModel.getOccupancy()).toBeCloseTo(4 / 64, 4);
    });

    test('getOccupancy() возвращает 1 для заполненной сетки', () => {
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          gridModel.grid[y][x] = 1;
        }
      }

      expect(gridModel.getOccupancy()).toBe(1);
    });
  });

  // ========================================
  // Reset
  // ========================================
  describe('Reset', () => {
    test('reset() очищает сетку', () => {
      // Заполним сетку
      const shape = new ShapeModel('square3', 1);
      gridModel.placeShape(shape, 0, 0);

      expect(gridModel.getOccupancy()).toBeGreaterThan(0);

      gridModel.reset();

      expect(gridModel.getOccupancy()).toBe(0);

      // Все ячейки пустые
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          expect(gridModel.getCellState(x, y)).toBe(0);
        }
      }
    });
  });
});
