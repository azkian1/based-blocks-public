// Tests for ShapeModel
// Тестируемый файл: src/core/ShapeModel.js

import { describe, test, expect, beforeEach } from 'vitest';
import { ShapeModel } from '../../src/core/ShapeModel.js';
import { SHAPES } from '../../src/data/shapes.js';

describe('ShapeModel', () => {
  // ========================================
  // Создание фигур
  // ========================================
  describe('Creation', () => {
    test('создаёт фигуру с уникальным id', () => {
      const shape1 = new ShapeModel('single', 1);
      const shape2 = new ShapeModel('single', 1);

      expect(shape1.id).toBeDefined();
      expect(shape2.id).toBeDefined();
      expect(shape1.id).not.toBe(shape2.id);
    });

    test('сохраняет тип фигуры', () => {
      const shape = new ShapeModel('line3h', 1);

      expect(shape.type).toBe('line3h');
    });

    test('сохраняет colorId', () => {
      const shape = new ShapeModel('single', 5);

      expect(shape.colorId).toBe(5);
    });

    test('выбрасывает ошибку для неизвестного типа', () => {
      expect(() => {
        new ShapeModel('unknown_shape_type', 1);
      }).toThrow('Unknown shape type');
    });

    test('клонирует блоки (не мутирует оригинал)', () => {
      const originalBlocks = [...SHAPES['single'].blocks];
      const shape = new ShapeModel('single', 1);

      shape.blocks.push([10, 10]);

      expect(SHAPES['single'].blocks).toEqual(originalBlocks);
    });
  });

  // ========================================
  // Размеры фигур
  // ========================================
  describe('Dimensions', () => {
    test('getWidth() возвращает ширину фигуры', () => {
      const line3h = new ShapeModel('line3h', 1);
      const line3v = new ShapeModel('line3v', 1);

      expect(line3h.getWidth()).toBe(3);
      expect(line3v.getWidth()).toBe(1);
    });

    test('getHeight() возвращает высоту фигуры', () => {
      const line3h = new ShapeModel('line3h', 1);
      const line3v = new ShapeModel('line3v', 1);

      expect(line3h.getHeight()).toBe(1);
      expect(line3v.getHeight()).toBe(3);
    });

    test('getCellCount() возвращает количество блоков', () => {
      const single = new ShapeModel('single', 1);
      const square2 = new ShapeModel('square2', 1);
      const square3 = new ShapeModel('square3', 1);
      const line5h = new ShapeModel('line5h', 1);

      expect(single.getCellCount()).toBe(1);
      expect(square2.getCellCount()).toBe(4);
      expect(square3.getCellCount()).toBe(9);
      expect(line5h.getCellCount()).toBe(5);
    });
  });

  // ========================================
  // Специфические типы фигур
  // ========================================
  describe('Specific Shape Types', () => {
    test('single имеет width=1, height=1, cells=1', () => {
      const shape = new ShapeModel('single', 1);

      expect(shape.getWidth()).toBe(1);
      expect(shape.getHeight()).toBe(1);
      expect(shape.getCellCount()).toBe(1);
    });

    test('line5h имеет width=5, height=1, cells=5', () => {
      const shape = new ShapeModel('line5h', 1);

      expect(shape.getWidth()).toBe(5);
      expect(shape.getHeight()).toBe(1);
      expect(shape.getCellCount()).toBe(5);
    });

    test('line5v имеет width=1, height=5, cells=5', () => {
      const shape = new ShapeModel('line5v', 1);

      expect(shape.getWidth()).toBe(1);
      expect(shape.getHeight()).toBe(5);
      expect(shape.getCellCount()).toBe(5);
    });

    test('square2 имеет width=2, height=2, cells=4', () => {
      const shape = new ShapeModel('square2', 1);

      expect(shape.getWidth()).toBe(2);
      expect(shape.getHeight()).toBe(2);
      expect(shape.getCellCount()).toBe(4);
    });

    test('square3 имеет width=3, height=3, cells=9', () => {
      const shape = new ShapeModel('square3', 1);

      expect(shape.getWidth()).toBe(3);
      expect(shape.getHeight()).toBe(3);
      expect(shape.getCellCount()).toBe(9);
    });

    test('l_0 имеет корректные размеры', () => {
      const shape = new ShapeModel('l_0', 1);

      // L shape:
      // ▓
      // ▓
      // ▓▓
      expect(shape.getWidth()).toBe(2);
      expect(shape.getHeight()).toBe(3);
      expect(shape.getCellCount()).toBe(4);
    });

    test('corner_0 имеет корректные размеры', () => {
      const shape = new ShapeModel('corner_0', 1);

      // Corner:
      // ▓▓
      // ▓
      expect(shape.getWidth()).toBe(2);
      expect(shape.getHeight()).toBe(2);
      expect(shape.getCellCount()).toBe(3);
    });

    test('t_0 имеет корректные размеры', () => {
      const shape = new ShapeModel('t_0', 1);

      // T shape:
      // ▓▓▓
      //  ▓
      expect(shape.getWidth()).toBe(3);
      expect(shape.getHeight()).toBe(2);
      expect(shape.getCellCount()).toBe(4);
    });

    test('bigL_0 имеет корректные размеры', () => {
      const shape = new ShapeModel('bigL_0', 1);

      // Big L:
      // ▓
      // ▓
      // ▓▓▓
      expect(shape.getWidth()).toBe(3);
      expect(shape.getHeight()).toBe(3);
      expect(shape.getCellCount()).toBe(5);
    });

    test('rect_2x3 имеет корректные размеры', () => {
      const shape = new ShapeModel('rect_2x3', 1);

      // Rectangle 2x3:
      // ▓▓▓
      // ▓▓▓
      expect(shape.getWidth()).toBe(3);
      expect(shape.getHeight()).toBe(2);
      expect(shape.getCellCount()).toBe(6);
    });
  });

  // ========================================
  // Блоки
  // ========================================
  describe('Blocks', () => {
    test('blocks содержит относительные координаты', () => {
      const shape = new ShapeModel('line3h', 1);

      expect(shape.blocks).toContainEqual([0, 0]);
      expect(shape.blocks).toContainEqual([1, 0]);
      expect(shape.blocks).toContainEqual([2, 0]);
    });

    test('блоки начинаются с [0,0]', () => {
      // Все фигуры должны иметь блок в начале координат
      const shapeTypes = ['single', 'line3h', 'square2', 'l_0'];

      for (const type of shapeTypes) {
        const shape = new ShapeModel(type, 1);
        const hasOrigin = shape.blocks.some(([x, y]) => x === 0 && y === 0);
        expect(hasOrigin).toBe(true);
      }
    });
  });

  // ========================================
  // toData()
  // ========================================
  describe('toData()', () => {
    test('возвращает plain object с данными фигуры', () => {
      const shape = new ShapeModel('line3h', 2);
      const data = shape.toData();

      expect(data.id).toBe(shape.id);
      expect(data.type).toBe('line3h');
      expect(data.colorId).toBe(2);
      expect(data.blocks).toEqual(shape.blocks);
    });

    test('toData() возвращает копию блоков (не ссылку)', () => {
      const shape = new ShapeModel('single', 1);
      const data = shape.toData();

      // toData() returns a deep copy of blocks to prevent external mutation
      expect(data.blocks).not.toBe(shape.blocks);
      expect(data.blocks).toEqual(shape.blocks);

      // Verify mutation doesn't affect original
      data.blocks.push([999, 999]);
      expect(shape.blocks).not.toContainEqual([999, 999]);
    });
  });

  // ========================================
  // Кэширование размеров
  // ========================================
  describe('Dimension Caching', () => {
    test('размеры вычисляются один раз и кэшируются', () => {
      const shape = new ShapeModel('square3', 1);

      // Первый вызов
      const width1 = shape.getWidth();
      const height1 = shape.getHeight();

      // Мутируем блоки (не должно влиять на закэшированные размеры)
      shape.blocks.push([100, 100]);

      // Повторный вызов возвращает закэшированные значения
      expect(shape.getWidth()).toBe(width1);
      expect(shape.getHeight()).toBe(height1);
    });
  });
});
