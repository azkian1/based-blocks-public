// TabBar - Bottom navigation component with vector icons
import Phaser from 'phaser';
import { CONFIG, getLayout } from '../../config.js';
import { StyleManager } from '../../styles/StyleManager.js';

export class TabBar extends Phaser.GameObjects.Container {
  constructor(scene, activeTab = 'home') {
    // Get adaptive layout based on current canvas size
    const { width, height } = scene.cameras.main;
    const layout = getLayout(width, height);

    super(scene, 0, layout.tabBarY);

    this.activeTab = activeTab;
    this.tabButtons = [];

    this.create();

    scene.add.existing(this);
  }

  create() {
    const { width } = this.scene.cameras.main;
    const uiColors = StyleManager.getUIColors();
    const colors = StyleManager.getColors();
    const tabConfig = CONFIG.TAB_BAR;

    // Background bar
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(colors.gridBackground, 0.95);
    this.bg.fillRect(0, 0, width, tabConfig.HEIGHT);

    // Top border line
    const borderColor = Phaser.Display.Color.HexStringToColor(uiColors.textSecondary).color;
    this.bg.lineStyle(1, borderColor, 0.3);
    this.bg.beginPath();
    this.bg.moveTo(0, 0);
    this.bg.lineTo(width, 0);
    this.bg.strokePath();

    this.add(this.bg);

    // Create tab buttons
    const tabs = tabConfig.TABS;
    const buttonWidth = width / tabs.length;
    const activeColor = Phaser.Display.Color.HexStringToColor(uiColors.titleColor).color;
    const inactiveColor = Phaser.Display.Color.HexStringToColor(uiColors.textSecondary).color;

    // Draw separators between tabs
    tabs.forEach((tab, index) => {
      if (index > 0) {
        this.bg.lineStyle(1, borderColor, 0.2);
        this.bg.beginPath();
        this.bg.moveTo(buttonWidth * index, 12);
        this.bg.lineTo(buttonWidth * index, tabConfig.HEIGHT - 12);
        this.bg.strokePath();
      }
    });

    tabs.forEach((tab, index) => {
      const x = buttonWidth * index + buttonWidth / 2;
      const y = tabConfig.HEIGHT / 2;
      const isActive = tab === this.activeTab;

      // Button container
      const btnContainer = this.scene.add.container(x, y);

      // Icon graphics (centered vertically now, no label)
      const iconGraphics = this.scene.add.graphics();
      const iconColor = isActive ? activeColor : inactiveColor;
      this.drawIcon(iconGraphics, tab, 0, 0, iconColor, 20);

      // Active indicator
      const indicator = this.scene.add.graphics();
      if (isActive) {
        // Glow circle behind icon
        indicator.fillStyle(activeColor, 0.15);
        indicator.fillCircle(0, 0, 26);

        // Bottom bar indicator
        indicator.fillStyle(activeColor, 1);
        indicator.fillRoundedRect(-16, 22, 32, 3, 1.5);
      }

      btnContainer.add([indicator, iconGraphics]);
      this.add(btnContainer);

      // Hit zone
      const hitZone = this.scene.add.zone(x, y, buttonWidth, tabConfig.HEIGHT);
      hitZone.setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => {
        if (tab !== this.activeTab) {
          this.navigateToTab(tab);
        }
      });

      // Hover effect
      hitZone.on('pointerover', () => {
        if (tab !== this.activeTab) {
          iconGraphics.clear();
          this.drawIcon(iconGraphics, tab, 0, 0, activeColor, 20);
        }
      });

      hitZone.on('pointerout', () => {
        if (tab !== this.activeTab) {
          iconGraphics.clear();
          this.drawIcon(iconGraphics, tab, 0, 0, inactiveColor, 20);
        }
      });

      // Add hitZone to container's zone tracking
      this.add(hitZone);

      this.tabButtons.push({
        tab,
        container: btnContainer,
        iconGraphics,
        indicator,
        hitZone
      });
    });
  }

  drawIcon(graphics, type, x, y, color, size = 18) {
    graphics.lineStyle(2, color, 1);

    switch (type) {
      case 'home':
        // House icon
        const hh = size * 0.5;  // half height
        const hw = size * 0.5;  // half width
        // Roof
        graphics.beginPath();
        graphics.moveTo(x - hw, y);
        graphics.lineTo(x, y - hh);
        graphics.lineTo(x + hw, y);
        graphics.strokePath();
        // Body
        graphics.strokeRect(x - hw * 0.7, y, hw * 1.4, hh);
        // Door
        graphics.strokeRect(x - hw * 0.2, y + hh * 0.4, hw * 0.4, hh * 0.6);
        break;

      case 'leaderboard':
        // Trophy icon
        const tw = size * 0.4;
        const th = size * 0.5;
        // Cup body
        graphics.beginPath();
        graphics.moveTo(x - tw, y - th);
        graphics.lineTo(x - tw * 0.7, y + th * 0.3);
        graphics.lineTo(x + tw * 0.7, y + th * 0.3);
        graphics.lineTo(x + tw, y - th);
        graphics.strokePath();
        // Top line
        graphics.beginPath();
        graphics.moveTo(x - tw, y - th);
        graphics.lineTo(x + tw, y - th);
        graphics.strokePath();
        // Handles
        graphics.beginPath();
        graphics.arc(x - tw, y - th * 0.3, tw * 0.4, Math.PI * 0.5, Math.PI * 1.5, false);
        graphics.strokePath();
        graphics.beginPath();
        graphics.arc(x + tw, y - th * 0.3, tw * 0.4, Math.PI * 1.5, Math.PI * 0.5, false);
        graphics.strokePath();
        // Base
        graphics.strokeRect(x - tw * 0.5, y + th * 0.3, tw, th * 0.3);
        graphics.strokeRect(x - tw * 0.7, y + th * 0.6, tw * 1.4, th * 0.15);
        break;

      case 'profile':
        // Person icon
        const pr = size * 0.25;  // head radius
        // Head
        graphics.strokeCircle(x, y - pr * 1.2, pr);
        // Body
        graphics.beginPath();
        graphics.moveTo(x - pr * 1.5, y + pr * 2);
        graphics.lineTo(x - pr * 1.2, y + pr * 0.5);
        graphics.lineTo(x + pr * 1.2, y + pr * 0.5);
        graphics.lineTo(x + pr * 1.5, y + pr * 2);
        graphics.strokePath();
        break;
    }
  }

  getTabLabel(tab) {
    const labels = {
      home: 'Home',
      leaderboard: 'Records',
      profile: 'Progress'
    };
    return labels[tab] || tab;
  }

  navigateToTab(tab) {
    const targetScene = CONFIG.TAB_BAR.SCENES[tab];
    if (targetScene) {
      // Play click sound if available
      if (this.scene.cache.audio.exists('click')) {
        this.scene.sound.play('click', { volume: 0.5 });
      }

      this.scene.cameras.main.fadeOut(CONFIG.ANIMATION.FADE_DURATION, 0, 0, 0);
      this.scene.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.scene.start(targetScene);
      });
    }
  }

  destroy() {
    this.tabButtons.forEach(btn => {
      if (btn.hitZone) btn.hitZone.destroy();
      if (btn.container) btn.container.destroy();
    });
    if (this.bg) this.bg.destroy();
    super.destroy();
  }
}
