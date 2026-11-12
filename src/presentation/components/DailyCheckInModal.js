// DailyCheckInModal - Daily check-in popup with streak display
import { CONFIG } from '../../config.js';
import { StyleManager } from '../../styles/StyleManager.js';
import { NeonFrame } from './NeonFrame.js';
import { Button } from './Button.js';
import { StreakManager } from '../../data/StreakManager.js';

export class DailyCheckInModal {
  constructor(scene, currentStreak, onClaim, onClose) {
    this.scene = scene;
    this.currentStreak = currentStreak;
    this.onClaim = onClaim;
    this.onClose = onClose;
    this.isVisible = false;

    this.create();
  }

  create() {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const colors = StyleManager.getColors();
    const uiColors = StyleManager.getUIColors();

    // Modal dimensions
    const modalWidth = 220;
    const modalHeight = 180;

    // Dark overlay background
    this.overlay = this.scene.add.rectangle(
      centerX,
      centerY,
      width,
      height,
      0x000000,
      0.85
    );
    this.overlay.setInteractive(); // Block clicks through
    this.overlay.on('pointerdown', () => {
      this.hide();
      if (this.onClose) this.onClose();
    });

    // Neon frame for modal
    this.frame = new NeonFrame(this.scene, centerX, centerY, modalWidth, modalHeight, {
      filled: true,
      backgroundColor: colors.gridBackground,
      backgroundAlpha: 0.95,
      cornerRadius: 10
    });

    // Container for content
    this.container = this.scene.add.container(centerX, centerY);

    // Title "DAILY CHECK-IN"
    this.title = this.scene.add.text(0, -75, 'DAILY CHECK-IN', {
      fontSize: '16px',
      fontFamily: CONFIG.FONTS.primary,
      color: uiColors.textSecondary,
      resolution: 2
    });
    this.title.setOrigin(0.5);
    this.container.add(this.title);

    // Next streak value (what they'll get after claim)
    const nextStreak = this.currentStreak + 1;

    // Streak number (large, with glow)
    this.streakText = this.scene.add.text(0, -20, `${nextStreak}`, {
      fontSize: '48px',
      fontFamily: CONFIG.FONTS.primary,
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: uiColors.titleColor,
      strokeThickness: 2,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: uiColors.titleColor,
        blur: 15,
        fill: true
      },
      resolution: 2
    });
    this.streakText.setOrigin(0.5);
    this.container.add(this.streakText);

    // STREAK button
    this.claimButton = new Button(this.scene, centerX, centerY + 45, 'STREAK', () => {
      this.onClaimClick();
    }, {
      width: 160,
      height: 44,
      fontSize: '18px'
    });

    // Hide all initially
    this.setVisible(false);
  }

  show() {
    if (this.isVisible) return;
    this.isVisible = true;

    this.setVisible(true);

    // Animate entrance
    this.overlay.setAlpha(0);
    this.frame.setScale(0.8);
    this.frame.setAlpha(0);
    this.container.setScale(0.8);
    this.container.setAlpha(0);
    this.claimButton.setScale(0.8);
    this.claimButton.setAlpha(0);

    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0.85,
      duration: 200
    });

    this.scene.tweens.add({
      targets: [this.frame, this.container],
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      delay: 100
    });

    this.scene.tweens.add({
      targets: this.claimButton,
      scale: 1,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      delay: 150
    });

    // Pulsing glow animation for streak text
    this.streakTween = this.scene.tweens.add({
      targets: this.streakText,
      'shadow.blur': { from: 15, to: 25 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Enable button
    if (this.claimButton.hitZone) {
      this.claimButton.hitZone.setInteractive({ useHandCursor: true });
    }
  }

  hide() {
    if (!this.isVisible) return;
    this.isVisible = false;

    // Stop animations
    if (this.streakTween) {
      this.streakTween.stop();
      this.streakTween = null;
    }

    // Disable button
    if (this.claimButton.hitZone) {
      this.claimButton.hitZone.disableInteractive();
    }

    // Animate out
    this.scene.tweens.add({
      targets: [this.overlay, this.frame, this.container, this.claimButton],
      alpha: 0,
      scale: 0.9,
      duration: 200,
      onComplete: () => {
        this.setVisible(false);
      }
    });
  }

  async onClaimClick() {
    // Disable button during claim
    if (this.claimButton.hitZone) {
      this.claimButton.hitZone.disableInteractive();
    }

    // Update button text to show loading
    this.claimButton.setText('...');

    try {
      // Save the daily check-in on this device
      const newStreak = await StreakManager.claim();

      // Update button text
      this.claimButton.setText('CLAIMED!');

      // Success animation on streak text
      this.scene.tweens.add({
        targets: this.streakText,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut'
      });

      // Delay then close and callback
      this.scene.time.delayedCall(600, () => {
        this.hide();
        if (this.onClaim) {
          this.onClaim(newStreak);
        }
      });
    } catch (error) {
      console.error('Streak claim failed:', error);
      // Show error state - user can retry by reopening modal
      this.claimButton.setText('RETRY');
      // Re-enable button for retry
      if (this.claimButton.hitZone) {
        this.claimButton.hitZone.setInteractive({ useHandCursor: true });
      }
    }
  }

  setVisible(visible) {
    this.overlay.setVisible(visible);
    this.frame.setVisible(visible);
    this.container.setVisible(visible);
    this.claimButton.setVisible(visible);
  }

  destroy() {
    if (this.streakTween) {
      this.streakTween.stop();
      this.streakTween = null;
    }
    if (this.overlay) this.overlay.destroy();
    if (this.frame) this.frame.destroy();
    if (this.container) this.container.destroy();
    if (this.claimButton) this.claimButton.destroy();
  }
}
