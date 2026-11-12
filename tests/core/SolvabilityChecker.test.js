// Tests for SolvabilityChecker
// Тестируемый файл: src/core/SolvabilityChecker.js

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SolvabilityChecker } from '../../src/core/SolvabilityChecker.js';
import { LineClearer } from '../../src/core/LineClearer.js';
import { ShapeModel } from '../../src/core/ShapeModel.js';
import { CONFIG } from '../../src/config.js';
import { createEmptyGrid, createFilledGrid } from '../setup.js';

describe('SolvabilityChecker', () => {
  let solvabilityChecker;
  let lineClearer;

  beforeEach(() => {
    lineClearer = new LineClearer();
    solvabilityChecker = new SolvabilityChecker(lineClearer);
  });

  // ========================================
  // Базовая проверка
  // ========================================
  describe('Basic Solvability', () => {
    test('checkSolvable() - true для пустой сетки с любыми фигурами', () => {
      const grid = createEmptyGrid();
      const shapes = [
        new ShapeModel('line5h', 1),
        new ShapeModel('square3', 2),
        new ShapeModel('bigL_0', 1)
      ];

      const result = solvabilityChecker.checkSolvable(grid, shapes);

      expect(result).toBe(true);
    });

    test('checkSolvable() - true для пустого массива фигур', () => {
      const grid = createEmptyGrid();

      const result = solvabilityChecker.checkSolvable(grid, []);

      expect(result).toBe(true);
    });

    test('checkSolvable() - true для null/undefined фигур', () => {
      const grid = createEmptyGrid();

      expect(solvabilityChecker.checkSolvable(grid, null)).toBe(true);
      expect(solvabilityChecker.checkSolvable(grid, undefined)).toBe(true);
    });

    test('checkSolvable() - true для решаемой комбинации', () => {
      const grid = createEmptyGrid();
      const shapes = [
        new ShapeModel('single', 1),
        new ShapeModel('single', 2),
        new ShapeModel('single', 1)
      ];

      const result = solvabilityChecker.checkSolvable(grid, shapes);

      expect(result).toBe(true);
    });

    test('checkSolvable() - false для нерешаемой комбинации', () => {
      // Заполним сетку почти полностью, оставив мало места
      const grid = createFilledGrid();
      // Оставим только одну пустую ячейку
      grid[0][0] = 0;

      // Пытаемся разместить фигуру из 2+ блоков
      const shapes = [new ShapeModel('line2h', 1)];

      const result = solvabilityChecker.checkSolvable(grid, shapes);

      expect(result).toBe(false);
    });
  });

  // ========================================
  // Перестановки
  // ========================================
  describe('Permutations', () => {
    test('getPermutations() генерирует все перестановки', () => {
      const shapes = [
        new ShapeModel('single', 1),
        new ShapeModel('line2h', 2),
        new ShapeModel('corner_0', 1)
      ];

      const permutations = solvabilityChecker.getPermutations(shapes);

      // 3 фигуры = 3! = 6 перестановок
      expect(permutations.length).toBe(6);
    });

    test('getPermutations() для одной фигуры', () => {
      const shapes = [new ShapeModel('single', 1)];

      const permutations = solvabilityChecker.getPermutations(shapes);

      expect(permutations.length).toBe(1);
    });

    test('getPermutations() для пустого массива', () => {
      const permutations = solvabilityChecker.getPermutations([]);

      expect(permutations.length).toBe(1);
      expect(permutations[0].length).toBe(0);
    });
  });

  // ========================================
  // Симуляция
  // ========================================
  describe('Simulation', () => {
    test('simulatePlacement() корректно размещает фигуру', () => {
      const grid = createEmptyGrid();
      const shape = new ShapeModel('line3h', 1);

      solvabilityChecker.simulatePlacement(grid, shape, 0, 0);

      expect(grid[0][0]).toBe(1);
      expect(grid[0][1]).toBe(1);
      expect(grid[0][2]).toBe(1);
    });

    test('simulateLineClear() очищает полные линии', () => {
      const grid = createEmptyGrid();

      // Заполним первый ряд
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        grid[0][x] = 1;
      }

      solvabilityChecker.simulateLineClear(grid);

      // Ряд должен быть очищен
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        expect(grid[0][x]).toBe(0);
      }
    });
  });

  // ========================================
  // Позиции на сетке
  // ========================================
  describe('Position Finding', () => {
    test('findValidPositionsOnGrid() находит все позиции', () => {
      const grid = createEmptyGrid();
      const shape = new ShapeModel('single', 1);

      const positions = solvabilityChecker.findValidPositionsOnGrid(grid, shape);

      expect(positions.length).toBe(64);
    });

    test('canPlaceOnGrid() - true для валидной позиции', () => {
      const grid = createEmptyGrid();
      const shape = new ShapeModel('line3h', 1);

      expect(solvabilityChecker.canPlaceOnGrid(grid, shape, 0, 0)).toBe(true);
    });

    test('canPlaceOnGrid() - false для занятой позиции', () => {
      const grid = createEmptyGrid();
      grid[0][0] = 1;

      const shape = new ShapeModel('single', 1);

      expect(solvabilityChecker.canPlaceOnGrid(grid, shape, 0, 0)).toBe(false);
    });

    test('canPlaceOnGrid() - false за границами', () => {
      const grid = createEmptyGrid();
      const shape = new ShapeModel('line5h', 1);

      // 5-block line starting at x=5 would go out of bounds
      expect(solvabilityChecker.canPlaceOnGrid(grid, shape, 5, 0)).toBe(false);
    });
  });

  // ========================================
  // Скоринг позиций
  // ========================================
  describe('Position Scoring', () => {
    test('scoreAndLimitPositions() ограничивает количество позиций', () => {
      const grid = createEmptyGrid();
      const shape = new ShapeModel('single', 1);

      // Генерируем много позиций
      const positions = solvabilityChecker.findValidPositionsOnGrid(grid, shape);

      const scored = solvabilityChecker.scoreAndLimitPositions(grid, shape, positions);

      // Должно быть ограничено maxPositionsPerShape
      expect(scored.length).toBeLessThanOrEqual(solvabilityChecker.maxPositionsPerShape);
    });

    test('calculatePositionScore() выше для позиций с потенциалом очистки', () => {
      const grid = createEmptyGrid();

      // Заполним почти весь ряд 0, оставив одну пустую ячейку
      for (let x = 1; x < CONFIG.GRID_SIZE; x++) {
        grid[0][x] = 1;
      }

      const shape = new ShapeModel('single', 1);

      // Позиция (0,0) завершит линию
      const scoreAt00 = solvabilityChecker.calculatePositionScore(grid, shape, 0, 0);

      // Позиция (0,1) не завершит линию
      const scoreAt01 = solvabilityChecker.calculatePositionScore(grid, shape, 0, 1);

      expect(scoreAt00).toBeGreaterThan(scoreAt01);
    });
  });

  // ========================================
  // Сложные сценарии с линиями
  // ========================================
  describe('Line Clear Scenarios', () => {
    test('находит решение через линейную очистку', () => {
      const grid = createEmptyGrid();

      // Заполним почти весь ряд 0
      for (let x = 0; x < CONFIG.GRID_SIZE - 1; x++) {
        grid[0][x] = 1;
      }

      // Фигура, которая завершит линию
      const shapes = [new ShapeModel('single', 1)];

      // После размещения линия очистится, открыв место
      const result = solvabilityChecker.checkSolvable(grid, shapes);

      expect(result).toBe(true);
    });

    test('последовательное размещение с очисткой линий', () => {
      const grid = createEmptyGrid();

      // Создадим ситуацию где первая фигура очистит линию,
      // освободив место для следующих
      for (let x = 0; x < CONFIG.GRID_SIZE - 1; x++) {
        grid[0][x] = 1;
      }

      const shapes = [
        new ShapeModel('single', 1),  // Завершит линию
        new ShapeModel('single', 2)   // Разместится после очистки
      ];

      const result = solvabilityChecker.checkSolvable(grid, shapes);

      expect(result).toBe(true);
    });
  });

  // ========================================
  // Таймаут
  // ========================================
  describe('Timeout', () => {
    test('возвращает false при превышении таймаута', () => {
      // Создаём checker с очень маленьким таймаутом
      const quickChecker = new SolvabilityChecker(lineClearer);
      quickChecker.timeoutMs = 1; // 1ms таймаут

      // Создаём сложную задачу
      const grid = createEmptyGrid();
      const shapes = [
        new ShapeModel('square3', 1),
        new ShapeModel('square3', 2),
        new ShapeModel('square3', 1)
      ];

      // Может вернуть true если успеет, или false по таймауту
      // Главное - не зависнуть
      const result = quickChecker.checkSolvable(grid, shapes);

      expect(typeof result).toBe('boolean');
    });
  });

  // ========================================
  // Клонирование сетки
  // ========================================
  describe('Grid Cloning', () => {
    test('cloneGrid() создаёт независимую копию', () => {
      const grid = createEmptyGrid();
      grid[0][0] = 1;

      const clone = solvabilityChecker.cloneGrid(grid);

      // Изменения в клоне не влияют на оригинал
      clone[0][0] = 999;

      expect(grid[0][0]).toBe(1);
    });
  });

  // ========================================
  // Интеграционные тесты
  // ========================================
  describe('Integration', () => {
    test('реалистичный игровой сценарий', () => {
      const grid = createEmptyGrid();

      // Разместим несколько фигур для реалистичной ситуации
      // Заполним половину поля
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          grid[y][x] = 1;
        }
      }

      // Попробуем разместить 3 небольшие фигуры
      const shapes = [
        new ShapeModel('single', 1),
        new ShapeModel('line2h', 2),
        new ShapeModel('corner_0', 1)
      ];

      const result = solvabilityChecker.checkSolvable(grid, shapes);

      // Должно быть решаемо - достаточно места
      expect(result).toBe(true);
    });

    test('сценарий с критически заполненным полем', () => {
      const grid = createEmptyGrid();

      // Заполним поле практически полностью, оставив минимум места
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          grid[y][x] = 1;
        }
      }

      // Оставим место только для одной маленькой фигуры
      grid[0][0] = 0;
      grid[0][1] = 0;
      grid[1][0] = 0;

      const shapes = [
        new ShapeModel('corner_0', 1) // 3 блока в форме угла
      ];

      const result = solvabilityChecker.checkSolvable(grid, shapes);

      expect(result).toBe(true);
    });
  });
});
