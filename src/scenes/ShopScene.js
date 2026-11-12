// ShopScene - Shop for purchasing styles/themes
import Phaser from 'phaser';
import { CONFIG, getLayout } from '../config.js';
import { StyleManager } from '../styles/StyleManager.js';
import { NeonFrame } from '../presentation/components/NeonFrame.js';
import { TabBar } from '../presentation/components/TabBar.js';
import { BackgroundDecorations } from '../presentation/components/BackgroundDecorations.js';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ShopScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    const colors = StyleManager.getColors();
    const uiColors = StyleManager.getUIColors();

    // Get adaptive layout
    const layout = getLayout(width, height);

    // Set background
    this.cameras.main.setBackgroundColor(colors.background);

    // Background decorations
    this.decorations = BackgroundDecorations.createAll(this);

    // Fade in
    this.cameras.main.fadeIn(CONFIG.ANIMATION.FADE_DURATION, 0, 0, 0);

    // Title
    const title = this.add.text(layout.centerX, 50, 'SHOP', {
      fontSize: '28px',
      fontFamily: CONFIG.FONTS.primary,
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: uiColors.titleColor,
      strokeThickness: 1,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: uiColors.titleColor,
        blur: 10,
        fill: true
      },
      resolution: 2
    });
    title.setOrigin(0.5, 0.5);

    // Shop items container
    this.itemFrames = [];

    // Calculate available space for items
    const availableHeight = layout.tabBarY - 90;
    const itemHeight = Math.min(100, Math.floor(availableHeight / 3.5));
    const spacing = Math.min(15, Math.floor(itemHeight * 0.15));
    const startY = 90;
    const itemWidth = Math.min(340, width - 40);

    // ===========================================
    // 1. NEON THEME
    // ===========================================
    const neonY = startY;
    this.createThemeSlot('neon', layout.centerX, neonY, itemWidth, itemHeight, colors, uiColors);

    // ===========================================
    // 2. MATRIX THEME
    // ===========================================
    const matrixY = startY + itemHeight + spacing;
    this.createThemeSlot('matrix', layout.centerX, matrixY, itemWidth, itemHeight, colors, uiColors);

    // ===========================================
    // 3. LOCKED THEME (darkened)
    // ===========================================
    const lockedY = startY + (itemHeight + spacing) * 2;

    // Darkened frame
    const lockedBg = this.add.graphics();
    lockedBg.fillStyle(0x111111, 0.8);
    lockedBg.fillRoundedRect(
      layout.centerX - itemWidth / 2,
      lockedY,
      itemWidth,
      itemHeight,
      10
    );

    // Subtle border
    lockedBg.lineStyle(2, 0x333333, 0.5);
    lockedBg.strokeRoundedRect(
      layout.centerX - itemWidth / 2,
      lockedY,
      itemWidth,
      itemHeight,
      10
    );

    this.add.text(layout.centerX, lockedY + Math.floor(itemHeight * 0.35), '???', {
      fontSize: '24px',
      fontFamily: CONFIG.FONTS.primary,
      fontStyle: 'bold',
      color: '#444444',
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(layout.centerX, lockedY + Math.floor(itemHeight * 0.65), 'LOCKED', {
      fontSize: '14px',
      fontFamily: CONFIG.FONTS.primary,
      color: '#555555',
      resolution: 2
    }).setOrigin(0.5);

    // TabBar at bottom (no active tab - Shop is not in TabBar)
    this.tabBar = new TabBar(this, null);
  }

  // Create a theme slot with equip/equipped state
  createThemeSlot(themeId, centerX, y, itemWidth, itemHeight, colors, uiColors) {
    const theme = StyleManager.themes[themeId];
    if (!theme) return;

    const isActive = StyleManager.getActiveStyleId() === themeId;
    const themeColors = theme.colors;

    // Frame
    const frame = new NeonFrame(this, centerX, y + itemHeight / 2, itemWidth, itemHeight, {
      filled: true,
      backgroundColor: themeColors.gridBackground,
      backgroundAlpha: 0.6
    });
    this.itemFrames.push(frame);

    // Theme name
    this.add.text(centerX, y + Math.floor(itemHeight * 0.35), theme.name.toUpperCase(), {
      fontSize: '24px',
      fontFamily: CONFIG.FONTS.primary,
      fontStyle: 'bold',
      color: themeColors.ui.titleColor,
      resolution: 2
    }).setOrigin(0.5);

    // Status text
    const statusText = this.add.text(centerX, y + Math.floor(itemHeight * 0.65),
      isActive ? 'EQUIPPED' : 'EQUIP', {
        fontSize: '14px',
        fontFamily: CONFIG.FONTS.primary,
        color: isActive ? uiColors.textSuccess : themeColors.ui.textAccent,
        resolution: 2
      }).setOrigin(0.5);

    // Make non-active slots tappable
    if (!isActive) {
      const hitZone = this.add.rectangle(centerX, y + itemHeight / 2, itemWidth, itemHeight, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => {
        if (!StyleManager.isUnlocked(themeId)) {
          StyleManager.unlockStyle(themeId);
        }
        StyleManager.setActiveStyle(themeId);
        // Restart scene to reflect new theme
        this.scene.restart();
      });
    }
  }

  shutdown() {
    // Cleanup
    if (this.itemFrames) {
      this.itemFrames.forEach(frame => frame.destroy());
    }
    if (this.tabBar) {
      this.tabBar.destroy();
    }
    if (this.decorations) {
      BackgroundDecorations.destroyAll(this.decorations);
    }
  }
}
