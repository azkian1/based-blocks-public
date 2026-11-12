import Phaser from 'phaser';
import { CONFIG, getLayout } from '../config.js';
import { EVENTS } from '../events.js';
import { StyleManager } from '../styles/StyleManager.js';
import { NeonFrame } from '../presentation/components/NeonFrame.js';
import { Button } from '../presentation/components/Button.js';
import { Records } from '../data/LocalRecords.js';

// UIScene - UI overlay scene (runs in parallel with GameScene)
// Owner: Agent B (Presentation)
// DOPAMINIZED VERSION - Maximum juice!

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    // Get event emitter from GameScene
    this.gameEvents = data.gameEvents;

    // Score tracking for animations
    this.displayedScore = 0;
    this.targetScore = 0;
    this.scoreCountTween = null;

    // Milestone tracking
    this.lastMilestone = 0;
    // Milestones at every 10k (10k, 20k, 30k, ..., 100k)
    this.milestones = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];

    // Guard against duplicate game over displays
    this.isGameOverActive = false;

    // Create bound event handlers for proper cleanup
    this.boundHandleScoreUpdated = this.handleScoreUpdated.bind(this);
    this.boundHandleGameOver = this.handleGameOver.bind(this);
    this.boundHandleGameRestarted = this.handleGameRestarted.bind(this);
  }

  // Event handler methods
  handleScoreUpdated(data) {
    try {
      if (data) {
        this.updateScore(data);
      }
    } catch (error) {
      console.error('Error updating score UI:', error);
    }
  }

  handleGameOver(data) {
    try {
      if (data) {
        this.showGameOver(data);
      }
    } catch (error) {
      console.error('Error showing game over:', error);
    }
  }

  handleGameRestarted() {
    try {
      this.hideGameOver();
      this.resetUI();
    } catch (error) {
      console.error('Error resetting UI:', error);
    }
  }

  create() {
    const uiColors = StyleManager.getUIColors();

    // Get adaptive layout based on current canvas size
    const { width, height } = this.cameras.main;
    this.layout = getLayout(width, height);

    // Score display (centered, title style)
    this.scoreText = this.add.text(
      this.layout.centerX,
      this.layout.scoreY,
      '0',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        fontStyle: 'bold',
        color: uiColors.titleColor,
        resolution: 2
      }
    ).setOrigin(0.5, 0);

    // Combo indicator (hidden by default)
    this.comboText = this.add.text(this.layout.centerX, this.layout.scoreY + 35, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: uiColors.textWarning,
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5).setAlpha(0);

    // Praise text for combos (hidden by default)
    this.praiseText = this.add.text(this.layout.centerX, this.layout.centerY - 50, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      resolution: 2
    }).setOrigin(0.5).setAlpha(0);


    // Milestone celebration text
    this.milestoneText = this.add.text(this.layout.centerX, this.layout.centerY, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      resolution: 2
    }).setOrigin(0.5).setAlpha(0);

    // Setup event listeners
    this.setupEventListeners();

    // Game over container (hidden by default)
    this.createGameOverOverlay();
    this.createGameOverButtons();

    // Subscribe to viewport resize events
    this.game.events.on('viewport-resize', this.handleViewportResize, this);

    console.log('UIScene initialized (DOPAMINIZED)');
  }

  // ===========================================
  // VIEWPORT RESIZE HANDLING
  // ===========================================

  handleViewportResize({ width, height }) {
    // Recalculate layout
    this.layout = getLayout(width, height);

    // Update UI elements positions
    this.updateUIPositions();

    // Update game over overlay positions (if visible)
    this.updateGameOverPositions();

    console.log('[UIScene] Viewport resized:', width, 'x', height);
  }

  updateUIPositions() {
    // Score text
    if (this.scoreText) {
      this.scoreText.setPosition(this.layout.centerX, this.layout.scoreY);
    }

    // Combo text
    if (this.comboText) {
      this.comboText.setPosition(this.layout.centerX, this.layout.scoreY + 35);
    }

    // Praise text
    if (this.praiseText) {
      this.praiseText.setPosition(this.layout.centerX, this.layout.centerY - 50);
    }

    // Milestone text
    if (this.milestoneText) {
      this.milestoneText.setPosition(this.layout.centerX, this.layout.centerY);
    }
  }

  updateGameOverPositions() {
    const { width, height } = this.cameras.main;
    const centerX = this.layout.centerX;
    const centerY = this.layout.centerY;

    // Background
    if (this.gameOverBg) {
      this.gameOverBg.setPosition(centerX, centerY);
      this.gameOverBg.setSize(width, height);
    }

    // Frame
    if (this.gameOverFrame) {
      this.gameOverFrame.setPosition(centerX, centerY);
    }

    // Container (text elements)
    if (this.gameOverContainer) {
      this.gameOverContainer.setPosition(centerX, centerY);
    }

    // Buttons
    if (this.restartButton) {
      this.restartButton.setPosition(centerX, centerY + 38);
    }
    if (this.menuButton) {
      this.menuButton.setPosition(centerX, centerY + 90);
    }
  }

  setupEventListeners() {
    if (!this.gameEvents) return;

    // Listen for score updates
    this.gameEvents.on(EVENTS.SCORE_UPDATED, this.boundHandleScoreUpdated);

    // Listen for game over
    this.gameEvents.on(EVENTS.GAME_OVER, this.boundHandleGameOver);

    // Listen for game restart
    this.gameEvents.on(EVENTS.GAME_RESTARTED, this.boundHandleGameRestarted);
  }

  // ===========================================
  // SCORE ANIMATION (Count-up with bounce)
  // ===========================================

  updateScore(data) {
    const { score, combo, delta } = data;

    // Animate score count-up
    this.animateScoreCountUp(score);

    // Show combo indicator
    if (combo > 1) {
      this.showCombo(combo);
    }

    // Animate score delta
    if (delta > 0) {
      this.showScoreDelta(delta);
    }

    // Check for milestones
    this.checkMilestones(score);
  }

  animateScoreCountUp(targetScore) {
    // Stop existing count animation
    if (this.scoreCountTween) {
      this.scoreCountTween.stop();
    }

    const startScore = this.displayedScore;
    this.targetScore = targetScore;

    // Animate the score counting up
    this.scoreCountTween = this.tweens.addCounter({
      from: startScore,
      to: targetScore,
      duration: 300,
      ease: 'Power2',
      onUpdate: (tween) => {
        this.displayedScore = Math.floor(tween.getValue());
        this.scoreText.setText(`${this.displayedScore}`);
      },
      onComplete: () => {
        this.displayedScore = targetScore;
        this.scoreText.setText(`${targetScore}`);
      }
    });

    // Bounce effect on score text
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  // ===========================================
  // COMBO VISUALIZATION
  // ===========================================

  showCombo(combo) {
    const uiColors = StyleManager.getUIColors();

    // Combo counter with escalating text
    this.comboText.setText(`x${combo}`);
    this.comboText.setAlpha(1);

    // Color escalation
    const comboColors = ['#ffffff', '#ffff00', '#ff8800', '#ff0088', '#ff00ff'];
    const colorIndex = Math.min(combo - 2, comboColors.length - 1);
    this.comboText.setColor(comboColors[colorIndex]);

    // Bounce animation
    this.comboText.setScale(0.5);
    this.tweens.add({
      targets: this.comboText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.comboText,
          scaleX: 1,
          scaleY: 1,
          duration: 100
        });
      }
    });

    // Fade out combo text
    this.tweens.add({
      targets: this.comboText,
      alpha: 0,
      duration: 800,
      delay: 600
    });

    // Show praise text for high combos
    this.showPraise(combo);
  }

  showPraise(combo) {
    const praises = {
      2: 'NICE!',
      3: 'GREAT!',
      4: 'AMAZING!',
      5: 'INCREDIBLE!',
      6: 'UNBELIEVABLE!',
      7: 'GODLIKE!'
    };

    const praise = praises[Math.min(combo, 7)];
    if (!praise) return;

    // Color gradient based on combo
    const praiseColors = ['#00ff80', '#ffff00', '#ff8800', '#ff0088', '#ff00ff', '#00ffff'];
    const colorIndex = Math.min(combo - 2, praiseColors.length - 1);

    this.praiseText.setText(praise);
    this.praiseText.setColor(praiseColors[colorIndex]);
    this.praiseText.setAlpha(1);
    this.praiseText.setScale(0.3);
    this.praiseText.setY(this.layout.centerY - 50);

    // Epic entrance
    this.tweens.add({
      targets: this.praiseText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.praiseText,
          scaleX: 1,
          scaleY: 1,
          y: this.praiseText.y - 30,
          alpha: 0,
          duration: 600,
          delay: 200,
          ease: 'Power2'
        });
      }
    });
  }

  // ===========================================
  // SCORE DELTA POPUPS
  // ===========================================

  showScoreDelta(delta) {
    const uiColors = StyleManager.getUIColors();

    // Multiple deltas that spread out
    const deltaCount = Math.min(Math.ceil(delta / 100), 4);
    const baseX = this.layout.centerX;
    const baseY = this.layout.scoreY + 35;

    for (let i = 0; i < deltaCount; i++) {
      const offsetX = (i - (deltaCount - 1) / 2) * 30;
      const displayDelta = i === deltaCount - 1 ? delta : Math.floor(delta / deltaCount);

      this.time.delayedCall(i * 50, () => {
        const deltaText = this.add.text(
          baseX + offsetX,
          baseY,
          `+${displayDelta}`,
          {
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            color: uiColors.textSuccess,
            fontStyle: 'bold'
          }
        ).setOrigin(0.5, 0);

        // Random direction for spread effect
        const angle = (Math.random() - 0.5) * 0.8;
        const distance = 40 + Math.random() * 20;

        // Animate and destroy
        this.tweens.add({
          targets: deltaText,
          x: deltaText.x + Math.sin(angle) * distance,
          y: deltaText.y - distance,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 800,
          ease: 'Power2',
          onComplete: () => deltaText.destroy()
        });
      });
    }
  }

  // ===========================================
  // MILESTONES
  // ===========================================

  checkMilestones(score) {
    for (const milestone of this.milestones) {
      if (score >= milestone && this.lastMilestone < milestone) {
        this.lastMilestone = milestone;
        this.showMilestone(milestone);

        // Emit milestone event for effects
        this.gameEvents.emit(EVENTS.MILESTONE_REACHED, { milestone, score });
        break;
      }
    }
  }

  showMilestone(milestone) {
    const formattedMilestone = milestone >= 1000 ? `${milestone / 1000}K` : milestone;

    this.milestoneText.setText(`${formattedMilestone}!`);
    this.milestoneText.setAlpha(1);
    this.milestoneText.setScale(0.3);
    this.milestoneText.setY(this.layout.centerY);

    // Epic entrance animation
    this.tweens.add({
      targets: this.milestoneText,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.milestoneText,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          onComplete: () => {
            this.tweens.add({
              targets: this.milestoneText,
              y: this.milestoneText.y - 50,
              alpha: 0,
              duration: 800,
              delay: 500,
              ease: 'Power2'
            });
          }
        });
      }
    });
  }

  // ===========================================
  // GAME OVER
  // ===========================================

  createGameOverOverlay() {
    const uiColors = StyleManager.getUIColors();
    const colors = StyleManager.getColors();
    const { width, height } = this.cameras.main;
    const centerX = this.layout.centerX;
    const centerY = this.layout.centerY;

    // Modal dimensions - always 2 buttons now
    const modalWidth = 210;
    const modalHeight = 240;

    // Semi-transparent background (darkens the game)
    this.gameOverBg = this.add.rectangle(
      centerX,
      centerY,
      width,
      height,
      0x000000,
      0.85
    ).setVisible(false).setInteractive(); // Block clicks through

    // Neon frame for modal
    this.gameOverFrame = new NeonFrame(this, centerX, centerY, modalWidth, modalHeight, {
      filled: true,
      backgroundColor: colors.gridBackground,
      backgroundAlpha: 0.95,
      cornerRadius: 10
    });
    this.gameOverFrame.setVisible(false);

    // Container for text elements (positioned at center)
    this.gameOverContainer = this.add.container(centerX, centerY);
    this.gameOverContainer.setVisible(false);

    // Game over title
    this.gameOverTitle = this.add.text(0, -82, 'GAME OVER', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: uiColors.titleColor,
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);
    this.gameOverContainer.add(this.gameOverTitle);

    // Final score label
    this.finalScoreLabel = this.add.text(0, -38, 'SCORE', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: uiColors.textSecondary,
      resolution: 2
    }).setOrigin(0.5);
    this.gameOverContainer.add(this.finalScoreLabel);

    // Final score value
    this.finalScoreText = this.add.text(0, -12, '0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: uiColors.textPrimary,
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5);
    this.gameOverContainer.add(this.finalScoreText);

    // New best indicator
    this.newBestText = this.add.text(0, 18, 'NEW BEST!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: uiColors.textWarning,
      fontStyle: 'bold',
      resolution: 2
    }).setOrigin(0.5).setVisible(false);
    this.gameOverContainer.add(this.newBestText);

    // Buttons will be created separately (they need absolute positioning for hitZone)
    this.gameOverButtons = [];
  }

  createGameOverButtons() {
    const centerX = this.layout.centerX;
    const centerY = this.layout.centerY;

    // Play Again button
    this.restartButton = new Button(this, centerX, centerY + 38, 'PLAY AGAIN', () => {
      if (this.gameEvents) {
        this.gameEvents.emit(EVENTS.RESTART_REQUESTED);
      }
    }, {
      width: 150,
      height: 38,
      fontSize: '18px'
    });
    this.restartButton.setVisible(false);
    if (this.restartButton.hitZone) {
      this.restartButton.hitZone.disableInteractive();
    }
    this.gameOverButtons.push(this.restartButton);

    // Menu button
    this.menuButton = new Button(this, centerX, centerY + 90, 'MENU', () => {
      this.goToMenu();
    }, {
      width: 150,
      height: 34,
      fontSize: '15px'
    });
    this.menuButton.setVisible(false);
    if (this.menuButton.hitZone) {
      this.menuButton.hitZone.disableInteractive();
    }
    this.gameOverButtons.push(this.menuButton);
  }

  goToMenu() {
    // Fade out and go to menu
    this.cameras.main.fadeOut(CONFIG.ANIMATION.FADE_DURATION, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Stop GameScene and go to MenuScene
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('MenuScene');
    });
  }

  showGameOver(data) {
    if (this.isGameOverActive) return;
    this.isGameOverActive = true;
    this.gameOverData = data;
    Records.recordGame(data.finalScore, data.totalLinesCleared || 0);
    this.showStandardGameOver(data);
  }

  showStandardGameOver(data) {
    const { finalScore } = data;
    const uiColors = StyleManager.getUIColors();
    const centerX = this.layout.centerX;
    const centerY = this.layout.centerY;

    // Update score display
    this.finalScoreText.setText(`${finalScore}`);

    // The result and new-best indicator are stored and displayed locally.
    this.finalScoreLabel.setText('SCORE');
    this.finalScoreLabel.setColor(uiColors.textSecondary);
    this.finalScoreLabel.setFontSize('12px');

    this.newBestText.setVisible(Boolean(data.isNewBest));

    // Position buttons (always 2 buttons: PLAY AGAIN, MENU)
    this.restartButton.setPosition(centerX, centerY + 38);
    this.menuButton.setPosition(centerX, centerY + 90);

    // Show background
    this.gameOverBg.setVisible(true);
    this.gameOverBg.setAlpha(0);

    // Show frame
    this.gameOverFrame.setVisible(true);
    this.gameOverFrame.setScale(0.8);
    this.gameOverFrame.setAlpha(0);

    // Show container (text elements)
    this.gameOverContainer.setVisible(true);
    this.gameOverContainer.setScale(0.8);
    this.gameOverContainer.setAlpha(0);

    // Show buttons and enable their hitZones
    this.restartButton.setVisible(true);
    this.restartButton.setScale(0.8);
    this.restartButton.setAlpha(0);
    if (this.restartButton.hitZone) {
      this.restartButton.hitZone.setInteractive({ useHandCursor: true });
    }

    this.menuButton.setVisible(true);
    this.menuButton.setScale(0.8);
    this.menuButton.setAlpha(0);
    if (this.menuButton.hitZone) {
      this.menuButton.hitZone.setInteractive({ useHandCursor: true });
    }

    // Animate background fade in
    this.tweens.add({
      targets: this.gameOverBg,
      alpha: 0.85,
      duration: 300,
      ease: 'Power2'
    });

    // Animate frame entrance
    this.tweens.add({
      targets: this.gameOverFrame,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      delay: 100
    });

    // Animate container (text) entrance
    this.tweens.add({
      targets: this.gameOverContainer,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      delay: 100
    });

    // Animate buttons
    this.tweens.add({
      targets: [this.restartButton, this.menuButton],
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut',
      delay: 200
    });
  }

  hideGameOver() {
    this.isGameOverActive = false;


    // Hide background
    this.gameOverBg.setVisible(false);

    // Hide frame
    this.gameOverFrame.setVisible(false);

    // Hide container
    this.gameOverContainer.setVisible(false);
    this.newBestText.setVisible(false);

    // Hide buttons and disable their hitZones
    this.gameOverButtons.forEach(btn => {
      btn.setVisible(false);
      if (btn.hitZone) {
        btn.hitZone.disableInteractive();
      }
    });

    // Stop any running tweens
    this.tweens.killTweensOf(this.newBestText);

    // Reset label alpha
    this.finalScoreLabel.setAlpha(1);
  }

  resetUI() {
    this.scoreText.setText('0');
    this.comboText.setAlpha(0);
    this.praiseText.setAlpha(0);
    this.milestoneText.setAlpha(0);

    this.displayedScore = 0;
    this.targetScore = 0;
    this.lastMilestone = 0;
  }

  // Clean up event listeners when scene shuts down
  shutdown() {
    // Unsubscribe from viewport resize
    this.game.events.off('viewport-resize', this.handleViewportResize, this);

    // Unsubscribe from game events using bound references
    if (this.gameEvents) {
      if (this.boundHandleScoreUpdated) {
        this.gameEvents.off(EVENTS.SCORE_UPDATED, this.boundHandleScoreUpdated);
        this.boundHandleScoreUpdated = null;
      }
      if (this.boundHandleGameOver) {
        this.gameEvents.off(EVENTS.GAME_OVER, this.boundHandleGameOver);
        this.boundHandleGameOver = null;
      }
      if (this.boundHandleGameRestarted) {
        this.gameEvents.off(EVENTS.GAME_RESTARTED, this.boundHandleGameRestarted);
        this.boundHandleGameRestarted = null;
      }
    }


    // Destroy game over buttons (Button components)
    if (this.gameOverButtons) {
      this.gameOverButtons.forEach(btn => {
        if (btn && btn.destroy) {
          btn.destroy();
        }
      });
      this.gameOverButtons = [];
    }

    // Destroy game over frame
    if (this.gameOverFrame) {
      this.gameOverFrame.destroy();
      this.gameOverFrame = null;
    }

    // Stop tweens
    if (this.scoreCountTween) {
      this.scoreCountTween.stop();
    }

    // Kill all active tweens
    this.tweens.killAll();
  }
}
