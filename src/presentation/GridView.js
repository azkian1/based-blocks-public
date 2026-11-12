import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { EVENTS } from '../events.js';
import { StyleManager } from '../styles/StyleManager.js';
import { NeonFrame } from './components/NeonFrame.js';
import { LineClearer } from '../core/LineClearer.js';

// GridView - Renders the game grid
// Owner: Agent B (Presentation)
//
// API Contract:
// - renderState(gridState): void - render full grid from state
// - renderPlacedCells(cells): void - render newly placed cells
// - showPreview(shape, gridX, gridY, isValid): void - show placement preview
// - hidePreview(): void - hide placement preview
// - gridToPixel(gridX, gridY): {x, y} - convert grid to pixel coords
// - pixelToGrid(pixelX, pixelY): {x, y} - convert pixel to grid coords

export class GridView extends Phaser.GameObjects.Container {
  constructor(scene, x, y, eventEmitter, cellSize = CONFIG.CELL_SIZE) {
    super(scene, x, y);
    scene.add.existing(this);

    this.events = eventEmitter;
    this.cellSize = cellSize;  // Use parameter instead of CONFIG
    this.gridSize = CONFIG.GRID_SIZE;

    // Map of placed blocks: "x,y" -> BlockSprite
    this.blocks = new Map();

    // Cached grid state for performance (avoids rebuilding on every drag frame)
    this.cachedGridState = this.createEmptyGrid();
    this.gridStateDirty = false;

    // Preview sprites
    this.previewSprites = [];

    // Line clear preview highlights
    this.lineHighlights = [];
    this.lineClearer = new LineClearer();

    // Frame reference
    this.frame = null;
    this.gridGraphics = null;

    // Ambient breathing effect
    this.breathingEnabled = true;
    this.breathingTimer = null;

    // Grid pulse state
    this.gridPulseActive = false;

    // Draw the grid background and lines
    this.drawGrid();

    // Create bound event handlers for proper cleanup
    this.boundHandleShapePlaced = this.handleShapePlaced.bind(this);
    this.boundHandleLinesCleared = this.handleLinesCleared.bind(this);
    this.boundHandleGameRestarted = this.handleGameRestarted.bind(this);
    this.boundHandlePaletteChanged = this.handlePaletteChanged.bind(this);

    // Setup event listeners
    this.setupEventListeners();

    // Start ambient breathing effect
    this.startBreathingEffect();
  }

  // Event handler methods
  handleShapePlaced(data) {
    try {
      if (data && Array.isArray(data.cells)) {
        this.renderPlacedCells(data.cells);
      }
    } catch (error) {
      console.error('Error rendering placed cells:', error);
    }
  }

  handleLinesCleared(data) {
    try {
      if (data && Array.isArray(data.cells)) {
        this.clearCells(data.cells);
        // Pulse the grid!
        this.pulseGrid(data.lineCount || 1);
      }
    } catch (error) {
      console.error('Error clearing cells:', error);
    }
  }

  handleGameRestarted() {
    try {
      this.clearAllBlocks();
    } catch (error) {
      console.error('Error clearing blocks on restart:', error);
    }
  }

  handlePaletteChanged() {
    try {
      this.repaintAllBlocks();
    } catch (error) {
      console.error('Error repainting blocks on palette change:', error);
    }
  }

  // ===========================================
  // GRID STATE CACHE HELPERS
  // ===========================================

  createEmptyGrid() {
    return Array(this.gridSize).fill(null)
      .map(() => Array(this.gridSize).fill(0));
  }

