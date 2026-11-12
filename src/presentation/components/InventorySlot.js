// InventorySlot - A visual slot for holding shapes in the inventory
import Phaser from 'phaser';
import { StyleManager } from '../../styles/StyleManager.js';
import { CONFIG } from '../../config.js';

export class InventorySlot extends Phaser.GameObjects.Container {
  constructor(scene, x, y, size = CONFIG.INVENTORY.SLOT_SIZE) {
    super(scene, x, y);

    this.slotSize = size;
    this.isEmpty = true;
    this.shapeView = null;
    this.graphics = null;

    this.draw();

    scene.add.existing(this);
  }

  draw() {
    // Remove old graphics if exists
    if (this.graphics) {
      this.graphics.destroy();
    }

    this.graphics = this.scene.add.graphics();
    this.add(this.graphics);

    const colors = StyleManager.getColors();
    const slotStyle = colors.slot;
    const size = this.slotSize;
    const halfSize = size / 2;
    const radius = Math.max(4, Math.round(size * 0.075));  // Adaptive: ~6px at 80

    // Draw slot background (visible when empty)
    this.graphics.fillStyle(slotStyle.empty, slotStyle.emptyAlpha);
    this.graphics.fillRoundedRect(-halfSize, -halfSize, size, size, radius);

    // Draw slot border
    this.graphics.lineStyle(1, slotStyle.border, slotStyle.borderAlpha);
    this.graphics.strokeRoundedRect(-halfSize, -halfSize, size, size, radius);
  }

  // Set slot as empty (show empty state)
  setEmpty() {
    this.isEmpty = true;
    this.shapeView = null;
    // Slot background is always visible, no change needed
  }

  // Set slot with a shape
  setShape(shapeView) {
    this.isEmpty = false;
    this.shapeView = shapeView;
  }

  // Get center position in world coordinates
  getWorldPosition() {
    return {
      x: this.x + this.parentContainer?.x || this.x,
      y: this.y + this.parentContainer?.y || this.y
    };
  }

  // Update style (e.g., when theme changes)
  updateStyle() {
    this.draw();
  }

  // Update slot size on viewport resize
  updateSize(newSize) {
    if (this.slotSize === newSize) return;
    this.slotSize = newSize;
    this.draw();
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
    super.destroy();
  }
}
