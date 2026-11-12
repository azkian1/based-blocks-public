import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { StyleManager } from '../styles/StyleManager.js';

// ShapeView - Renders a draggable shape
// Owner: Agent B (Presentation)

export class ShapeView extends Phaser.GameObjects.Container {
  constructor(scene, x, y, shapeModel, cellSize = null) {
    super(scene, x, y);
    scene.add.existing(this);

    this.shapeModel = shapeModel;
    this.destroyed = false;

    // Calculate cellSize to fit shape in inventory slot
    if (cellSize) {
      this.cellSize = cellSize;
    } else {
      const maxSlotSize = CONFIG.INVENTORY.SLOT_SIZE - CONFIG.INVENTORY.SLOT_PADDING * 2;
      const shapeWidth = shapeModel.getWidth();
      const shapeHeight = shapeModel.getHeight();
      const maxDimension = Math.max(shapeWidth, shapeHeight);

      // Base size = 50% of CELL_SIZE, but no larger than what fits in slot
      const baseSize = CONFIG.CELL_SIZE * 0.5;
      const maxCellSize = maxSlotSize / maxDimension;
      this.cellSize = Math.min(baseSize, maxCellSize);
    }

    this.startX = x;
    this.startY = y;

    // Store hit area dimensions explicitly
    this._hitWidth = shapeModel.getWidth() * this.cellSize;
    this._hitHeight = shapeModel.getHeight() * this.cellSize;

    // Create block sprites
    this.createBlocks();
  }

  // Create block graphics for the shape
  createBlocks() {
    const blockColors = StyleManager.getBlockColors();
    const color = blockColors[this.shapeModel.colorId - 1] || blockColors[0];
    const size = this.cellSize - 2;
    const halfCell = this.cellSize / 2;
    const offsetX = (this.shapeModel.getWidth() * this.cellSize) / 2;
    const offsetY = (this.shapeModel.getHeight() * this.cellSize) / 2;

    // Proportional corner radius - matches GridView (4px at 36px cellSize)
    // When scaled up during drag, visual radius = cellSize * 0.11 * (36/cellSize) = 4px
    const cornerRadius = Math.max(1, Math.round(this.cellSize * 0.11));
    const highlightRadius = Math.max(1, Math.round(cornerRadius * 0.5));

    this.shapeModel.blocks.forEach(([dx, dy]) => {
      const block = this.scene.add.graphics();

      // Main block with solid color
      block.fillStyle(color.fill, 1);
      block.fillRoundedRect(-halfCell + 1, -halfCell + 1, size, size, cornerRadius);

      // Dark edge
      block.lineStyle(1, 0x000000, 0.3);
      block.strokeRoundedRect(-halfCell + 1, -halfCell + 1, size, size, cornerRadius);

      // Inner highlight (top shine)
      block.fillStyle(0xffffff, 0.35);
      block.fillRoundedRect(-halfCell + 3, -halfCell + 3, size - 4, 5, highlightRadius);

      // Position relative to container center
      block.setPosition(
        dx * this.cellSize + halfCell - offsetX,
        dy * this.cellSize + halfCell - offsetY
      );

      this.add(block);
    });
  }

  // Enable/disable dragging
  setDraggable(enabled) {
    if (enabled) {
      // Create a Zone at the same position as the container for reliable hit detection
      const minHitSize = CONFIG.INVENTORY.SLOT_SIZE;
      const hitW = Math.max(this._hitWidth, minHitSize);
      const hitH = Math.max(this._hitHeight, minHitSize);
      this.hitZone = this.scene.add.zone(this.x, this.y, hitW, hitH);
      this.hitZone.setInteractive({ useHandCursor: true });
      this.scene.input.setDraggable(this.hitZone, true);

      // Link zone drag to container movement and emit events for InputManager
      this.hitZone.on('dragstart', (pointer) => {
        this.emit('dragstart', pointer);
      });

      this.hitZone.on('drag', (pointer, dragX, dragY) => {
        // Sync zone and container positions
        this.hitZone.x = dragX;
        this.hitZone.y = dragY;
        // Emit drag event with correct signature for InputManager
        this.emit('drag', pointer, dragX, dragY);
      });

      this.hitZone.on('dragend', (pointer) => {
        this.emit('dragend', pointer);
      });

      // Store reference for cleanup
      this.hitZone.shapeView = this;
    } else {
      if (this.hitZone) {
        this.hitZone.destroy();
        this.hitZone = null;
      }
    }
  }

  // Animate when picked up - scale to full (grid) size
  animatePickup() {
    const fullScale = (this.targetCellSize || CONFIG.CELL_SIZE) / this.cellSize;
    this.scene.tweens.add({
      targets: this,
      scaleX: fullScale,
      scaleY: fullScale,
      duration: 150,
      ease: 'Back.easeOut'
    });

    // Bring to top
    this.setDepth(1000);
  }

  // Animate when dropped
  animateDrop() {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Power2'
    });
  }

  // Return to original position
  returnToOrigin(callback) {
    // Also move hitZone back
    if (this.hitZone) {
      this.scene.tweens.add({
        targets: this.hitZone,
        x: this.startX,
        y: this.startY,
        duration: 200,
        ease: 'Power2'
      });
    }

    this.scene.tweens.add({
      targets: this,
      x: this.startX,
      y: this.startY,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Power2',
      onComplete: callback
    });

    this.setDepth(0);
  }

  // Animate successful placement (then destroy)
  animatePlacement(onComplete) {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        if (onComplete) onComplete();
        this.destroy();
      }
    });
  }

  // Shake animation for rejected placement
  animateReject() {
    const startX = this.x;
    this.scene.tweens.add({
      targets: this,
      x: startX + 8,
      duration: 50,
      yoyo: true,
      repeat: 3,
      ease: 'Power2',
      onComplete: () => {
        this.returnToOrigin();
      }
    });
  }

  // Update origin position (for re-arranging in dock)
  updateOrigin(x, y) {
    this.startX = x;
    this.startY = y;
  }

  // Override destroy to cleanup hitZone
  destroy(fromScene) {
    // Set destroyed flag BEFORE cleanup
    this.destroyed = true;

    // Kill any pending tweens
    if (this.scene) {
      this.scene.tweens.killTweensOf(this);
    }

    if (this.hitZone) {
      this.hitZone.destroy();
      this.hitZone = null;
    }
    this.shapeModel = null;
    super.destroy(fromScene);
  }
}
