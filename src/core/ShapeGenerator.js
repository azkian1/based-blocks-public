import { CONFIG } from '../config.js';
import { EVENTS } from '../events.js';
import { SHAPES, SHAPE_GROUPS, ALL_SHAPE_TYPES } from '../data/shapes.js';
import { ShapeModel } from './ShapeModel.js';
import { LineClearer } from './LineClearer.js';
import { SolvabilityChecker } from './SolvabilityChecker.js';

// ShapeGenerator - Generates shapes with guaranteed sequential playability
// Owner: Agent A (Core Logic)
//
// API Contract:
// - generate(): ShapeModel[] - generate new set of shapes with solvability guarantee
// - canPlaceAnyShape(shapes): boolean - check if any shape can be placed
//
// The generator ensures that there exists at least one sequence of placements
// (considering line clears) that allows all shapes to be placed.

const MAX_FALLBACK_ATTEMPTS = 50;
const EXHAUSTIVE_THRESHOLD = 8; // If ≤8 fitting shapes, do full search

export class ShapeGenerator {
  constructor(eventEmitter, gridModel) {
    this.events = eventEmitter;
    this.gridModel = gridModel;
    this.lineClearer = new LineClearer();
    this.solvabilityChecker = new SolvabilityChecker(this.lineClearer);
  }

  // Generate a set of playable shapes with sequential solvability
  generate() {
    const maxAttempts = CONFIG.SOLVABILITY?.MAX_GENERATION_ATTEMPTS || 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shapes = this.generateRandomShapes(CONFIG.SHAPES_PER_TURN);

      // Validate sequential playability (accounts for line clears)
      if (this.validateSequentialPlayability(shapes)) {
        this.events.emit(EVENTS.NEW_SHAPES_GENERATED, {
          shapes: shapes.map(s => s.toData())
        });
        return shapes;
      }
    }

    // Fallback to smaller shapes if no solvable set found
    return this.generateFallbackShapes();
  }

  // Generate random shapes
  generateRandomShapes(count) {
    const shapes = [];
    const fillRate = this.gridModel.getOccupancy();

    for (let i = 0; i < count; i++) {
      const type = this.getRandomShapeType(fillRate);
      const colorId = Math.floor(Math.random() * CONFIG.COLOR_COUNT) + 1;
      shapes.push(new ShapeModel(type, colorId));
    }

    return shapes;
  }

  // Get adaptive weights based on grid fill rate
  getAdaptiveWeights(fillRate) {
    const adaptiveConfig = CONFIG.ADAPTIVE_WEIGHTS;

    for (const tier of adaptiveConfig) {
      if (fillRate <= tier.threshold) {
        return tier.weights;
      }
    }

    // Fallback to last tier
    return adaptiveConfig[adaptiveConfig.length - 1].weights;
  }

  // Get random shape type with adaptive weighted distribution
  getRandomShapeType(fillRate = 0) {
    const weights = this.getAdaptiveWeights(fillRate);

    const rand = Math.random();
    let cumulative = 0;

    for (const [group, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand < cumulative) {
        const types = SHAPE_GROUPS[group];
        return types[Math.floor(Math.random() * types.length)];
      }
    }

    // Fallback
    return 'single';
  }

  // Validate that shapes can all be placed sequentially (with line clears)
  validateSequentialPlayability(shapes) {
    const currentGrid = this.gridModel.getState();
    // Clone to avoid mutation
    const gridCopy = currentGrid.map(row => [...row]);
    return this.solvabilityChecker.checkSolvable(gridCopy, shapes);
  }

  // Generate fallback shapes using smart search
  // 1. Find ALL shapes that fit on current grid
  // 2. If few fitting shapes → exhaustive search (guaranteed to find solution)
  // 3. If many fitting shapes → random search (faster)
  generateFallbackShapes() {
    // Get all shapes that can physically fit on current grid
    const fittingTypes = this.getFittingShapeTypes();

    if (fittingTypes.length === 0) {
      // No shapes fit - game over
      return [];
    }

    // Try to find solvable combination for requested count
    for (let count = CONFIG.SHAPES_PER_TURN; count >= 1; count--) {
      const result = fittingTypes.length <= EXHAUSTIVE_THRESHOLD
        ? this.exhaustiveSearch(fittingTypes, count)
        : this.randomSearch(fittingTypes, count);

      if (result.length > 0) {
        this.events.emit(EVENTS.NEW_SHAPES_GENERATED, {
          shapes: result.map(s => s.toData())
        });
        return result;
      }
    }

    // Nothing works - true game over
    return [];
  }

  // Find all shape types that have at least one valid position on grid
  getFittingShapeTypes() {
    const fitting = [];

    for (const type of ALL_SHAPE_TYPES) {
      const testShape = new ShapeModel(type, 1);
      const positions = this.gridModel.findValidPositions(testShape);
      if (positions.length > 0) {
        fitting.push(type);
      }
    }

    // Sort by size (smaller first) for better fallback experience
    return fitting.sort((a, b) => {
      const sizeA = SHAPES[a].blocks.length;
      const sizeB = SHAPES[b].blocks.length;
      return sizeA - sizeB;
    });
  }

  // Exhaustive search: try all combinations (use when few shapes fit)
  exhaustiveSearch(types, count) {
    const combinations = this.getCombinations(types, count);

    // Shuffle to add variety (not always same shapes)
    this.shuffleArray(combinations);

    for (const combo of combinations) {
      const shapes = combo.map(type => {
        const colorId = Math.floor(Math.random() * CONFIG.COLOR_COUNT) + 1;
        return new ShapeModel(type, colorId);
      });

      if (this.validateSequentialPlayability(shapes)) {
        return shapes;
      }
    }

    return [];
  }

  // Random search: try random combinations (use when many shapes fit)
  randomSearch(types, count) {
    for (let attempt = 0; attempt < MAX_FALLBACK_ATTEMPTS; attempt++) {
      const shapes = [];
      for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const colorId = Math.floor(Math.random() * CONFIG.COLOR_COUNT) + 1;
        shapes.push(new ShapeModel(type, colorId));
      }

      if (this.validateSequentialPlayability(shapes)) {
        return shapes;
      }
    }

    return [];
  }

  // Generate all combinations of k elements from array
  getCombinations(arr, k) {
    if (k === 1) {
      return arr.map(x => [x]);
    }

    const result = [];

    for (let i = 0; i <= arr.length - k; i++) {
      const rest = this.getCombinations(arr.slice(i + 1), k - 1);
      for (const combo of rest) {
        result.push([arr[i], ...combo]);
      }
    }

    return result;
  }

  // Fisher-Yates shuffle
  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Check if any of the given shapes can be placed
  canPlaceAnyShape(shapes) {
    for (const shape of shapes) {
      const positions = this.gridModel.findValidPositions(shape);
      if (positions.length > 0) {
        return true;
      }
    }
    return false;
  }
}
