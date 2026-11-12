// MenuScene - Main menu with Start, Shop buttons
import Phaser from 'phaser';
import { CONFIG, getLayout } from '../config.js';
import { StyleManager } from '../styles/StyleManager.js';
import { Button } from '../presentation/components/Button.js';
import { NeonFrame } from '../presentation/components/NeonFrame.js';
import { TabBar } from '../presentation/components/TabBar.js';
import { BackgroundDecorations } from '../presentation/components/BackgroundDecorations.js';
import { DailyCheckInModal } from '../presentation/components/DailyCheckInModal.js';
import { StreakManager } from '../data/StreakManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this._initGeneration = 0;
  }

  create() {
    // Bump generation to invalidate stale async chains from previous create()
    this._initGeneration++;

    // Stop all sounds from previous scene (prevents music overlap)
    this.sound.stopAll();

    // Clean up any leftover modal from previous create() cycle
    if (this.checkInModal) {
      this.checkInModal.destroy();
      this.checkInModal = null;
    }


    // Unlock audio on first user interaction (browser autoplay policy)
    this.unlockAudio();

    // Lazy-load music tracks in background (not blocking scene)
    const tracks = {
      'music_relaxation': 'assets/music/relaxation_04.mp3',
      'music_better_times': 'assets/music/better_times.mp3',
      'music_digital_clouds': 'assets/music/digital_clouds.mp3',
      'music_lonerism': 'assets/music/lonerism.mp3',
      'music_sun_in_your_eyes': 'assets/music/sun_in_your_eyes.mp3'
    };
    for (const [key, path] of Object.entries(tracks)) {
      if (!this.cache.audio.exists(key)) {
        this.load.audio(key, path);
      }
    }
    this.load.start();

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

    // Title - positioned in upper portion of content area
    const titleY = Math.floor(layout.tabBarY * 0.18);
    const title = this.add.text(layout.centerX, titleY, 'BASED\nBLOCKS', {
      fontSize: '52px',
      fontFamily: CONFIG.FONTS.primary,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 5,
      stroke: uiColors.titleColor,
      strokeThickness: 2,
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

    // Glow pulse animation
    this.tweens.add({
      targets: title,
      'shadow.blur': { from: 10, to: 20 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Content area center (between title and tabBar)
    const contentCenterY = Math.floor((titleY + 80 + layout.tabBarY) / 2);

    // Decorative frame behind buttons
    const frameWidth = 260;
    const frameHeight = 160;
    const menuFrame = new NeonFrame(this, layout.centerX, contentCenterY + 30, frameWidth, frameHeight, {
      filled: true,
      backgroundColor: colors.gridBackground,
      backgroundAlpha: 0.5
    });

    // Start button
    const startBtn = new Button(this, layout.centerX, contentCenterY, 'PLAY', () => {
      this.goToGame();
    }, {
      width: 180,
      height: 50,
      fontSize: '24px'
    });

    // Shop button
    const shopBtn = new Button(this, layout.centerX, contentCenterY + 60, 'SHOP', () => {
      this.goToShop();
    }, {
      width: 180,
      height: 45,
      fontSize: '22px'
    });

    // TabBar at bottom
    this.tabBar = new TabBar(this, 'home');

    // Store references for cleanup
    this.buttons = [startBtn, shopBtn];
    this.menuFrame = menuFrame;

    // Stagger animations for entrance
    const animatedElements = [title, menuFrame, startBtn, shopBtn];
    animatedElements.forEach((el, i) => {
      el.setAlpha(0);
      el.y += 20;
      this.tweens.add({
        targets: el,
        alpha: 1,
        y: el.y - 20,
        delay: i * 100,
        duration: 300,
        ease: 'Back.easeOut'
      });
    });

    // Pulse animation for primary button (PLAY GAME)
    this.tweens.add({
      targets: startBtn,
      scaleX: { from: 1, to: 1.02 },
      scaleY: { from: 1, to: 1.02 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 500  // Start after entrance animation
    });

    this.checkAndShowDailyCheckIn();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  checkAndShowDailyCheckIn() {
    if (!StreakManager.shouldShowCheckIn()) return;
    const generation = this._initGeneration;
    this.time.delayedCall(400, () => {
      if (generation === this._initGeneration && this.scene.isActive('MenuScene')) this.showDailyCheckIn();
    });
  }

  async showDailyCheckIn() {
    // Guard: check if scene is still active
    if (!this.scene || !this.scene.isActive('MenuScene')) {
      return;
    }

    // Guard: prevent duplicate modals
    if (this.checkInModal) {
      return;
    }

    // Read progress saved on this device
    const currentStreak = await StreakManager.getStreak();

    // Double-check after async operation
    if (!this.scene || !this.scene.isActive('MenuScene') || this.checkInModal) {
      return;
    }

    this.checkInModal = new DailyCheckInModal(
      this,
      currentStreak,
      (newStreak) => {
        // onClaim callback
        console.log('Claimed! New streak:', newStreak);
      },
      () => {
        // onClose callback (without claim)
        console.log('Closed without claim');
      }
    );
    this.checkInModal.show();
  }

  goToGame() {
    this.cameras.main.fadeOut(CONFIG.ANIMATION.FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('MenuScene');
      this.scene.start('GameScene');
    });
  }

  goToShop() {
    this.cameras.main.fadeOut(CONFIG.ANIMATION.FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('MenuScene');
      this.scene.start('ShopScene');
    });
  }

  unlockAudio() {
    // Browser autoplay policy requires user interaction to unlock audio
    const unlock = () => {
      if (this.sound && this.sound.context && this.sound.context.state === 'suspended') {
        this.sound.context.resume().then(() => {
          console.log('AudioContext unlocked');
        });
      }
      // Also try to unlock via Phaser's built-in method
      if (this.sound && this.sound.locked) {
        this.sound.unlock();
      }
      // Remove listeners after first interaction
      this.input.off('pointerdown', unlock);
    };

    this.input.on('pointerdown', unlock);
  }

  shutdown() {
    // Cleanup
    if (this.buttons) {
      this.buttons.forEach(btn => btn.destroy());
    }
    if (this.menuFrame) {
      this.menuFrame.destroy();
    }
    if (this.tabBar) {
      this.tabBar.destroy();
    }
    if (this.decorations) {
      BackgroundDecorations.destroyAll(this.decorations);
    }
    if (this.checkInModal) {
      this.checkInModal.destroy();
      this.checkInModal = null;
    }
  }
}
