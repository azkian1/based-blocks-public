// Tests for LineClearer
// Тестируемый файл: src/core/LineClearer.js

import { describe, test, expect, beforeEach } from 'vitest';
import { LineClearer } from '../../src/core/LineClearer.js';
import { CONFIG } from '../../src/config.js';
import { createEmptyGrid, createFilledGrid } from '../setup.js';

describe('LineClearer', () => {
  let lineClearer;

  beforeEach(() => {
    lineClearer = new LineClearer();
  });

  // ========================================
  // Детекция горизонтальных линий
  // ========================================
  describe('Horizontal Line Detection', () => {
    test('checkFullLines() находит полную горизонтальную линию', () => {
      const grid = createEmptyGrid();

      // Заполним первый ряд
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        grid[0][x] = 1;
      }

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(rows).toContain(0);
      expect(rows.length).toBe(1);
      expect(cols.length).toBe(0);
    });

    test('checkFullLines() находит несколько горизонтальных линий', () => {
      const grid = createEmptyGrid();

      // Заполним ряды 0 и 7
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        grid[0][x] = 1;
        grid[7][x] = 1;
      }

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(rows).toContain(0);
      expect(rows).toContain(7);
      expect(rows.length).toBe(2);
    });

    test('не находит неполную горизонтальную линию', () => {
      const grid = createEmptyGrid();

      // Заполним все кроме одной ячейки
      for (let x = 0; x < CONFIG.GRID_SIZE - 1; x++) {
        grid[0][x] = 1;
      }

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(rows.length).toBe(0);
    });
  });

  // ========================================
  // Детекция вертикальных линий
  // ========================================
  describe('Vertical Line Detection', () => {
    test('checkFullLines() находит полную вертикальную линию', () => {
      const grid = createEmptyGrid();

      // Заполним первую колонку
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        grid[y][0] = 1;
      }

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(cols).toContain(0);
      expect(cols.length).toBe(1);
      expect(rows.length).toBe(0);
    });

    test('checkFullLines() находит несколько вертикальных линий', () => {
      const grid = createEmptyGrid();

      // Заполним колонки 0 и 7
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        grid[y][0] = 1;
        grid[y][7] = 1;
      }

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(cols).toContain(0);
      expect(cols).toContain(7);
      expect(cols.length).toBe(2);
    });

    test('не находит неполную вертикальную линию', () => {
      const grid = createEmptyGrid();

      // Заполним все кроме одной ячейки
      for (let y = 0; y < CONFIG.GRID_SIZE - 1; y++) {
        grid[y][0] = 1;
      }

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(cols.length).toBe(0);
    });
  });

  // ========================================
  // Комбинированная детекция
  // ========================================
  describe('Combined Detection', () => {
    test('checkFullLines() находит одновременно горизонтальную и вертикальную линии', () => {
      const grid = createEmptyGrid();

      // Заполним ряд 0 и колонку 0
      for (let i = 0; i < CONFIG.GRID_SIZE; i++) {
        grid[0][i] = 1;
        grid[i][0] = 1;
      }

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(rows).toContain(0);
      expect(cols).toContain(0);
    });

    test('checkFullLines() возвращает пустой результат без линий', () => {
      const grid = createEmptyGrid();

      // Разбросаем несколько блоков
      grid[0][0] = 1;
      grid[3][3] = 1;
      grid[7][7] = 1;

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(rows.length).toBe(0);
      expect(cols.length).toBe(0);
    });
  });

  // ========================================
  // Очистка линий
  // ========================================
  describe('Line Clearing', () => {
    test('clearLines() удаляет ячейки из сетки (rows)', () => {
      const grid = createEmptyGrid();

      // Заполним ряд 0
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        grid[0][x] = 1;
      }

      lineClearer.clearLines(grid, [0], []);

      // Проверяем что ряд очищен
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        expect(grid[0][x]).toBe(0);
      }
    });

    test('clearLines() удаляет ячейки из сетки (cols)', () => {
      const grid = createEmptyGrid();

      // Заполним колонку 0
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        grid[y][0] = 1;
      }

      lineClearer.clearLines(grid, [], [0]);

      // Проверяем что колонка очищена
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        expect(grid[y][0]).toBe(0);
      }
    });

    test('clearLines() возвращает очищенные координаты', () => {
      const grid = createEmptyGrid();

      // Заполним ряд 0
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        grid[0][x] = 1;
      }

      const result = lineClearer.clearLines(grid, [0], []);

      expect(result.clearedCount).toBe(1);
      expect(result.cells.length).toBe(CONFIG.GRID_SIZE);

      // Проверяем координаты
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        expect(result.cells.find(c => c.x === x && c.y === 0)).toBeDefined();
      }
    });

    test('clearLines() возвращает colorId для каждой ячейки', () => {
      const grid = createEmptyGrid();

      // Заполним ряд разными цветами
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        grid[0][x] = (x % 2) + 1; // Чередование 1 и 2
      }

      const result = lineClearer.clearLines(grid, [0], []);

      result.cells.forEach(cell => {
        expect(cell.colorId).toBeDefined();
        expect([1, 2]).toContain(cell.colorId);
      });
    });

    test('clearLines() не дублирует ячейки на пересечении', () => {
      const grid = createEmptyGrid();

      // Заполним ряд 0 и колонку 0
      for (let i = 0; i < CONFIG.GRID_SIZE; i++) {
        grid[0][i] = 1;
        grid[i][0] = 1;
      }

      const result = lineClearer.clearLines(grid, [0], [0]);

      // Должно быть 8 + 7 = 15 ячеек (пересечение считается один раз)
      expect(result.cells.length).toBe(15);
      expect(result.clearedCount).toBe(2); // 1 row + 1 col
    });
  });

  // ========================================
  // Edge Cases
  // ========================================
  describe('Edge Cases', () => {
    test('работает с пустой сеткой', () => {
      const grid = createEmptyGrid();

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(rows.length).toBe(0);
      expect(cols.length).toBe(0);
    });

    test('работает с полностью заполненной сеткой', () => {
      const grid = createFilledGrid();

      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(rows.length).toBe(CONFIG.GRID_SIZE);
      expect(cols.length).toBe(CONFIG.GRID_SIZE);
    });

    test('clearLines() на полностью заполненной сетке', () => {
      const grid = createFilledGrid();

      const { rows, cols } = lineClearer.checkFullLines(grid);
      const result = lineClearer.clearLines(grid, rows, cols);

      // Все ячейки должны быть очищены
      expect(result.clearedCount).toBe(CONFIG.GRID_SIZE * 2); // 8 rows + 8 cols

      // Сетка должна быть пустой
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          expect(grid[y][x]).toBe(0);
        }
      }
    });

    test('обрабатывает невалидную сетку gracefully', () => {
      // Невалидный массив
      const { rows, cols } = lineClearer.checkFullLines([]);

      expect(rows.length).toBe(0);
      expect(cols.length).toBe(0);
    });

    test('clearLines() обрабатывает невалидные индексы', () => {
      const grid = createEmptyGrid();

      // Заполним ряд
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        grid[0][x] = 1;
      }

      // Передаём невалидные индексы
      const result = lineClearer.clearLines(grid, [0, -1, 100], []);

      // Должен обработать только валидный индекс
      expect(result.clearedCount).toBe(1);
    });
  });

  // ========================================
  // Интеграционные тесты
  // ========================================
  describe('Integration', () => {
    test('check и clear работают вместе', () => {
      const grid = createEmptyGrid();

      // Заполним ряд 3 и колонку 5
      for (let i = 0; i < CONFIG.GRID_SIZE; i++) {
        grid[3][i] = 1;
        grid[i][5] = 2;
      }

      // Детектируем
      const { rows, cols } = lineClearer.checkFullLines(grid);

      expect(rows).toContain(3);
      expect(cols).toContain(5);

      // Очищаем
      const result = lineClearer.clearLines(grid, rows, cols);

      expect(result.clearedCount).toBe(2);

      // Проверяем что всё очищено
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        expect(grid[3][x]).toBe(0);
      }
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        expect(grid[y][5]).toBe(0);
      }
    });
  });
});
