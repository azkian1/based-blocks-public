import { CONFIG } from '../config.js';
import { EVENTS } from '../events.js';
import { GridModel } from './GridModel.js';
import { LineClearer } from './LineClearer.js';
import { ScoreManager } from './ScoreManager.js';
import { ShapeGenerator } from './ShapeGenerator.js';
import { StyleManager } from '../styles/StyleManager.js';

// GameController - Orchestrates game flow and state
// Owner: Agent A (Core Logic)
//
// Responsibilities:
// - Initialize and coordinate all core components
// - Handle SHAPE_DROP_REQUESTED events
// - Trigger line clearing after placement
// - Detect and emit GAME_OVER
// - Handle RESTART_REQUESTED events

// Game states
const GAME_STATE = {
  INITIALIZED: 'INITIALIZED',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

// Valid shapeId pattern (alphanumeric, underscores, hyphens)
const VALID_SHAPE_ID = /^[a-zA-Z0-9_-]+$/;

export class GameController {
  constructor(eventEmitter) {
    this.events = eventEmitter;

    // Game state machine
    this.gameState = GAME_STATE.INITIALIZED;

    // Track destruction state for handler guards
    this.destroyed = false;

    // Bound handler references for proper cleanup
    this.handleShapeDropBound = null;
    this.handleRestartBound = null;

    // Initialize core components
    this.gridModel = new GridModel(eventEmitter);
    this.lineClearer = new LineClearer();
    this.scoreManager = new ScoreManager(eventEmitter);
    this.shapeGenerator = new ShapeGenerator(eventEmitter, this.gridModel);

    // Current shapes available to player
    this.currentShapes = [];

    // Track total lines cleared in current game
    this.totalLinesCleared = 0;

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Create bound handlers that can be removed later
    this.handleShapeDropBound = (data) => {
      if (this.destroyed) return;
      try {
        this.handleShapeDrop(data);
      } catch (error) {
        console.error('Error handling shape drop:', error);
      }
    };

    this.handleRestartBound = () => {
      if (this.destroyed) return;
      try {
        this.restartGame();
      } catch (error) {
        console.error('Error restarting game:', error);
      }
    };

    // Handle shape drop from player
    this.events.on(EVENTS.SHAPE_DROP_REQUESTED, this.handleShapeDropBound);

    // Handle restart request
    this.events.on(EVENTS.RESTART_REQUESTED, this.handleRestartBound);
  }

  // Start a new game
  startGame() {
    // Prevent starting if already playing
    if (this.gameState === GAME_STATE.PLAYING) {
      console.warn('Game already in progress');
      return;
    }

    this.gameState = GAME_STATE.PLAYING;
    this.gridModel.reset();
    this.scoreManager.reset();
    this.totalLinesCleared = 0;

    // Pick random palette on game start
    this.pickRandomPalette();

    this.generateNewShapes();
  }

  // Pick a random palette for new game
  pickRandomPalette() {
    const palettes = StyleManager.getActivePalettes();
    if (palettes && palettes.length > 0) {
      const randomIndex = Math.floor(Math.random() * palettes.length);
      StyleManager.setPalette(randomIndex);
    }
  }

  // Handle player dropping a shape
  handleShapeDrop(data) {
    // Check game state
    if (this.gameState !== GAME_STATE.PLAYING) {
      console.warn('Cannot place shape when not playing');
      return;
    }

    // Validate input data
    if (!data || typeof data !== 'object') {
      console.warn('Invalid drop data: not an object');
      return;
    }

    const { shapeId, gridX, gridY } = data;

    // Validate shapeId - must be non-empty string with valid characters
    if (typeof shapeId !== 'string' ||
        shapeId.length === 0 ||
        shapeId.length > 100 ||
        !VALID_SHAPE_ID.test(shapeId)) {
      console.warn('Invalid shapeId:', shapeId);
      return;
    }

    // Validate coordinates are numbers
    if (!Number.isFinite(gridX) || !Number.isFinite(gridY)) {
      console.warn('Invalid coordinates: not numbers', { gridX, gridY });
      this.events.emit(EVENTS.PLACEMENT_REJECTED, { shapeId, reason: 'invalid_coordinates' });
      return;
    }

    // Validate coordinates are within grid bounds
    if (gridX < 0 || gridX >= CONFIG.GRID_SIZE || gridY < 0 || gridY >= CONFIG.GRID_SIZE) {
      console.warn('Coordinates out of bounds:', { gridX, gridY });
      this.events.emit(EVENTS.PLACEMENT_REJECTED, { shapeId, reason: 'out_of_bounds' });
      return;
    }

    // Find the shape
    const shapeIndex = this.currentShapes.findIndex(s => s.id === shapeId);
    if (shapeIndex === -1) {
      console.warn('Shape not found:', shapeId);
      this.events.emit(EVENTS.PLACEMENT_REJECTED, { shapeId, reason: 'shape_not_found' });
      return;
    }

    const shape = this.currentShapes[shapeIndex];

    // Try to place the shape
    const placed = this.gridModel.placeShape(shape, gridX, gridY);

    if (placed) {
      // Remove shape from current set
      this.currentShapes.splice(shapeIndex, 1);

      // Check and clear lines
      this.checkAndClearLines();

      // Generate new shapes if all placed
      if (this.currentShapes.length === 0) {
        this.generateNewShapes();
      }

      // Check for game over
      this.checkGameOver();
    }
  }

  // Check for and clear complete lines
  checkAndClearLines() {
    const grid = this.gridModel.getState();
    const { rows, cols } = this.lineClearer.checkFullLines(grid);

    if (rows.length > 0 || cols.length > 0) {
      const { clearedCount, cells } = this.lineClearer.clearLines(grid, rows, cols);

      // Track total lines cleared
      this.totalLinesCleared += clearedCount;

      // Clear cells in the actual grid model (not just the copy)
      this.gridModel.clearCells(cells);

      // Add line clear score
      const score = this.scoreManager.addLineClearScore(clearedCount);

      // Emit lines cleared event
      this.events.emit(EVENTS.LINES_CLEARED, {
        rows,
        cols,
        cells,
        lineCount: clearedCount,
        score
      });

      // Trigger palette change on 3+ lines cleared (dopamine reward!)
      if (clearedCount >= 3) {
        this.events.emit(EVENTS.BOARD_CLEARED, { lineCount: clearedCount });
        StyleManager.nextPalette();
      }
    } else {
      // No lines cleared, reset combo
      this.scoreManager.resetCombo();
    }
  }

  // Generate new shapes for player
  generateNewShapes() {
    this.currentShapes = this.shapeGenerator.generate();
  }

  // Check if game is over (no valid moves)
  checkGameOver() {
    if (!this.shapeGenerator.canPlaceAnyShape(this.currentShapes)) {
      this.triggerGameOver();
    }
  }

  // Trigger game over
  triggerGameOver() {
    // Prevent duplicate game over triggers
    if (this.gameState === GAME_STATE.GAME_OVER) {
      return;
    }

    this.gameState = GAME_STATE.GAME_OVER;

    const finalScore = this.scoreManager.getScore();
    const bestScoreAtStart = this.scoreManager.getBestScoreAtStart();

    this.events.emit(EVENTS.GAME_OVER, {
      finalScore,
      bestScore: bestScoreAtStart,
      totalLinesCleared: this.totalLinesCleared,
      isNewBest: finalScore > bestScoreAtStart && finalScore > 0
    });
  }

  // Restart the game
  restartGame() {
    // Allow restart from any state
    this.gameState = GAME_STATE.INITIALIZED;

    // Emit GAME_RESTARTED BEFORE starting new game
    // This clears old UI state before new shapes are generated
    this.events.emit(EVENTS.GAME_RESTARTED, {});

    this.startGame();
  }

  // Get current shapes (for presentation layer)
  getCurrentShapes() {
    return this.currentShapes;
  }

  // Get grid model (for presentation layer queries)
  getGridModel() {
    return this.gridModel;
  }

  // Clean up event listeners to prevent memory leaks
  destroy() {
    this.destroyed = true;

    // Remove specific handlers (not all listeners for these events)
    if (this.handleShapeDropBound) {
      this.events.off(EVENTS.SHAPE_DROP_REQUESTED, this.handleShapeDropBound);
      this.handleShapeDropBound = null;
    }
    if (this.handleRestartBound) {
      this.events.off(EVENTS.RESTART_REQUESTED, this.handleRestartBound);
      this.handleRestartBound = null;
    }

    this.currentShapes = [];
    this.gridModel = null;
    this.lineClearer = null;
    this.scoreManager = null;
    this.shapeGenerator = null;
  }
}
