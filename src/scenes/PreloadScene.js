// PreloadScene - Asset loading with progress bar
import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { StyleManager } from '../styles/StyleManager.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    const { width, height } = this.cameras.main;
    const colors = StyleManager.getColors();
    const uiColors = StyleManager.getUIColors();

    // Background
    this.cameras.main.setBackgroundColor(colors.background);

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 60, 'LOADING', {
      fontSize: '28px',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: uiColors.titleColor
    });
    loadingText.setOrigin(0.5, 0.5);

    // Progress bar background
    const barWidth = 280;
    const barHeight = 20;
    const barX = width / 2 - barWidth / 2;
    const barY = height / 2;

    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x222233, 1);
    progressBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

    // Progress bar fill
    const progressBar = this.add.graphics();

    // Glow effect for progress bar
    const progressGlow = this.add.graphics();

    // Progress event
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressGlow.clear();

      const fillWidth = (barWidth - 4) * value;

      // Draw glow
      if (fillWidth > 0) {
        progressGlow.fillStyle(colors.frame.glowColor, 0.3);
        progressGlow.fillRoundedRect(barX + 2, barY + 2, fillWidth, barHeight - 4, 3);
      }

      // Draw fill
      progressBar.fillStyle(colors.frame.stroke, 1);
      progressBar.fillRoundedRect(barX + 2, barY + 2, fillWidth, barHeight - 4, 3);
    });

    // Complete event
    this.load.on('complete', () => {
      progressBar.destroy();
      progressGlow.destroy();
      progressBg.destroy();
      loadingText.destroy();
    });

    // === SOUNDS ===
    // Actions
    this.load.audio('place', 'assets/sounds/actions/drop_003.ogg');
    this.load.audio('pickup', 'assets/sounds/actions/pickup.ogg');
    this.load.audio('click', 'assets/sounds/actions/click.ogg');
    this.load.audio('invalid', 'assets/sounds/actions/invalid.ogg');

    // Clear (line clear)
    this.load.audio('clear1', 'assets/sounds/clear/clear1.ogg');
    this.load.audio('clear2', 'assets/sounds/clear/clear2.ogg');
    this.load.audio('clear3', 'assets/sounds/clear/clear3.ogg');
    this.load.audio('clear4', 'assets/sounds/clear/clear4.ogg');

    // Combo
    this.load.audio('combo2', 'assets/sounds/combo/combo2.ogg');
    this.load.audio('combo3', 'assets/sounds/combo/combo3.ogg');
    this.load.audio('combo4', 'assets/sounds/combo/combo4.ogg');
    this.load.audio('combo5', 'assets/sounds/combo/combo5.ogg');

    // Milestones
    this.load.audio('milestone_small', 'assets/sounds/milestone/milestone_small.ogg');
    this.load.audio('milestone_medium', 'assets/sounds/milestone/milestone_medium.wav');
    this.load.audio('milestone_big', 'assets/sounds/milestone/milestone_big.wav');

    // Game state
    this.load.audio('gameover', 'assets/sounds/state/gameover.ogg');
    this.load.audio('newbest', 'assets/sounds/state/newbest.wav');

    // === UI SVG ===
    this.load.svg('btn_mute_normal', 'assets/ui/svg/buttons/btn_mute_normal.svg', { width: 40, height: 40 });
    this.load.svg('btn_mute_hover', 'assets/ui/svg/buttons/btn_mute_hover.svg', { width: 40, height: 40 });
    this.load.svg('icon_sound_on', 'assets/ui/svg/icons/icon_sound_on.svg', { width: 24, height: 24 });
    this.load.svg('icon_sound_off', 'assets/ui/svg/icons/icon_sound_off.svg', { width: 24, height: 24 });
  }

  create() {
    // Initialize StyleManager with scene's event emitter
    StyleManager.setEventEmitter(this.game.events);


    // Transition to MenuScene immediately
    this.cameras.main.fadeOut(CONFIG.ANIMATION.FADE_DURATION, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

}
