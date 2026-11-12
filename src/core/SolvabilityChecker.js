import { CONFIG } from '../config.js';

// SolvabilityChecker - Verifies that a set of shapes can be placed sequentially
// Owner: Agent A (Core Logic)
//
// Uses DFS with heuristics to find at least one valid placement sequence,
// accounting for line clears that free up space for subsequent shapes.

export class SolvabilityChecker {
  constructor(lineClearer) {
    this.lineClearer = lineClearer;
    this.timeoutMs = CONFIG.SOLVABILITY?.TIMEOUT_MS || 100;
    this.maxPositionsPerShape = CONFIG.SOLVABILITY?.MAX_POSITIONS_PER_SHAPE || 20;
  }

  /**
   * Check if shapes can all be placed in some order
   * @param {number[][]} grid - current grid state (8x8)
   * @param {ShapeModel[]} shapes - shapes to place
   * @returns {boolean} - true if at least one valid sequence exists
   */
  checkSolvable(grid, shapes) {
    if (!shapes || shapes.length === 0) return true;

    const startTime = performance.now();
    const permutations = this.getPermutations(shapes);

    for (const orderedShapes of permutations) {
      if (performance.now() - startTime > this.timeoutMs) {
        return false; // timeout
      }

      if (this.canPlaceSequentially(grid, orderedShapes, startTime)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Recursively check if shapes can be placed in given order
   */
  canPlaceSequentially(grid, remainingShapes, startTime) {
    if (performance.now() - startTime > this.timeoutMs) {
      return false;
    }

    if (remainingShapes.length === 0) {
      return true; // all shapes placed successfully
    }

    const shape = remainingShapes[0];
    const nextShapes = remainingShapes.slice(1);

    // Find valid positions for current shape
    let positions = this.findValidPositionsOnGrid(grid, shape);

    // Limit and prioritize positions
    positions = this.scoreAndLimitPositions(grid, shape, positions);

    for (const { x, y } of positions) {
      // Clone grid for simulation
      const gridCopy = this.cloneGrid(grid);

      // Simulate placement
      this.simulatePlacement(gridCopy, shape, x, y);

      // Simulate line clear
      this.simulateLineClear(gridCopy);

      // Recurse with remaining shapes
      if (this.canPlaceSequentially(gridCopy, nextShapes, startTime)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find all valid positions for shape on given grid
   */
  findValidPositionsOnGrid(grid, shape) {
    const positions = [];
    const maxX = CONFIG.GRID_SIZE - shape.getWidth();
    const maxY = CONFIG.GRID_SIZE - shape.getHeight();

    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        if (this.canPlaceOnGrid(grid, shape, x, y)) {
          positions.push({ x, y });
        }
      }
    }

    return positions;
  }

  /**
   * Check if shape can be placed at position on given grid
   */
  canPlaceOnGrid(grid, shape, gridX, gridY) {
    return shape.blocks.every(([dx, dy]) => {
      const x = gridX + dx;
      const y = gridY + dy;
      return (
        x >= 0 && x < CONFIG.GRID_SIZE &&
        y >= 0 && y < CONFIG.GRID_SIZE &&
        grid[y][x] === 0
      );
    });
  }

  /**
   * Score positions by line-clearing potential and limit count
   */
  scoreAndLimitPositions(grid, shape, positions) {
    if (positions.length <= this.maxPositionsPerShape) {
      // Few positions - score and sort them
      return positions
        .map(pos => ({
          ...pos,
          score: this.calculatePositionScore(grid, shape, pos.x, pos.y)
        }))
        .sort((a, b) => b.score - a.score);
    }

    // Many positions - score, sort, and limit
    return positions
      .map(pos => ({
        ...pos,
        score: this.calculatePositionScore(grid, shape, pos.x, pos.y)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, this.maxPositionsPerShape);
  }

  /**
   * Calculate heuristic score for a position
   * Higher score = more likely to lead to solution
   */
  calculatePositionScore(grid, shape, x, y) {
    let score = 0;

    // Simulate placement to check line clears
    const testGrid = this.cloneGrid(grid);
    this.simulatePlacement(testGrid, shape, x, y);

    // +10 per line that would be cleared
    const { rows, cols } = this.lineClearer.checkFullLines(testGrid);
    score += (rows.length + cols.length) * 10;

    // +1 for cells near edges (helps complete lines)
    shape.blocks.forEach(([dx, dy]) => {
      const cellX = x + dx;
      const cellY = y + dy;
      if (cellX === 0 || cellX === CONFIG.GRID_SIZE - 1) score += 1;
      if (cellY === 0 || cellY === CONFIG.GRID_SIZE - 1) score += 1;
    });

    return score;
  }

  /**
   * Place shape on grid (mutates grid)
   */
  simulatePlacement(grid, shape, x, y) {
    const colorId = shape.colorId || 1;
    shape.blocks.forEach(([dx, dy]) => {
      grid[y + dy][x + dx] = colorId;
    });
  }

  /**
   * Clear full lines on grid (mutates grid)
   */
  simulateLineClear(grid) {
    const { rows, cols } = this.lineClearer.checkFullLines(grid);

    // Clear rows
    rows.forEach(y => {
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        grid[y][x] = 0;
      }
    });

    // Clear columns
    cols.forEach(x => {
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        grid[y][x] = 0;
      }
    });
  }

  /**
   * Clone grid efficiently
   */
  cloneGrid(grid) {
    return grid.map(row => [...row]);
  }

  /**
   * Generate all permutations of shapes array
   */
  getPermutations(shapes) {
    if (shapes.length <= 1) return [shapes];

    const result = [];
    for (let i = 0; i < shapes.length; i++) {
      const current = shapes[i];
      const remaining = [...shapes.slice(0, i), ...shapes.slice(i + 1)];
      const perms = this.getPermutations(remaining);

      for (const perm of perms) {
        result.push([current, ...perm]);
      }
    }
    return result;
  }
}
