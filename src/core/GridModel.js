import { CONFIG } from '../config.js';
import { EVENTS } from '../events.js';

// GridModel - Manages the 10x10 game grid state
// Owner: Agent A (Core Logic)
//
// API Contract:
// - getState(): number[][] - returns full grid state
// - getCellState(x, y): number - returns cell value (0 = empty, >0 = colorId)
// - canPlaceShape(shape, gridX, gridY): boolean - checks if placement is valid
// - placeShape(shape, gridX, gridY): boolean - places shape and emits SHAPE_PLACED
// - findValidPositions(shape): {x, y}[] - finds all valid positions for shape
// - reset(): void - clears grid and emits GAME_RESTARTED

export class GridModel {
  constructor(eventEmitter) {
    this.events = eventEmitter;
    this.grid = this.createEmptyGrid();
  }

  // Create empty 10x10 grid filled with zeros
  createEmptyGrid() {
    return Array(CONFIG.GRID_SIZE)
      .fill(null)
      .map(() => Array(CONFIG.GRID_SIZE).fill(0));
  }

  // Get full grid state (returns deep copy to prevent external mutation)
  getState() {
    return this.grid.map(row => [...row]);
  }

  // Get single cell state
  getCellState(x, y) {
    if (!this.isValidPosition(x, y)) return -1;
    return this.grid[y][x];
  }

  // Check if position is within grid bounds
  isValidPosition(x, y) {
    return x >= 0 && x < CONFIG.GRID_SIZE && y >= 0 && y < CONFIG.GRID_SIZE;
  }

  // Check if cell is empty
  isCellEmpty(x, y) {
    return this.getCellState(x, y) === 0;
  }

  // Check if shape can be placed at position
  canPlaceShape(shape, gridX, gridY) {
    return shape.blocks.every(([dx, dy]) => {
      const x = gridX + dx;
      const y = gridY + dy;
      return this.isValidPosition(x, y) && this.isCellEmpty(x, y);
    });
  }

  // Place shape on grid
  placeShape(shape, gridX, gridY) {
    if (!this.canPlaceShape(shape, gridX, gridY)) {
      this.events.emit(EVENTS.PLACEMENT_REJECTED, {
        shapeId: shape.id,
        reason: 'occupied'
      });
      return false;
    }

    const cells = [];
    shape.blocks.forEach(([dx, dy]) => {
      const x = gridX + dx;
      const y = gridY + dy;
      this.grid[y][x] = shape.colorId;
      cells.push({ x, y, colorId: shape.colorId });
    });

    this.events.emit(EVENTS.SHAPE_PLACED, {
      shapeId: shape.id,
      gridX,
      gridY,
      cells
    });

    return true;
  }

  // Find all valid positions for a shape (optimized)
  findValidPositions(shape) {
    const positions = [];

    // Optimization: limit search to positions where shape can fit
    const maxX = CONFIG.GRID_SIZE - shape.getWidth();
    const maxY = CONFIG.GRID_SIZE - shape.getHeight();

    // Only check positions where shape would fit within bounds
    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        if (this.canPlaceShape(shape, x, y)) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  // Reset grid to empty state
  reset() {
    this.grid = this.createEmptyGrid();
  }

  // Clear specific cells (used after line clearing)
  clearCells(cells) {
    cells.forEach(({ x, y }) => {
      if (this.isValidPosition(x, y)) {
        this.grid[y][x] = 0;
      }
    });
  }

  // Get grid occupancy rate (0.0 - 1.0)
  getOccupancy() {
    let occupied = 0;
    const totalCells = CONFIG.GRID_SIZE * CONFIG.GRID_SIZE;

    for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
      for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
        if (this.grid[y][x] !== 0) {
          occupied++;
        }
      }
    }

    return occupied / totalCells;
  }
}
