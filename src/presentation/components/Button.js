// Button - Premium neon styled button for menus
import Phaser from 'phaser';
import { CONFIG } from '../../config.js';
import { StyleManager } from '../../styles/StyleManager.js';

export class Button extends Phaser.GameObjects.Container {
  constructor(scene, x, y, text, callback, options = {}) {
    super(scene, x, y);

    this.buttonText = text;
    this.callback = callback;
    this.options = {
      width: 200,
      height: 50,
      fontSize: '24px',
      cornerRadius: 8,
      ...options
    };

    this.graphics = null;
    this.label = null;
    this.isHovered = false;
    this.isPressed = false;

    this.create();

    scene.add.existing(this);
  }

  create() {
    const { width, height, fontSize, cornerRadius } = this.options;
    const uiColors = StyleManager.getUIColors();
    const frameStyle = StyleManager.getFrameStyle();

    // Create graphics for background
    this.graphics = this.scene.add.graphics();
    this.add(this.graphics);

    // Draw initial state
    this.drawButton(false);

    // Create text label
    this.label = this.scene.add.text(0, 0, this.buttonText, {
      fontSize: fontSize,
      fontFamily: CONFIG.FONTS.primary,
      fontStyle: 'bold',
      color: uiColors.buttonText,
      resolution: 2
    });
    this.label.setOrigin(0.5, 0.5);
    this.add(this.label);

    // Create hit zone for reliable interaction
    this.hitZone = this.scene.add.zone(this.x, this.y, width, height);
    this.hitZone.setInteractive({ useHandCursor: true });

    // Event handlers on the zone
    this.hitZone.on('pointerover', () => {
      this.isHovered = true;
      this.drawButton(true);
      this.label.setColor(uiColors.buttonHover);

      // Play hover sound if available
      if (this.scene.cache.audio.exists('hover')) {
        this.scene.sound.play('hover', { volume: 0.2 });
      }
    });

    this.hitZone.on('pointerout', () => {
      this.isHovered = false;
      this.isPressed = false;
      this.drawButton(false);
      this.label.setColor(uiColors.buttonText);
    });

    this.hitZone.on('pointerdown', () => {
      this.isPressed = true;

      // Play click sound if available
      if (this.scene.cache.audio.exists('click')) {
        this.scene.sound.play('click', { volume: 0.5 });
      }

      // Flash effect
      this.drawButtonPressed();

      // Scale down + flash + callback
      this.scene.tweens.add({
        targets: this,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        onComplete: () => {
          this.isPressed = false;
          this.drawButton(this.isHovered);
          if (this.callback) {
            this.callback();
          }
        }
      });
    });
  }

  drawButton(hovered) {
    const { width, height, cornerRadius } = this.options;
    const uiColors = StyleManager.getUIColors();
    const frameStyle = StyleManager.getFrameStyle();

    this.graphics.clear();

    const halfW = width / 2;
    const halfH = height / 2;

    // Outer glow (simplified - 2 layers instead of 3)
    const glowAlpha = hovered ? 0.4 : 0.15;
    for (let i = 2; i >= 1; i--) {
      this.graphics.lineStyle(1.5, frameStyle.glowColor, glowAlpha / i);
      this.graphics.strokeRoundedRect(
        -halfW - i * 2,
        -halfH - i * 2,
        width + i * 4,
        height + i * 4,
        cornerRadius + i
      );
    }

    // Main background
    const bgAlpha = hovered ? 0.25 : 0.15;
    this.graphics.fillStyle(uiColors.buttonBg, bgAlpha);
    this.graphics.fillRoundedRect(-halfW, -halfH, width, height, cornerRadius);

    // Border
    const borderAlpha = hovered ? 1 : 0.7;
    this.graphics.lineStyle(2, frameStyle.stroke, borderAlpha);
    this.graphics.strokeRoundedRect(-halfW, -halfH, width, height, cornerRadius);
  }

  drawButtonPressed() {
    const { width, height, cornerRadius } = this.options;
    const frameStyle = StyleManager.getFrameStyle();

    this.graphics.clear();

    const halfW = width / 2;
    const halfH = height / 2;

    // Flash glow (simplified - 2 layers)
    for (let i = 2; i >= 1; i--) {
      this.graphics.lineStyle(1.5, frameStyle.glowColor, 0.5 / i);
      this.graphics.strokeRoundedRect(
        -halfW - i * 2,
        -halfH - i * 2,
        width + i * 4,
        height + i * 4,
        cornerRadius + i
      );
    }

    // Flash background (white overlay)
    this.graphics.fillStyle(0xffffff, 0.3);
    this.graphics.fillRoundedRect(-halfW, -halfH, width, height, cornerRadius);

    // Border
    this.graphics.lineStyle(2, frameStyle.stroke, 1);
    this.graphics.strokeRoundedRect(-halfW, -halfH, width, height, cornerRadius);
  }

  // Update button text
  setText(text) {
    this.buttonText = text;
    if (this.label) {
      this.label.setText(text);
    }
  }

  // Enable/disable button
  setEnabled(enabled) {
    if (enabled) {
      if (this.hitZone) {
        this.hitZone.setInteractive({ useHandCursor: true });
      }
      this.alpha = 1;
    } else {
      if (this.hitZone) {
        this.hitZone.disableInteractive();
      }
      this.alpha = 0.5;
    }
  }

  // Update style (e.g., when theme changes)
  updateStyle() {
    const uiColors = StyleManager.getUIColors();
    this.drawButton(this.isHovered);
    this.label.setColor(this.isHovered ? uiColors.buttonHover : uiColors.buttonText);
  }

  destroy() {
    if (this.hitZone) {
      this.hitZone.destroy();
      this.hitZone = null;
    }
    if (this.graphics) {
      this.graphics.destroy();
    }
    if (this.label) {
      this.label.destroy();
    }
    super.destroy();
  }
}
