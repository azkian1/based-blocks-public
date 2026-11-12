// NeonFrame - A container with neon glow border effect
import Phaser from 'phaser';
import { StyleManager } from '../../styles/StyleManager.js';

export class NeonFrame extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, options = {}) {
    super(scene, x, y);

    this.frameWidth = width;
    this.frameHeight = height;
    this.options = {
      filled: true,           // Fill background
      cornerRadius: 8,
      ...options
    };

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

    const style = StyleManager.getFrameStyle();
    const colors = StyleManager.getColors();
    const w = this.frameWidth;
    const h = this.frameHeight;
    const radius = this.options.cornerRadius || style.cornerRadius || 8;

    // Draw glow layers (outer to inner) - simplified to 2 layers
    const glowLayers = 2;
    for (let i = glowLayers; i >= 1; i--) {
      const offset = i * 2;
      const alpha = (style.glowAlpha || 0.4) / (i + 1);

      this.graphics.lineStyle(1.5, style.glowColor, alpha);
      this.graphics.strokeRoundedRect(
        -w / 2 - offset,
        -h / 2 - offset,
        w + offset * 2,
        h + offset * 2,
        radius + i
      );
    }

    // Draw background fill
    if (this.options.filled) {
      const bgColor = this.options.backgroundColor !== undefined
        ? this.options.backgroundColor
        : colors.gridBackground;

      this.graphics.fillStyle(bgColor, this.options.backgroundAlpha || 1);
      this.graphics.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    }

    // Draw main border
    this.graphics.lineStyle(2, style.stroke, style.strokeAlpha || 1);
    this.graphics.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  }

  // Update style (e.g., when theme changes)
  updateStyle() {
    this.draw();
  }

  // Set new dimensions
  setSize(width, height) {
    this.frameWidth = width;
    this.frameHeight = height;
    this.draw();
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
    super.destroy();
  }
}