  // Mark a cell as occupied in the cache
  setCellOccupied(x, y, occupied = true) {
    if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
      this.cachedGridState[y][x] = occupied ? 1 : 0;
    }
  }

  // ===========================================
  // AMBIENT BREATHING EFFECT
  // ===========================================

  startBreathingEffect() {
    if (this.breathingTimer) return;

    // Random breathing pulses on blocks
    this.breathingTimer = this.scene.time.addEvent({
      delay: CONFIG.ANIMATION?.BREATHING_INTERVAL || 2000,
      callback: this.pulseRandomBlocks,
      callbackScope: this,
      loop: true
    });
  }

  stopBreathingEffect() {
    if (this.breathingTimer) {
      this.breathingTimer.destroy();
      this.breathingTimer = null;
    }
  }

  // ===========================================
  // GRID PULSE EFFECT
  // ===========================================

  pulseGrid(lineCount) {
    if (this.gridPulseActive || !this.gridGraphics) return;
    this.gridPulseActive = true;

    // Store original alpha
    const originalAlpha = this.gridGraphics.alpha;

    // Pulse intensity based on line count
    const pulseAlpha = Math.min(0.5 + lineCount * 0.15, 1);

    // Quick bright pulse
    this.scene.tweens.add({
      targets: this.gridGraphics,
      alpha: pulseAlpha,
      duration: 100,
      ease: 'Power2',
      onComplete: () => {
        // Fade back to original
        this.scene.tweens.add({
          targets: this.gridGraphics,
          alpha: originalAlpha,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            this.gridPulseActive = false;
          }
        });
      }
    });

    // Also pulse the frame if it exists
    if (this.frame) {
      this.pulseFrame(lineCount);
    }
  }

  pulseFrame(lineCount) {
    // Scale pulse on the frame
    const pulseScale = 1 + lineCount * 0.01;

    this.scene.tweens.add({
      targets: this.frame,
      scaleX: pulseScale,
      scaleY: pulseScale,
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeOut'
    });
  }

  pulseRandomBlocks() {
    if (!this.breathingEnabled || this.blocks.size === 0) return;

    // Pick 2-4 random blocks to pulse
    const blockKeys = Array.from(this.blocks.keys());
    const pulseCount = Math.min(Math.floor(Math.random() * 3) + 2, blockKeys.length);

    for (let i = 0; i < pulseCount; i++) {
      const randomIndex = Math.floor(Math.random() * blockKeys.length);
      const key = blockKeys[randomIndex];
      const block = this.blocks.get(key);

      if (block && !block.isPulsing && block.active !== false) {
        block.isPulsing = true;

        // Subtle scale pulse - explicit return to 1.0 to avoid stuck states
        this.scene.tweens.add({
          targets: block,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 400,
          ease: 'Sine.easeInOut',
          yoyo: true,
          onComplete: () => {
            // Always reset to normal scale
            if (block && block.active !== false) {
              block.setScale(1);
              block.isPulsing = false;
            }
          },
          onStop: () => {
            // If tween is killed, reset scale
            if (block && block.active !== false) {
              block.setScale(1);
              block.isPulsing = false;
            }
          }
        });
      }
    }
  }

  setupEventListeners() {
    // Listen for shape placed events
    this.events.on(EVENTS.SHAPE_PLACED, this.boundHandleShapePlaced);

    // Listen for lines cleared events
    this.events.on(EVENTS.LINES_CLEARED, this.boundHandleLinesCleared);

    // Listen for game restart
    this.events.on(EVENTS.GAME_RESTARTED, this.boundHandleGameRestarted);

    // Listen for palette change (board cleared reward)
    this.events.on(EVENTS.PALETTE_CHANGED, this.boundHandlePaletteChanged);
  }

  // Repaint all blocks with current palette colors (for palette change effect)
  repaintAllBlocks() {
    const blockColors = StyleManager.getBlockColors();

    // Collect all active blocks
    const activeBlocks = [];
    const blockColorMap = new Map();

    this.blocks.forEach((block, key) => {
      if (!block || block.active === false) return;

      // Kill any existing tweens
      this.scene.tweens.killTweensOf(block);

      // Assign random color from new palette
      const colorIndex = Math.floor(Math.random() * blockColors.length);
      blockColorMap.set(block, blockColors[colorIndex]);
      activeBlocks.push(block);
    });

    if (activeBlocks.length === 0) return;

    // Single batch tween for all blocks
    this.scene.tweens.add({
      targets: activeBlocks,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      onYoyo: () => {
        // Redraw all blocks at the midpoint of the animation
        activeBlocks.forEach(block => {
          if (!block || block.active === false) return;

          const color = blockColorMap.get(block);
          if (!color) return;

          block.clear();

          const size = this.cellSize - 4;
          const halfSize = this.cellSize / 2;

          // Main block
          block.fillStyle(color.fill, 1);
          block.fillRoundedRect(-halfSize + 2, -halfSize + 2, size, size, 4);

          // Dark edge
          block.lineStyle(1, 0x000000, 0.3);
          block.strokeRoundedRect(-halfSize + 2, -halfSize + 2, size, size, 4);

          // Inner highlight
          block.fillStyle(0xffffff, 0.35);
          block.fillRoundedRect(-halfSize + 4, -halfSize + 4, size - 6, 6, 2);
        });
      },
      onComplete: () => {
        // Ensure all blocks are fully visible
        activeBlocks.forEach(block => {
          if (block && block.active !== false) {
            block.setAlpha(1);
          }
        });
      }
    });
  }

  // Draw grid background and lines with neon frame
  drawGrid() {
    const colors = StyleManager.getColors();
    const totalSize = this.gridSize * this.cellSize;
    const padding = 10; // Padding between frame and grid

    // Create neon frame around the grid
    this.frame = new NeonFrame(
      this.scene,
      totalSize / 2,
      totalSize / 2,
      totalSize + padding * 2,
      totalSize + padding * 2,
      {
        filled: true,
        backgroundColor: colors.gridBackground,
        backgroundAlpha: 1
      }
    );
    this.add(this.frame);

    // Create grid graphics
    this.gridGraphics = this.scene.add.graphics();
    this.add(this.gridGraphics);

    // Grid lines
    this.gridGraphics.lineStyle(1, colors.gridLine, colors.gridLineAlpha);

    for (let i = 0; i <= this.gridSize; i++) {
      const coord = Math.round(i * this.cellSize);
      // Horizontal
      this.gridGraphics.moveTo(0, coord);
      this.gridGraphics.lineTo(totalSize, coord);

      // Vertical
      this.gridGraphics.moveTo(coord, 0);
      this.gridGraphics.lineTo(coord, totalSize);
    }

    this.gridGraphics.strokePath();
  }

  // Convert grid coordinates to pixel coordinates (center of cell)
  gridToPixel(gridX, gridY) {
    return {
      x: gridX * this.cellSize + this.cellSize / 2,
      y: gridY * this.cellSize + this.cellSize / 2
    };
  }

  // Convert pixel coordinates to grid coordinates
  pixelToGrid(pixelX, pixelY) {
    return {
      x: Math.floor(pixelX / this.cellSize),
      y: Math.floor(pixelY / this.cellSize)
    };
  }

  // Render newly placed cells
  renderPlacedCells(cells) {
    cells.forEach(({ x, y, colorId }) => {
      this.createBlock(x, y, colorId);
    });
  }

  // Create a block sprite at grid position
  createBlock(gridX, gridY, colorId) {
    const key = `${gridX},${gridY}`;
    const blockColors = StyleManager.getBlockColors();

    // Remove existing block if any
    if (this.blocks.has(key)) {
      this.blocks.get(key).destroy();
    }

    const pixel = this.gridToPixel(gridX, gridY);
    const color = blockColors[colorId - 1] || blockColors[0];
    const size = this.cellSize - 4;
    const halfSize = this.cellSize / 2;

    // Create block container
    const block = this.scene.add.graphics();

    // Main block with solid color
    block.fillStyle(color.fill, 1);
    block.fillRoundedRect(-halfSize + 2, -halfSize + 2, size, size, 4);

    // Bright edge (bottom-right)
    block.lineStyle(1, 0x000000, 0.3);
    block.strokeRoundedRect(-halfSize + 2, -halfSize + 2, size, size, 4);

    // Inner highlight (top-left shine)
    block.fillStyle(0xffffff, 0.35);
    block.fillRoundedRect(-halfSize + 4, -halfSize + 4, size - 6, 6, 2);

    block.setPosition(Math.round(pixel.x), Math.round(pixel.y));
    this.add(block);

    // Store reference and update cache
    this.blocks.set(key, block);
    this.setCellOccupied(gridX, gridY, true);

    // Animate placement with bounce
    block.setScale(0.3);
    block.setAlpha(0);

    // Scale up with overshoot
    this.scene.tweens.add({
      targets: block,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 1,
      duration: CONFIG.ANIMATION.PLACE_DURATION * 0.6,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Settle to normal size
        this.scene.tweens.add({
          targets: block,
          scaleX: 1,
          scaleY: 1,
          duration: CONFIG.ANIMATION.PLACE_DURATION * 0.4,
          ease: 'Bounce.easeOut'
        });
      }
    });

    return block;
  }

  // Clear cells (for line clearing animation)
  clearCells(cells) {
    cells.forEach(({ x, y }) => {
      const key = `${x},${y}`;
      const block = this.blocks.get(key);

      // Update cache immediately (before animation)
      this.setCellOccupied(x, y, false);

      if (block) {
        // Kill any existing tweens (like breathing pulse) before removal animation
        this.scene.tweens.killTweensOf(block);
        block.setScale(1); // Reset scale before removal animation

        // Animate removal
        this.scene.tweens.add({
          targets: block,
          scaleX: 1.2,
          scaleY: 1.2,
          alpha: 0,
          duration: CONFIG.ANIMATION.CLEAR_DURATION,
          ease: 'Power2',
          onComplete: () => {
            block.destroy();
            this.blocks.delete(key);
          }
        });
      }
    });
  }

  // Clear all blocks (for restart)
  clearAllBlocks() {
    this.blocks.forEach(block => block.destroy());
    this.blocks.clear();
    // Reset cached grid state
    this.cachedGridState = this.createEmptyGrid();
  }

  // ===========================================
  // LINE CLEAR PREVIEW (FEEDFORWARD)
  // ===========================================

  // Get current grid state (uses cache for performance)
  getCurrentGridState() {
    // Return a copy of the cached grid to prevent mutation
    return this.cachedGridState.map(row => [...row]);
  }

  // Simulate placement and check which lines would clear
  predictLinesToClear(shape, gridX, gridY) {
    const testGrid = this.getCurrentGridState();

    // "Place" shape on copy
    shape.blocks.forEach(([dx, dy]) => {
      const x = gridX + dx;
      const y = gridY + dy;
      if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
        testGrid[y][x] = 1;
      }
    });

    return this.lineClearer.checkFullLines(testGrid);
  }

  // Highlight cells of lines that would be cleared
  highlightPotentialClears(rows, cols) {
    const colors = StyleManager.getColors();
    const highlightColor = colors.lineHighlight || 0xffffff;

    // Use Set to avoid duplicate highlights at intersections
    const cellsToHighlight = new Set();

    rows.forEach(y => {
      for (let x = 0; x < this.gridSize; x++) {
        cellsToHighlight.add(`${x},${y}`);
      }
    });

    cols.forEach(x => {
      for (let y = 0; y < this.gridSize; y++) {
        cellsToHighlight.add(`${x},${y}`);
      }
    });

    cellsToHighlight.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const pixel = this.gridToPixel(x, y);

      const highlight = this.scene.add.graphics();
      highlight.lineStyle(2, highlightColor, 0.8);
      highlight.strokeRoundedRect(
        -this.cellSize / 2 + 1,
        -this.cellSize / 2 + 1,
        this.cellSize - 2,
        this.cellSize - 2,
        4
      );
      highlight.setPosition(pixel.x, pixel.y);
      this.add(highlight);
      this.lineHighlights.push(highlight);
    });
  }

  // Clear line highlight sprites
  clearLineHighlights() {
    this.lineHighlights.forEach(h => h.destroy());
    this.lineHighlights = [];
  }

  // Check if shape can actually be placed (no collisions with existing blocks)
  canActuallyPlace(shape, gridX, gridY) {
    return shape.blocks.every(([dx, dy]) => {
      const x = gridX + dx;
      const y = gridY + dy;
      // Must be in bounds AND cell empty
      if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
        return false;
      }
      return !this.blocks.has(`${x},${y}`);
    });
  }

  // Show placement preview
  showPreview(shape, gridX, gridY, isValid) {
    this.hidePreview();

    // Use shape's own color from StyleManager
    const blockColors = StyleManager.getBlockColors();
    const shapeColor = blockColors[shape.colorId - 1] || blockColors[0];
    const alpha = isValid ? 0.5 : 0.2;

    shape.blocks.forEach(([dx, dy]) => {
      const x = gridX + dx;
      const y = gridY + dy;

      if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
        const pixel = this.gridToPixel(x, y);
        const preview = this.scene.add.graphics();
        preview.fillStyle(shapeColor.fill, alpha);
        preview.fillRoundedRect(
          -this.cellSize / 2 + 2,
          -this.cellSize / 2 + 2,
          this.cellSize - 4,
          this.cellSize - 4,
          4
        );
        preview.setPosition(pixel.x, pixel.y);
        this.add(preview);
        this.previewSprites.push(preview);
      }
    });

    // Highlight lines that would be cleared (feedforward)
    // Only if shape can ACTUALLY be placed (no collisions)
    if (isValid && this.canActuallyPlace(shape, gridX, gridY)) {
      const { rows, cols } = this.predictLinesToClear(shape, gridX, gridY);
      if (rows.length > 0 || cols.length > 0) {
        this.highlightPotentialClears(rows, cols);
      }
    }
  }

  // Hide placement preview
  hidePreview() {
    this.previewSprites.forEach(sprite => sprite.destroy());
    this.previewSprites = [];

    // Clear line highlights
    this.clearLineHighlights();
  }

  // Render full grid state (for initialization/sync)
  renderState(gridState) {
    this.clearAllBlocks();

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const colorId = gridState[y][x];
        if (colorId > 0) {
          this.createBlock(x, y, colorId);
        }
      }
    }
  }

  // Clean up event listeners and resources to prevent memory leaks
  destroy(fromScene) {
    // Stop breathing effect
    this.stopBreathingEffect();

    // Unregister event listeners using bound references
    if (this.boundHandleShapePlaced) {
      this.events.off(EVENTS.SHAPE_PLACED, this.boundHandleShapePlaced);
      this.boundHandleShapePlaced = null;
    }
    if (this.boundHandleLinesCleared) {
      this.events.off(EVENTS.LINES_CLEARED, this.boundHandleLinesCleared);
      this.boundHandleLinesCleared = null;
    }
    if (this.boundHandleGameRestarted) {
      this.events.off(EVENTS.GAME_RESTARTED, this.boundHandleGameRestarted);
      this.boundHandleGameRestarted = null;
    }
    if (this.boundHandlePaletteChanged) {
      this.events.off(EVENTS.PALETTE_CHANGED, this.boundHandlePaletteChanged);
      this.boundHandlePaletteChanged = null;
    }

    // Kill all active tweens on blocks
    this.blocks.forEach(block => {
      this.scene.tweens.killTweensOf(block);
    });

    // Clear all blocks
    this.clearAllBlocks();

    // Clear preview sprites
    this.hidePreview();

    // Destroy frame
    if (this.frame) {
      this.frame.destroy();
    }

    // Call parent destroy
    super.destroy(fromScene);
  }
}
