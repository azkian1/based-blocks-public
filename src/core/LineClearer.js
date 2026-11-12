import { CONFIG } from '../config.js';

// LineClearer - Handles line detection and clearing
// Owner: Agent A (Core Logic)
//
// API Contract:
// - checkFullLines(grid): { rows: number[], cols: number[] } - find complete lines
// - clearLines(grid, rows, cols): { clearedCount: number, cells: [{x, y}, ...] } - clear lines

export class LineClearer {
  // Find all complete rows and columns
  checkFullLines(grid) {
    // Validate grid is a 2D array
    if (!Array.isArray(grid) || grid.length !== CONFIG.GRID_SIZE) {
      console.error('Invalid grid: not a valid array');
      return { rows: [], cols: [] };
    }

    // Validate each row
    for (let y = 0; y < grid.length; y++) {
      if (!Array.isArray(grid[y]) || grid[y].length !== CONFIG.GRID_SIZE) {
        console.error('Invalid grid row at index:', y);
        return { rows: [], cols: [] };
      }
    }

    const rows = [];
    const cols = [];
    const size = CONFIG.GRID_SIZE;

    // Check rows (horizontal lines)
    for (let y = 0; y < size; y++) {
      if (grid[y].every(cell => cell !== 0)) {
        rows.push(y);
      }
    }

    // Check columns (vertical lines)
    for (let x = 0; x < size; x++) {
      let isComplete = true;
      for (let y = 0; y < size; y++) {
        if (grid[y][x] === 0) {
          isComplete = false;
          break;
        }
      }
      if (isComplete) {
        cols.push(x);
      }
    }

    return { rows, cols };
  }

  // Clear specified rows and columns, return cleared cells
  clearLines(grid, rows, cols) {
    // Validate inputs
    if (!Array.isArray(grid) || grid.length !== CONFIG.GRID_SIZE) {
      console.error('clearLines: Invalid grid');
      return { clearedCount: 0, cells: [] };
    }

    if (!Array.isArray(rows) || !Array.isArray(cols)) {
      console.error('clearLines: Invalid rows/cols arrays');
      return { clearedCount: 0, cells: [] };
    }

    const cells = [];
    const size = CONFIG.GRID_SIZE;

    // Filter valid indices
    const validRows = rows.filter(y => Number.isInteger(y) && y >= 0 && y < size);
    const validCols = cols.filter(x => Number.isInteger(x) && x >= 0 && x < size);

    // Use Set for O(1) lookup instead of includes()
    const rowSet = new Set(validRows);

    // Collect cells to be cleared (for animations)
    // Include colorId for colored particle effects
    // Rows first
    validRows.forEach(y => {
      for (let x = 0; x < size; x++) {
        if (grid[y][x] !== 0) {
          cells.push({ x, y, colorId: grid[y][x] });
        }
      }
    });

    // Columns (avoid duplicates at intersections using Set)
    validCols.forEach(x => {
      for (let y = 0; y < size; y++) {
        if (grid[y][x] !== 0 && !rowSet.has(y)) {
          cells.push({ x, y, colorId: grid[y][x] });
        }
      }
    });

    // Clear the rows
    validRows.forEach(y => {
      grid[y].fill(0);
    });

    // Clear the columns
    validCols.forEach(x => {
      for (let y = 0; y < size; y++) {
        grid[y][x] = 0;
      }
    });

    return {
      clearedCount: validRows.length + validCols.length,
      cells
    };
  }
}
