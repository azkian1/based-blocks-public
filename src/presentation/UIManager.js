import Phaser from 'phaser';
import { CONFIG, getLayout } from '../config.js';
import { EVENTS } from '../events.js';
import { StyleManager } from '../styles/StyleManager.js';
import { ShapeView } from './ShapeView.js';
import { NeonFrame } from './components/NeonFrame.js';
import { InventorySlot } from './components/InventorySlot.js';

// UIManager - Manages UI components and shape dock
// Owner: Agent B (Presentation)
//
// API Contract:
// - createShapeDock(shapes): void - create shape views in dock
// - removeShapeFromDock(shapeId): void - remove placed shape
// - clearDock(): void - clear all shapes from dock

export class UIManager {
  constructor(scene, eventEmitter, inputManager, layout = null) {
    this.scene = scene;
    this.events = eventEmitter;
    this.inputManager = inputManager;
    this.layout = layout;  // Adaptive layout

    // Shape dock container
    this.dockShapes = new Map(); // shapeId -> ShapeView

    // Inventory components
    this.inventoryFrame = null;
    this.inventorySlots = [];

    // Track destruction state
    this.destroyed = false;

    // Create bound event handlers for proper cleanup
    this.boundHandleNewShapes = this.handleNewShapes.bind(this);
    this.boundHandleShapePlaced = this.handleShapePlaced.bind(this);
    this.boundHandlePlacementRejected = this.handlePlacementRejected.bind(this);
    this.boundHandleGameRestarted = this.handleGameRestarted.bind(this);
    this.boundHandlePaletteChanged = this.handlePaletteChangedEvent.bind(this);

    // Create inventory frame and slots
    this.createInventory();

    this.setupEventListeners();
  }

  // Event handler methods
  handleNewShapes(data) {
    if (this.destroyed) return;
    try {
      if (data && Array.isArray(data.shapes)) {
        this.createShapeDock(data.shapes);
      }
    } catch (error) {
      console.error('Error creating shape dock:', error);
    }
  }

  handleShapePlaced(data) {
    if (this.destroyed) return;
    try {
      if (data && data.shapeId) {
        this.removeShapeFromDock(data.shapeId);
      }
    } catch (error) {
      console.error('Error removing shape from dock:', error);
    }
  }

  handlePlacementRejected(data) {
    if (this.destroyed) return;
    try {
      if (data && data.shapeId) {
        this.handlePlacementRejectedInternal(data.shapeId);
      }
    } catch (error) {
      console.error('Error handling placement rejection:', error);
    }
  }

  handleGameRestarted() {
    if (this.destroyed) return;
    try {
      this.clearDock();
    } catch (error) {
      console.error('Error clearing dock on restart:', error);
    }
  }

  handlePaletteChangedEvent() {
    if (this.destroyed) return;
    try {
      this.repaintDockShapes();
    } catch (error) {
      console.error('Error repainting dock on palette change:', error);
    }
  }

  // Create inventory frame with slots
  createInventory() {
    const colors = StyleManager.getColors();

    // Get adaptive layout based on current canvas size
    const { width, height } = this.scene.cameras.main;
    const layout = this.layout || getLayout(width, height);

    // Use adaptive sizes from layout, fallback to CONFIG
    const slotSize = layout.slotSize || CONFIG.INVENTORY.SLOT_SIZE;
    const slotSpacing = layout.slotSpacing || CONFIG.INVENTORY.SPACING;
    const slotPadding = layout.slotPadding || CONFIG.INVENTORY.SLOT_PADDING;

    // Calculate inventory position (adaptive)
    const invX = width / 2;
    const invY = layout.inventoryY;

    // Total width for 3 slots with spacing
    const totalSlotsWidth = 3 * slotSize + 2 * slotSpacing;
    const frameWidth = totalSlotsWidth + slotPadding * 2;
    const frameHeight = slotSize + slotPadding * 2;

    // Create neon frame for inventory
    this.inventoryFrame = new NeonFrame(
      this.scene,
      invX,
      invY,
      frameWidth,
      frameHeight,
      {
        filled: true,
        backgroundColor: colors.gridBackground,
        backgroundAlpha: 0.6
      }
    );

    // Create 3 slots with adaptive size
    const slotStartX = invX - (slotSize + slotSpacing);

    for (let i = 0; i < 3; i++) {
      const slotX = slotStartX + i * (slotSize + slotSpacing);
      const slot = new InventorySlot(this.scene, slotX, invY, slotSize);
      this.inventorySlots.push(slot);
    }
  }

