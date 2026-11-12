import { CONFIG } from '../config.js';
import { EVENTS } from '../events.js';

// Touch offset to lift shape above finger during drag
const TOUCH_OFFSET_Y = -60;

// InputManager - Handles drag & drop input
// Owner: Agent B (Presentation)
//
// API Contract:
// - setupDrag(shapeView): void - enable drag on shape
// - setEnabled(enabled): void - enable/disable all input

export class InputManager {
  constructor(scene, gridView, eventEmitter, cellSize = CONFIG.CELL_SIZE) {
    this.scene = scene;
    this.gridView = gridView;
    this.events = eventEmitter;
    this.enabled = true;
    this.draggedShape = null;
    this.cellSize = cellSize;  // Adaptive cell size
    this.destroyed = false;
  }

  // Check if a shape is still valid (not destroyed)
  isShapeValid(shapeView) {
    return shapeView &&
           !shapeView.destroyed &&
           shapeView.active !== false &&
           shapeView.scene !== null;
  }

  // Set up drag handlers for a shape view
  setupDrag(shapeView) {
    shapeView.setDraggable(true);

    shapeView.on('dragstart', (pointer) => {
      if (!this.enabled || this.destroyed || !this.isShapeValid(shapeView)) return;
      this.onDragStart(shapeView, pointer);
    });

    shapeView.on('drag', (pointer, dragX, dragY) => {
      if (!this.enabled || this.destroyed || !this.isShapeValid(shapeView)) return;
      this.onDrag(shapeView, dragX, dragY);
    });

    shapeView.on('dragend', (pointer) => {
      if (!this.enabled || this.destroyed || !this.isShapeValid(shapeView)) {
        this.draggedShape = null;
        return;
      }
      this.onDragEnd(shapeView, pointer);
    });
  }

  // Called when drag starts
  onDragStart(shapeView, pointer) {
    if (!this.isShapeValid(shapeView)) return;

    this.draggedShape = shapeView;
    shapeView.animatePickup();
    // Apply initial offset to lift shape above finger
    shapeView.y += TOUCH_OFFSET_Y;
  }

  // Called during drag
  onDrag(shapeView, dragX, dragY) {
    if (!this.isShapeValid(shapeView) || !this.gridView) {
      this.gridView?.hidePreview();
      return;
    }

    // Update shape position with offset to keep shape above finger
    shapeView.x = dragX;
    shapeView.y = dragY + TOUCH_OFFSET_Y;

    const shape = shapeView.shapeModel;
    if (!shape) {
      this.gridView.hidePreview();
      return;
    }

    // Offset by half shape size to align preview with shape center
    const halfShapeWidth = (shape.getWidth() * this.cellSize) / 2;
    const halfShapeHeight = (shape.getHeight() * this.cellSize) / 2;

    // Calculate grid position relative to gridView, accounting for shape center AND touch offset
    const localX = dragX - this.gridView.x - halfShapeWidth + this.cellSize / 2;
    const localY = (dragY + TOUCH_OFFSET_Y) - this.gridView.y - halfShapeHeight + this.cellSize / 2;
    const gridPos = this.gridView.pixelToGrid(localX, localY);

    // Show preview on grid (check shape position, not finger position)
    if (this.isOverGrid(dragX, dragY + TOUCH_OFFSET_Y)) {
      const isValid = this.checkPlacement(shape, gridPos.x, gridPos.y);
      this.gridView.showPreview(shape, gridPos.x, gridPos.y, isValid);
    } else {
      this.gridView.hidePreview();
    }
  }

  // Called when drag ends
  onDragEnd(shapeView, pointer) {
    this.gridView?.hidePreview();

    if (!this.isShapeValid(shapeView)) {
      this.draggedShape = null;
      return;
    }

    shapeView.animateDrop();

    const shape = shapeView.shapeModel;
    if (!shape) {
      this.draggedShape = null;
      return;
    }

    // Same offset as in onDrag for consistency
    const halfShapeWidth = (shape.getWidth() * this.cellSize) / 2;
    const halfShapeHeight = (shape.getHeight() * this.cellSize) / 2;

    // Calculate grid position accounting for shape center
    const localX = shapeView.x - this.gridView.x - halfShapeWidth + this.cellSize / 2;
    const localY = shapeView.y - this.gridView.y - halfShapeHeight + this.cellSize / 2;
    const gridPos = this.gridView.pixelToGrid(localX, localY);

    // Check if over grid and valid position
    if (this.isOverGrid(shapeView.x, shapeView.y)) {
      // Emit drop request - Core will validate and respond
      this.events.emit(EVENTS.SHAPE_DROP_REQUESTED, {
        shapeId: shape.id,
        gridX: gridPos.x,
        gridY: gridPos.y
      });
    } else {
      // Not over grid, return to origin
      shapeView.returnToOrigin();
    }

    this.draggedShape = null;
  }

  // Check if position is over the grid
  isOverGrid(x, y) {
    const gridX = this.gridView.x;
    const gridY = this.gridView.y;
    const gridSize = CONFIG.GRID_SIZE * this.cellSize;

    return x >= gridX && x < gridX + gridSize &&
           y >= gridY && y < gridY + gridSize;
  }

  // Placeholder - actual validation done by Core
  checkPlacement(shape, gridX, gridY) {
    // This is a visual hint only - actual validation is done by Core
    // For now, just check bounds
    const maxX = gridX + shape.getWidth();
    const maxY = gridY + shape.getHeight();
    return gridX >= 0 && gridY >= 0 &&
           maxX <= CONFIG.GRID_SIZE && maxY <= CONFIG.GRID_SIZE;
  }

  // Enable/disable input
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Clean up resources
  destroy() {
    this.destroyed = true;
    this.enabled = false;
    this.draggedShape = null;
    this.gridView = null;
    this.scene = null;
    this.events = null;
  }
}
