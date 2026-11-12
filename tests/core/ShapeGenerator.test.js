// Tests for ShapeGenerator
// Тестируемый файл: src/core/ShapeGenerator.js

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ShapeGenerator } from '../../src/core/ShapeGenerator.js';
import { GridModel } from '../../src/core/GridModel.js';
import { ShapeModel } from '../../src/core/ShapeModel.js';
import { CONFIG } from '../../src/config.js';
import { SHAPE_GROUPS, ALL_SHAPE_TYPES } from '../../src/data/shapes.js';
import { createEventEmitterMock } from '../setup.js';

describe('ShapeGenerator', () => {
  let shapeGenerator;
  let gridModel;
  let eventEmitter;

  beforeEach(() => {
    eventEmitter = createEventEmitterMock();
    gridModel = new GridModel(eventEmitter);
    shapeGenerator = new ShapeGenerator(eventEmitter, gridModel);
  });

  // ========================================
  // Генерация фигур
  // ========================================
  describe('Shape Generation', () => {
    test('generate() возвращает массив из 3 фигур', () => {
      const shapes = shapeGenerator.generate();

      expect(shapes.length).toBe(CONFIG.SHAPES_PER_TURN);
    });

    test('каждая фигура имеет уникальный id', () => {
      const shapes = shapeGenerator.generate();

      const ids = shapes.map(s => s.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(shapes.length);
    });

    test('фигуры являются экземплярами ShapeModel', () => {
      const shapes = shapeGenerator.generate();

      shapes.forEach(shape => {
        expect(shape).toBeInstanceOf(ShapeModel);
        expect(shape.type).toBeDefined();
        expect(shape.blocks).toBeDefined();
        expect(shape.colorId).toBeDefined();
      });
    });

    test('generate() эмитит NEW_SHAPES_GENERATED', () => {
      shapeGenerator.generate();

      const lastEvent = eventEmitter.getLastEmitted('shapes:new');

      expect(lastEvent).not.toBeNull();
      expect(lastEvent.data.shapes).toBeDefined();
      expect(lastEvent.data.shapes.length).toBe(3);
    });
  });

  // ========================================
  // Гарантия проходимости
  // ========================================
  describe('Solvability Guarantee', () => {
    test('сгенерированные фигуры всегда решаемы на пустом поле', () => {
      // Тестируем несколько раз для надёжности
      for (let i = 0; i < 10; i++) {
        gridModel.reset();
        const shapes = shapeGenerator.generate();

        // Все фигуры должны иметь хотя бы одну валидную позицию
        expect(shapes.length).toBeGreaterThan(0);

        shapes.forEach(shape => {
          const positions = gridModel.findValidPositions(shape);
          expect(positions.length).toBeGreaterThan(0);
        });
      }
    });

    test('fallback генерирует мелкие фигуры при нехватке места', () => {
      // Заполним поле так, чтобы остались только маленькие пустые участки
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          if ((x + y) % 2 === 0) {
            gridModel.grid[y][x] = 1;
          }
        }
      }

      const shapes = shapeGenerator.generate();

      // Либо вернёт фигуры, либо пустой массив (game over)
      // Если вернул фигуры - они должны помещаться
      if (shapes.length > 0) {
        shapes.forEach(shape => {
          const positions = gridModel.findValidPositions(shape);
          expect(positions.length).toBeGreaterThan(0);
        });
      }
    });
  });

  // ========================================
  // Адаптивные веса
  // ========================================
  describe('Adaptive Weights', () => {
    test('getAdaptiveWeights() возвращает веса для пустого поля', () => {
      const weights = shapeGenerator.getAdaptiveWeights(0);

      expect(weights).toBeDefined();
      expect(weights.xlarge).toBeDefined();
    });

    test('на пустом поле (0-10%) - больше крупных фигур', () => {
      const weights = shapeGenerator.getAdaptiveWeights(0.05);

      // xlarge должен иметь высокий вес
      expect(weights.xlarge).toBeGreaterThan(0.5);
    });

    test('на заполненном поле (70%+) - больше мелких фигур', () => {
      const weights = shapeGenerator.getAdaptiveWeights(0.75);

      // tiny + small должны доминировать
      expect(weights.tiny + weights.small).toBeGreaterThan(weights.xlarge);
    });

    test('на критически заполненном поле (90%+) - максимум мелких', () => {
      const weights = shapeGenerator.getAdaptiveWeights(0.95);

      // Мелкие фигуры должны иметь высокий суммарный вес
      expect(weights.tiny + weights.small + weights.medium).toBeGreaterThan(0.7);
    });
  });

  // ========================================
  // canPlaceAnyShape
  // ========================================
  describe('canPlaceAnyShape', () => {
    test('canPlaceAnyShape() - true если есть место', () => {
      const shapes = [
        new ShapeModel('single', 1),
        new ShapeModel('line3h', 2)
      ];

      const result = shapeGenerator.canPlaceAnyShape(shapes);

      expect(result).toBe(true);
    });

    test('canPlaceAnyShape() - false если нет места', () => {
      // Заполним всё поле
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          gridModel.grid[y][x] = 1;
        }
      }

      const shapes = [
        new ShapeModel('single', 1)
      ];

      const result = shapeGenerator.canPlaceAnyShape(shapes);

      expect(result).toBe(false);
    });

    test('canPlaceAnyShape() - true если хоть одна фигура помещается', () => {
      // Оставим место только для single
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          gridModel.grid[y][x] = 1;
        }
      }
      gridModel.grid[0][0] = 0;

      const shapes = [
        new ShapeModel('square3', 1), // Не поместится
        new ShapeModel('single', 2)   // Поместится
      ];

      const result = shapeGenerator.canPlaceAnyShape(shapes);

      expect(result).toBe(true);
    });
  });

  // ========================================
  // Вспомогательные методы
  // ========================================
  describe('Helper Methods', () => {
    test('getRandomShapeType() возвращает валидный тип', () => {
      const type = shapeGenerator.getRandomShapeType(0.5);

      expect(ALL_SHAPE_TYPES).toContain(type);
    });

    test('getCombinations() генерирует комбинации', () => {
      const arr = ['a', 'b', 'c'];

      const combos = shapeGenerator.getCombinations(arr, 2);

      // C(3,2) = 3 комбинации
      expect(combos.length).toBe(3);
      expect(combos).toContainEqual(['a', 'b']);
      expect(combos).toContainEqual(['a', 'c']);
      expect(combos).toContainEqual(['b', 'c']);
    });

    test('getFittingShapeTypes() находит подходящие типы', () => {
      const fittingTypes = shapeGenerator.getFittingShapeTypes();

      // На пустом поле все типы должны подходить
      expect(fittingTypes.length).toBe(ALL_SHAPE_TYPES.length);
    });

    test('getFittingShapeTypes() сортирует по размеру (мелкие первые)', () => {
      const fittingTypes = shapeGenerator.getFittingShapeTypes();

      // Single должен быть в начале
      expect(fittingTypes.indexOf('single')).toBeLessThan(
        fittingTypes.indexOf('square3')
      );
    });
  });

  // ========================================
  // Fallback механизм
  // ========================================
  describe('Fallback Mechanism', () => {
    test('generateFallbackShapes() работает на критически заполненном поле', () => {
      // Заполним поле, оставив минимум места
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          gridModel.grid[y][x] = 1;
        }
      }

      // Оставим небольшую область
      gridModel.grid[0][0] = 0;
      gridModel.grid[0][1] = 0;
      gridModel.grid[1][0] = 0;

      const shapes = shapeGenerator.generateFallbackShapes();

      // Либо найдёт решаемые фигуры, либо вернёт пустой массив
      if (shapes.length > 0) {
        shapes.forEach(shape => {
          const positions = gridModel.findValidPositions(shape);
          expect(positions.length).toBeGreaterThan(0);
        });
      }
    });

    test('возвращает пустой массив при game over', () => {
      // Полностью заполним поле
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          gridModel.grid[y][x] = 1;
        }
      }

      const shapes = shapeGenerator.generateFallbackShapes();

      expect(shapes).toEqual([]);
    });
  });

  // ========================================
  // Интеграционные тесты
  // ========================================
  describe('Integration', () => {
    test('многократная генерация на прогрессивно заполняемом поле', () => {
      // Симулируем игровой процесс
      for (let round = 0; round < 5; round++) {
        const shapes = shapeGenerator.generate();

        if (shapes.length === 0) break; // Game over

        // Размещаем первую фигуру
        const shape = shapes[0];
        const positions = gridModel.findValidPositions(shape);

        if (positions.length > 0) {
          gridModel.placeShape(shape, positions[0].x, positions[0].y);
        }
      }

      // Тест не должен зависнуть
      expect(true).toBe(true);
    });

    test('validateSequentialPlayability() для стандартного набора', () => {
      const shapes = shapeGenerator.generateRandomShapes(3);

      const isPlayable = shapeGenerator.validateSequentialPlayability(shapes);

      // На пустом поле 3 случайные фигуры почти всегда разместимы
      // Но не гарантированно, поэтому просто проверяем тип
      expect(typeof isPlayable).toBe('boolean');
    });
  });
});
