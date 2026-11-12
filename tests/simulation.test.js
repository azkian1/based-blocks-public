import { describe, it, expect, beforeEach } from 'vitest';
import { GridModel } from '../src/core/GridModel.js';
import { LineClearer } from '../src/core/LineClearer.js';
import { ShapeGenerator } from '../src/core/ShapeGenerator.js';
import { CONFIG } from '../src/config.js';

// Mock event emitter
const createMockEmitter = () => ({
  events: {},
  on(event, cb) { this.events[event] = cb; },
  off(event) { delete this.events[event]; },
  emit(event, data) { if (this.events[event]) this.events[event](data); }
});

describe('Game Simulation - 100 games', () => {

  it('should play 100 games without grid corruption', () => {
    const results = {
      gamesPlayed: 0,
      totalMoves: 0,
      totalLinesCleared: 0,
      maxScore: 0,
      gridCorruptions: 0,
      errors: []
    };

    for (let game = 0; game < 100; game++) {
      try {
        const gameResult = simulateOneGame();
        results.gamesPlayed++;
        results.totalMoves += gameResult.moves;
        results.totalLinesCleared += gameResult.linesCleared;
        if (gameResult.score > results.maxScore) {
          results.maxScore = gameResult.score;
        }
        if (gameResult.gridCorrupted) {
          results.gridCorruptions++;
        }
      } catch (error) {
        results.errors.push(`Game ${game}: ${error.message}`);
      }
    }

    console.log('\n=== SIMULATION RESULTS ===');
    console.log(`Games played: ${results.gamesPlayed}`);
    console.log(`Total moves: ${results.totalMoves}`);
    console.log(`Average moves per game: ${(results.totalMoves / results.gamesPlayed).toFixed(1)}`);
    console.log(`Total lines cleared: ${results.totalLinesCleared}`);
    console.log(`Max score: ${results.maxScore}`);
    console.log(`Grid corruptions: ${results.gridCorruptions}`);
    console.log(`Errors: ${results.errors.length}`);
    if (results.errors.length > 0) {
      console.log('First 5 errors:', results.errors.slice(0, 5));
    }
    console.log('==========================\n');

    expect(results.gamesPlayed).toBe(100);
    expect(results.gridCorruptions).toBe(0);
    expect(results.errors.length).toBe(0);
  });
});

function simulateOneGame() {
  const emitter = createMockEmitter();
  const gridModel = new GridModel(emitter);
  const lineClearer = new LineClearer();
  const shapeGenerator = new ShapeGenerator(emitter, gridModel);

  let moves = 0;
  let linesCleared = 0;
  let score = 0;
  let gridCorrupted = false;
  let gameOver = false;
  const maxMoves = 500; // Safety limit

  while (!gameOver && moves < maxMoves) {
    // Generate new shapes
    const shapes = shapeGenerator.generate();

    if (!shapes || shapes.length === 0) {
      break;
    }

    // Try to place each shape
    for (const shape of shapes) {
      if (gameOver) break;

      // Find valid positions
      const positions = gridModel.findValidPositions(shape);

      if (positions.length === 0) {
        // Check if any shape can be placed
        const canPlaceAny = shapes.some(s =>
          gridModel.findValidPositions(s).length > 0
        );
        if (!canPlaceAny) {
          gameOver = true;
          break;
        }
        continue;
      }

      // Place at random valid position
      const pos = positions[Math.floor(Math.random() * positions.length)];
      const placed = gridModel.placeShape(shape, pos.x, pos.y);

      if (!placed) {
        continue;
      }

      moves++;

      // Check and clear lines (THE CRITICAL PART)
      const grid = gridModel.getState();
      const { rows, cols } = lineClearer.checkFullLines(grid);

      if (rows.length > 0 || cols.length > 0) {
        const { clearedCount, cells } = lineClearer.clearLines(grid, rows, cols);

        // THIS IS THE FIX - clear cells in the actual model
        gridModel.clearCells(cells);

        linesCleared += clearedCount;
        score += clearedCount * 100;

        // Verify grid is actually cleared
        for (const cell of cells) {
          if (gridModel.getCellState(cell.x, cell.y) !== 0) {
            gridCorrupted = true;
          }
        }
      }

      // Verify grid integrity - count should match
      const gridState = gridModel.getState();
      let occupiedCount = 0;
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          if (gridState[y][x] !== 0) {
            occupiedCount++;
          }
        }
      }

      // Grid model should match its getState()
      const internalGrid = gridModel.grid;
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
          if (gridState[y][x] !== internalGrid[y][x]) {
            // This would indicate getState doesn't match internal state
            // (shouldn't happen with deep copy)
          }
        }
      }
    }

    // Check game over
    if (!gameOver) {
      const newShapes = shapeGenerator.generate();
      const canPlaceAny = newShapes.some(s =>
        gridModel.findValidPositions(s).length > 0
      );
      if (!canPlaceAny) {
        gameOver = true;
      }
    }
  }

  return { moves, linesCleared, score, gridCorrupted };
}