  // Handle viewport resize - reposition inventory and slots
  handleViewportResize(width, height, layout) {
    this.layout = layout;

    // Calculate new inventory position
    const invX = width / 2;
    const invY = layout.inventoryY;

    // Update inventory frame position
    if (this.inventoryFrame) {
      this.inventoryFrame.setPosition(invX, invY);
    }

    // Update slot positions and sizes
    const slotSize = layout.slotSize;
    const slotSpacing = layout.slotSpacing;
    const slotStartX = invX - (slotSize + slotSpacing);

    this.inventorySlots.forEach((slot, i) => {
      const slotX = slotStartX + i * (slotSize + slotSpacing);
      slot.setPosition(slotX, invY);
      slot.updateSize(slotSize);
    });

    // Update shape positions in slots
    this.dockShapes.forEach(({ shapeView, slotIndex }) => {
      // Guard: check if shapeView is valid and not destroyed
      if (!shapeView || shapeView.destroyed) return;

      if (slotIndex < this.inventorySlots.length) {
        const slot = this.inventorySlots[slotIndex];
        if (!slot) return;
        const slotPos = slot.getWorldPosition();
        shapeView.setPosition(slotPos.x, slotPos.y);
        shapeView.targetCellSize = layout.cellSize;
      }
    });
  }

  setupEventListeners() {
    // New shapes generated
    this.events.on(EVENTS.NEW_SHAPES_GENERATED, this.boundHandleNewShapes);

    // Shape placed successfully
    this.events.on(EVENTS.SHAPE_PLACED, this.boundHandleShapePlaced);

    // Placement rejected
    this.events.on(EVENTS.PLACEMENT_REJECTED, this.boundHandlePlacementRejected);

    // Game restarted
    this.events.on(EVENTS.GAME_RESTARTED, this.boundHandleGameRestarted);

    // Palette changed - repaint shapes in dock
    this.events.on(EVENTS.PALETTE_CHANGED, this.boundHandlePaletteChanged);
  }

