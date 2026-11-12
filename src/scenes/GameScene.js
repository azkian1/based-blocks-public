import Phaser from 'phaser';
import { CONFIG, getLayout } from '../config.js';
import { EVENTS } from '../events.js';
import { StyleManager } from '../styles/StyleManager.js';
import { AudioManager } from '../data/AudioManager.js';

// Core
import { GameController } from '../core/GameController.js';

// Presentation
import { GridView } from '../presentation/GridView.js';
import { InputManager } from '../presentation/InputManager.js';
import { EffectsManager } from '../presentation/EffectsManager.js';
import { SoundManager } from '../presentation/SoundManager.js';
import { MusicManager } from '../presentation/MusicManager.js';
import { UIManager } from '../presentation/UIManager.js';

// GameScene - Main gameplay scene
// Owner: BOTH agents (integration point)
// PSYCHEDELIC VERSION - Pulse Everything!
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const colors = StyleManager.getColors();

    // Get adaptive layout based on current canvas size
    const { width, height } = this.cameras.main;
    this.layout = getLayout(width, height);

    // Create pulsing background
    this.createPsychedelicBackground(colors);

    // Set camera background as fallback
    this.cameras.main.setBackgroundColor(colors.background);

    // Fade in from menu
    this.cameras.main.fadeIn(CONFIG.ANIMATION.FADE_DURATION, 0, 0, 0);

    // Create event emitter for communication between Core and Presentation
    this.gameEvents = new Phaser.Events.EventEmitter();

    // ============================================
    // AGENT A: Core Logic
    // ============================================
    this.gameController = new GameController(this.gameEvents);

    // ============================================
    // AGENT B: Presentation
    // ============================================
    this.gridView = new GridView(this, this.layout.gridOffsetX, this.layout.gridOffsetY, this.gameEvents, this.layout.cellSize);
    this.inputManager = new InputManager(this, this.gridView, this.gameEvents, this.layout.cellSize);
    this.effectsManager = new EffectsManager(this, this.gridView, this.gameEvents);
    this.soundManager = new SoundManager(this, this.gameEvents);
    this.musicManager = new MusicManager(this);
    this.musicTrackKeys = [
      'music_relaxation',
      'music_better_times',
      'music_digital_clouds',
      'music_lonerism',
      'music_sun_in_your_eyes'
    ];
    this.musicManager.loadTracks(this.musicTrackKeys);

    if (this.musicManager.tracks.length > 0) {
      // Tracks already cached from MenuScene — play immediately
      this.musicManager.play();
    } else {
      // Tracks still loading — load here as fallback and play when ready
      const trackPaths = {
        'music_relaxation': 'assets/music/relaxation_04.mp3',
        'music_better_times': 'assets/music/better_times.mp3',
        'music_digital_clouds': 'assets/music/digital_clouds.mp3',
        'music_lonerism': 'assets/music/lonerism.mp3',
        'music_sun_in_your_eyes': 'assets/music/sun_in_your_eyes.mp3'
      };
      for (const [key, path] of Object.entries(trackPaths)) {
        if (!this.cache.audio.exists(key)) {
          this.load.audio(key, path);
        }
      }
      this.load.once('complete', () => {
        if (this.musicManager && !this.musicManager.isDestroyed) {
          this.musicManager.loadTracks(this.musicTrackKeys);
          this.musicManager.play();
        }
      });
      this.load.start();
    }
    this.uiManager = new UIManager(this, this.gameEvents, this.inputManager, this.layout);

    // Start UI scene in parallel
    this.scene.launch('UIScene', { gameEvents: this.gameEvents });

    // Create bound event handlers for psychedelic effects
    this.boundHandleLinesCleared = this.handlePsychedelicLinesCleared.bind(this);
    this.boundHandleScoreUpdated = this.handlePsychedelicScoreUpdated.bind(this);
    this.boundHandleStreakUpdated = this.handlePsychedelicStreakUpdated.bind(this);

    // Setup psychedelic event listeners
    this.setupPsychedelicEffects();

    // Mute button (top-right)
    this.createMuteButton();

    // Start the game
    this.gameController.startGame();

    // Subscribe to viewport resize events
    this.game.events.on('viewport-resize', this.handleViewportResize, this);

    console.log('GameScene initialized (PSYCHEDELIC MODE)');
  }

  // ===========================================
  // VIEWPORT RESIZE HANDLING
  // ===========================================

  handleViewportResize({ width, height }) {
    // Recalculate layout
    this.layout = getLayout(width, height);

    // Update mute button position
    this.updateMuteButtonPosition();

    // Redraw background
    this.redrawBackground();

    // Update GridView position
    if (this.gridView) {
      this.gridView.setPosition(this.layout.gridOffsetX, this.layout.gridOffsetY);
    }

    // Update inventory position and sizes
    if (this.uiManager) {
      this.uiManager.handleViewportResize(width, height, this.layout);
    }

    console.log('[GameScene] Viewport resized:', width, 'x', height);
  }

  updateMuteButtonPosition() {
    const { width } = this.cameras.main;
    const x = width - 30;
    const y = 30;

    if (this.muteBtn) this.muteBtn.setPosition(x, y);
    if (this.muteIcon) this.muteIcon.setPosition(x, y);
    if (this.muteZone) this.muteZone.setPosition(x, y);
  }

  redrawBackground() {
    const colors = StyleManager.getColors();
    const { width, height } = this.cameras.main;

    // Redraw base background
    if (this.bgGraphics) {
      this.bgGraphics.clear();
      this.bgGraphics.fillStyle(colors.background, 1);
      this.bgGraphics.fillRect(0, 0, width, height);
    }

    // Clear glow overlay (will be redrawn on next effect)
    if (this.glowOverlay) {
      this.glowOverlay.clear();
      this.glowOverlay.setAlpha(0);
    }
  }

  // ===========================================
  // PSYCHEDELIC BACKGROUND
  // ===========================================

  createPsychedelicBackground(colors) {
    const { width, height } = this.cameras.main;

    // Create gradient background that can pulse
    this.bgGraphics = this.add.graphics();
    this.bgGraphics.setDepth(-100);

    // Base background
    this.bgGraphics.fillStyle(colors.background, 1);
    this.bgGraphics.fillRect(0, 0, width, height);

    // Ambient glow overlay (will pulse)
    this.glowOverlay = this.add.graphics();
    this.glowOverlay.setDepth(-99);
    this.glowOverlay.setAlpha(0);

    // Current hue for color cycling
    this.bgHue = 0;
    this.pulseIntensity = 0;
  }

  // Psychedelic effect handler methods
  handlePsychedelicLinesCleared(data) {
    if (data && data.lineCount) {
      this.pulseBackground(data.lineCount);
    }
  }

  handlePsychedelicScoreUpdated(data) {
    if (data && data.combo > 1) {
      this.pulseBackgroundCombo(data.combo);
    }
  }

  handlePsychedelicStreakUpdated(data) {
    if (data && data.isOnFire) {
      this.startFirePulse(data.fireLevel);
    } else {
      this.stopFirePulse();
    }
  }

  setupPsychedelicEffects() {
    // Pulse background on line clear
    this.gameEvents.on(EVENTS.LINES_CLEARED, this.boundHandleLinesCleared);

    // Intense pulse on combo
    this.gameEvents.on(EVENTS.SCORE_UPDATED, this.boundHandleScoreUpdated);

    // Continuous ambient pulse on streak
    this.gameEvents.on(EVENTS.STREAK_UPDATED, this.boundHandleStreakUpdated);
  }

  pulseBackground(lineCount) {
    // Color based on line count
    const pulseColors = [
      0x00ffff, // 1 line - cyan
      0x00ff80, // 2 lines - green
      0xffff00, // 3 lines - yellow
      0xff00ff  // 4+ lines - magenta
    ];
    const color = pulseColors[Math.min(lineCount - 1, pulseColors.length - 1)];

    // Draw pulse overlay (limited to grid area only)
    const gridSize = this.layout.gridSize;  // Adaptive grid size
    this.glowOverlay.clear();
    this.glowOverlay.fillStyle(color, 1);
    this.glowOverlay.fillRect(this.layout.gridOffsetX, this.layout.gridOffsetY, gridSize, gridSize);

    // Animate pulse
    this.glowOverlay.setAlpha(0.15 + lineCount * 0.05);
    this.tweens.add({
      targets: this.glowOverlay,
      alpha: 0,
      duration: 400 + lineCount * 100,
      ease: 'Power2'
    });
  }

  pulseBackgroundCombo(combo) {
    // Rainbow pulse for combos
    const comboColors = [0xffffff, 0xffff00, 0xff8800, 0xff00ff, 0x00ffff];
    const color = comboColors[Math.min(combo - 2, comboColors.length - 1)];

    // Limited to grid area only
    const gridSize = this.layout.gridSize;  // Adaptive grid size
    this.glowOverlay.clear();
    this.glowOverlay.fillStyle(color, 1);
    this.glowOverlay.fillRect(this.layout.gridOffsetX, this.layout.gridOffsetY, gridSize, gridSize);

    // Strong pulse
    this.glowOverlay.setAlpha(0.2 + combo * 0.05);
    this.tweens.add({
      targets: this.glowOverlay,
      alpha: 0,
      duration: 300,
      ease: 'Power2'
    });
  }

  startFirePulse(fireLevel) {
    if (this.firePulseTween) return;

    // Continuous subtle pulse while on fire
    const intensity = 0.03 + fireLevel * 0.02;
    const fireColors = [0xff4400, 0xff6600, 0xff8800, 0xffaa00];
    const color = fireColors[Math.min(fireLevel - 1, fireColors.length - 1)];

    // Limited to grid area only
    const gridSize = this.layout.gridSize;  // Adaptive grid size
    this.glowOverlay.clear();
    this.glowOverlay.fillStyle(color, 1);
    this.glowOverlay.fillRect(this.layout.gridOffsetX, this.layout.gridOffsetY, gridSize, gridSize);
    this.glowOverlay.setAlpha(0);

    this.firePulseTween = this.tweens.add({
      targets: this.glowOverlay,
      alpha: intensity,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  stopFirePulse() {
    if (this.firePulseTween) {
      this.firePulseTween.stop();
      this.firePulseTween = null;
      this.glowOverlay.setAlpha(0);
    }
  }

  // ===========================================
  // MUTE BUTTON
  // ===========================================

  createMuteButton() {
    const { width } = this.cameras.main;

    const x = width - 30;
    const y = 30;

    // Button background (SVG)
    this.muteBtn = this.add.image(x, y, 'btn_mute_normal');
    this.muteBtn.setDepth(100);

    // Sound icon (SVG)
    const iconKey = AudioManager.isMuted() ? 'icon_sound_off' : 'icon_sound_on';
    this.muteIcon = this.add.image(x, y, iconKey);
    this.muteIcon.setDepth(101);

    // Hit zone
    this.muteZone = this.add.zone(x, y, 40, 40);
    this.muteZone.setDepth(102);
    this.muteZone.setInteractive({ useHandCursor: true });

    this.muteZone.on('pointerdown', () => {
      AudioManager.toggle();
      this.updateMuteIcon();

      // Update music manager
      if (this.musicManager) {
        this.musicManager.setMuted(AudioManager.isMuted());
      }
    });

    this.muteZone.on('pointerover', () => {
      this.muteBtn.setTexture('btn_mute_hover');
    });

    this.muteZone.on('pointerout', () => {
      this.muteBtn.setTexture('btn_mute_normal');
    });
  }

  updateMuteIcon() {
    const iconKey = AudioManager.isMuted() ? 'icon_sound_off' : 'icon_sound_on';
    this.muteIcon.setTexture(iconKey);
  }

  update(time, delta) {
    // Game loop updates if needed
  }

  // Clean up when leaving scene
  shutdown() {
    // Unsubscribe from viewport resize
    this.game.events.off('viewport-resize', this.handleViewportResize, this);

    // Stop fire pulse
    this.stopFirePulse();

    // Remove psychedelic event listeners using bound references
    if (this.gameEvents) {
      if (this.boundHandleLinesCleared) {
        this.gameEvents.off(EVENTS.LINES_CLEARED, this.boundHandleLinesCleared);
        this.boundHandleLinesCleared = null;
      }
      if (this.boundHandleScoreUpdated) {
        this.gameEvents.off(EVENTS.SCORE_UPDATED, this.boundHandleScoreUpdated);
        this.boundHandleScoreUpdated = null;
      }
      if (this.boundHandleStreakUpdated) {
        this.gameEvents.off(EVENTS.STREAK_UPDATED, this.boundHandleStreakUpdated);
        this.boundHandleStreakUpdated = null;
      }
    }
    // Stop UI scene
    this.scene.stop('UIScene');

    // Destroy mute button
    if (this.muteZone) this.muteZone.destroy();
    if (this.muteBtn) this.muteBtn.destroy();
    if (this.muteIcon) this.muteIcon.destroy();

    // Destroy components
    if (this.gridView) this.gridView.destroy();
    if (this.inputManager) this.inputManager.destroy();
    if (this.effectsManager) this.effectsManager.destroy();
    if (this.soundManager) this.soundManager.destroy();
    if (this.musicManager) {
      this.musicManager.stopImmediate();
      this.musicManager.destroy();
      this.musicManager = null;
    }
    if (this.uiManager) this.uiManager.destroy();
    if (this.gameController) this.gameController.destroy();
  }
}
