// BackgroundDecorations - Decorative background elements for premium UI
import Phaser from 'phaser';
import { StyleManager } from '../../styles/StyleManager.js';

export class BackgroundDecorations {
  /**
   * Draw subtle grid pattern on background
   * @param {Phaser.Scene} scene
   * @param {number} width - Scene width
   * @param {number} height - Scene height
   * @param {number} spacing - Grid spacing (default 40)
   * @returns {Phaser.GameObjects.Graphics}
   */
  static drawGrid(scene, width, height, spacing = 40) {
    const uiColors = StyleManager.getUIColors();
    const gridColor = Phaser.Display.Color.HexStringToColor(uiColors.titleColor).color;

    const grid = scene.add.graphics();
    grid.lineStyle(1, gridColor, 0.03);

    // Vertical lines
    for (let x = 0; x < width; x += spacing) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
    }

    // Horizontal lines
    for (let y = 0; y < height; y += spacing) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }

    grid.strokePath();
    grid.setDepth(-10);

    return grid;
  }

  /**
   * Draw corner accent lines
   * @param {Phaser.Scene} scene
   * @param {number} width - Scene width
   * @param {number} height - Scene height
   * @param {number} size - Corner size (default 30)
   * @returns {Phaser.GameObjects.Graphics}
   */
  static drawCornerAccents(scene, width, height, size = 40) {
    const uiColors = StyleManager.getUIColors();
    const accentColor = Phaser.Display.Color.HexStringToColor(uiColors.titleColor).color;

    const corners = scene.add.graphics();

    // Margins
    const topMargin = 8;
    const bottomY = height - 68; // Above TabBar (60px + 8px margin)

    // Main corner lines
    corners.lineStyle(2, accentColor, 0.6);

    // Top-left corner
    corners.beginPath();
    corners.moveTo(0, topMargin + size);
    corners.lineTo(0, topMargin);
    corners.lineTo(size, topMargin);
    corners.strokePath();

    // Top-right corner
    corners.beginPath();
    corners.moveTo(width - size, topMargin);
    corners.lineTo(width, topMargin);
    corners.lineTo(width, topMargin + size);
    corners.strokePath();

    // Bottom-left corner (above TabBar)
    corners.beginPath();
    corners.moveTo(0, bottomY - size);
    corners.lineTo(0, bottomY);
    corners.lineTo(size, bottomY);
    corners.strokePath();

    // Bottom-right corner (above TabBar)
    corners.beginPath();
    corners.moveTo(width - size, bottomY);
    corners.lineTo(width, bottomY);
    corners.lineTo(width, bottomY - size);
    corners.strokePath();

    // Inner accent lines (smaller, creates depth)
    corners.lineStyle(1, accentColor, 0.3);
    const innerSize = size - 10;
    const offset = 5;

    // Top-left inner
    corners.beginPath();
    corners.moveTo(offset, topMargin + innerSize + offset);
    corners.lineTo(offset, topMargin + offset);
    corners.lineTo(innerSize + offset, topMargin + offset);
    corners.strokePath();

    // Top-right inner
    corners.beginPath();
    corners.moveTo(width - innerSize - offset, topMargin + offset);
    corners.lineTo(width - offset, topMargin + offset);
    corners.lineTo(width - offset, topMargin + innerSize + offset);
    corners.strokePath();

    // Bottom-left inner
    corners.beginPath();
    corners.moveTo(offset, bottomY - innerSize - offset);
    corners.lineTo(offset, bottomY - offset);
    corners.lineTo(innerSize + offset, bottomY - offset);
    corners.strokePath();

    // Bottom-right inner
    corners.beginPath();
    corners.moveTo(width - innerSize - offset, bottomY - offset);
    corners.lineTo(width - offset, bottomY - offset);
    corners.lineTo(width - offset, bottomY - innerSize - offset);
    corners.strokePath();

    corners.setDepth(-5);

    return corners;
  }

  /**
   * Draw vignette effect (darkened edges)
   * @param {Phaser.Scene} scene
   * @param {number} width - Scene width
   * @param {number} height - Scene height
   * @returns {Phaser.GameObjects.Graphics}
   */
  static drawVignette(scene, width, height) {
    const colors = StyleManager.getColors();
    const vignette = scene.add.graphics();

    // Top vignette
    vignette.fillGradientStyle(0x000000, 0x000000, colors.background, colors.background, 0.3, 0.3, 0, 0);
    vignette.fillRect(0, 0, width, height / 4);

    // Bottom vignette
    vignette.fillGradientStyle(colors.background, colors.background, 0x000000, 0x000000, 0, 0, 0.4, 0.4);
    vignette.fillRect(0, height * 0.75, width, height / 4);

    vignette.setDepth(-8);

    return vignette;
  }

  /**
   * Create all decorations at once
   * @param {Phaser.Scene} scene
   * @param {object} options - { grid: true, corners: true, vignette: true }
   * @returns {object} - { grid, corners, vignette }
   */
  static createAll(scene, options = {}) {
    const { width, height } = scene.cameras.main;
    const opts = { grid: true, corners: true, vignette: true, ...options };

    const decorations = {};

    if (opts.vignette) {
      decorations.vignette = this.drawVignette(scene, width, height);
    }

    if (opts.grid) {
      decorations.grid = this.drawGrid(scene, width, height);
    }

    if (opts.corners) {
      decorations.corners = this.drawCornerAccents(scene, width, height);
    }

    return decorations;
  }

  /**
   * Destroy all decorations
   * @param {object} decorations - Object from createAll
   */
  static destroyAll(decorations) {
    if (decorations) {
      if (decorations.grid) decorations.grid.destroy();
      if (decorations.corners) decorations.corners.destroy();
      if (decorations.vignette) decorations.vignette.destroy();
    }
  }
}