  // Repaint all shapes in dock with new palette colors
  repaintDockShapes() {
    const blockColors = StyleManager.getBlockColors();

    this.dockShapes.forEach(({ shapeView, slotIndex }) => {
      if (!shapeView || !shapeView.active) return;

      // Assign new random color from palette
      const newColorIndex = Math.floor(Math.random() * blockColors.length);
      const newColor = blockColors[newColorIndex];

      // Repaint each block in the shape
      shapeView.list.forEach(block => {
        if (!block || !block.active) return;

        // Flash effect
        this.scene.tweens.add({
          targets: block,
          alpha: 0.3,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            // Redraw with new color
            block.clear();

            const size = shapeView.cellSize - 2;
            const halfCell = shapeView.cellSize / 2;
            const cornerRadius = Math.max(1, Math.round(shapeView.cellSize * 0.11));
            const highlightRadius = Math.max(1, Math.round(cornerRadius * 0.5));

            // Main block
            block.fillStyle(newColor.fill, 1);
            block.fillRoundedRect(-halfCell + 1, -halfCell + 1, size, size, cornerRadius);

            // Dark edge
            block.lineStyle(1, 0x000000, 0.3);
            block.strokeRoundedRect(-halfCell + 1, -halfCell + 1, size, size, cornerRadius);

            // Inner highlight
            block.fillStyle(0xffffff, 0.35);
            block.fillRoundedRect(-halfCell + 3, -halfCell + 3, size - 4, 5, highlightRadius);

            block.setAlpha(1);
          }
        });
      });
    });
  }

  // Create shape views in the dock (positioned in slots)
  createShapeDock(shapes) {
    this.clearDock();

    // Mark all slots as empty first
    this.inventorySlots.forEach(slot => slot.setEmpty());

    shapes.forEach((shapeData, index) => {
      if (index >= this.inventorySlots.length) return;

      const slot = this.inventorySlots[index];
      const slotPos = slot.getWorldPosition();

      // Create shape model-like object from data
      const shapeModel = {
        id: shapeData.id,
        type: shapeData.type,
        blocks: shapeData.blocks,
        colorId: shapeData.colorId,
        getWidth: () => Math.max(...shapeData.blocks.map(([bx]) => bx)) + 1,
        getHeight: () => Math.max(...shapeData.blocks.map(([, by]) => by)) + 1
      };

      const shapeView = new ShapeView(this.scene, slotPos.x, slotPos.y, shapeModel);

      // Set target cell size for correct scaling during drag
      shapeView.targetCellSize = this.layout?.cellSize || CONFIG.CELL_SIZE;

      // Mark slot as occupied
      slot.setShape(shapeView);

      // Setup drag handling
      if (this.inputManager) {
        this.inputManager.setupDrag(shapeView);
      }

      this.dockShapes.set(shapeData.id, { shapeView, slotIndex: index });
    });
  }

  // Remove a shape from the dock (after successful placement)
  removeShapeFromDock(shapeId) {
    const shapeData = this.dockShapes.get(shapeId);
    if (shapeData) {
      const { shapeView, slotIndex } = shapeData;

      // Mark shape as being destroyed to prevent race conditions
      // This ensures drag handlers will ignore this shape during animation
      if (shapeView) {
        shapeView.destroyed = true;
      }

      // Mark slot as empty
      if (slotIndex < this.inventorySlots.length) {
        this.inventorySlots[slotIndex].setEmpty();
      }

      // Remove from map immediately to prevent double-processing
      this.dockShapes.delete(shapeId);

      // Animate and destroy
      if (shapeView) {
        shapeView.animatePlacement();
      }
    }
  }

  // Handle rejected placement
  handlePlacementRejectedInternal(shapeId) {
    const shapeData = this.dockShapes.get(shapeId);
    if (shapeData && shapeData.shapeView && !shapeData.shapeView.destroyed) {
      shapeData.shapeView.animateReject();
    }
  }

  // Clear all shapes from dock
  clearDock() {
    this.dockShapes.forEach(({ shapeView }) => {
      shapeView.destroy();
    });
    this.dockShapes.clear();

    // Mark all slots as empty
    this.inventorySlots.forEach(slot => slot.setEmpty());
  }

  // Get shape view by ID
  getShapeView(shapeId) {
    const shapeData = this.dockShapes.get(shapeId);
    return shapeData ? shapeData.shapeView : null;
  }

  // Clean up event listeners and resources to prevent memory leaks
  destroy() {
    this.destroyed = true;

    // Unregister event listeners using bound references
    if (this.boundHandleNewShapes) {
      this.events.off(EVENTS.NEW_SHAPES_GENERATED, this.boundHandleNewShapes);
      this.boundHandleNewShapes = null;
    }
    if (this.boundHandleShapePlaced) {
      this.events.off(EVENTS.SHAPE_PLACED, this.boundHandleShapePlaced);
      this.boundHandleShapePlaced = null;
    }
    if (this.boundHandlePlacementRejected) {
      this.events.off(EVENTS.PLACEMENT_REJECTED, this.boundHandlePlacementRejected);
      this.boundHandlePlacementRejected = null;
    }
    if (this.boundHandleGameRestarted) {
      this.events.off(EVENTS.GAME_RESTARTED, this.boundHandleGameRestarted);
      this.boundHandleGameRestarted = null;
    }
    if (this.boundHandlePaletteChanged) {
      this.events.off(EVENTS.PALETTE_CHANGED, this.boundHandlePaletteChanged);
      this.boundHandlePaletteChanged = null;
    }

    // Clear dock
    this.clearDock();

    // Destroy inventory components
    if (this.inventoryFrame) {
      this.inventoryFrame.destroy();
    }
    this.inventorySlots.forEach(slot => slot.destroy());
    this.inventorySlots = [];

    // Clear references
    this.inputManager = null;
    this.scene = null;
  }
}
