import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { EVENTS } from '../events.js';
import { StyleManager } from '../styles/StyleManager.js';

// EffectsManager - Handles visual effects and animations
// Owner: Agent B (Presentation)
//
// DOPAMINIZED VERSION - Maximum juice!

export class EffectsManager {
  constructor(scene, gridView, eventEmitter) {
    this.scene = scene;
    this.gridView = gridView;
    this.events = eventEmitter;

    // Particle pool for performance (mobile optimization)
    this.particlePool = [];
    this.maxParticles = CONFIG.EFFECTS?.MAX_PARTICLES || 50;
    this.activeParticles = 0;

    // Streak/Fire Mode state
    this.streak = 0;
    this.isOnFire = false;

    // Track destruction state
    this.destroyed = false;

    // Create bound event handlers for proper cleanup
    this.boundHandleLinesCleared = this.handleLinesCleared.bind(this);
    this.boundHandleScoreUpdated = this.handleScoreUpdated.bind(this);
    this.boundHandleShapePlaced = this.handleShapePlaced.bind(this);
    this.boundHandleMilestoneReached = this.handleMilestoneReached.bind(this);
    this.boundHandleBoardCleared = this.handleBoardCleared.bind(this);
    this.boundHandlePaletteChanged = this.handlePaletteChanged.bind(this);

    this.setupEventListeners();
  }

  // ===========================================
  // PARTICLE POOLING SYSTEM
  // ===========================================

  // Get a particle from pool or create new one
  getParticle() {
    if (this.particlePool.length > 0) {
      const particle = this.particlePool.pop();
      particle.setVisible(true);
      particle.setAlpha(1);
      particle.setScale(1);
      particle.setPosition(0, 0);
      particle.setRotation(0);
      return particle;
    }
    return this.scene.add.graphics();
  }

  // Return particle to pool for reuse
  releaseParticle(particle) {
    if (!particle || this.destroyed) return;

    // Kill any tweens on this particle (guard for null scene)
    if (this.scene) {
      this.scene.tweens.killTweensOf(particle);
    }

    // Clear graphics and hide
    particle.clear();
    particle.setVisible(false);

    // Add back to pool if under limit
    if (this.particlePool.length < this.maxParticles) {
      this.particlePool.push(particle);
    } else {
      // Pool is full, destroy the particle
      particle.destroy();
    }

    this.activeParticles--;
  }

  // Event handler methods
  handleLinesCleared(data) {
    if (this.destroyed) return;
    try {
      if (data && Array.isArray(data.cells)) {
        this.playLineClearEffect(data.cells, data.lineCount || 0);
      }
    } catch (error) {
      console.error('Error playing line clear effect:', error);
    }
  }

  handleScoreUpdated(data) {
    if (this.destroyed) return;
    try {
      if (data && data.combo > 1) {
        this.playComboEffect(data.combo);
      }
    } catch (error) {
      console.error('Error playing combo effect:', error);
    }
  }

  handleShapePlaced() {
    if (this.destroyed) return;
    try {
      this.incrementStreak();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }

  handleMilestoneReached(data) {
    if (this.destroyed) return;
    try {
      if (data && data.milestone) {
        this.playMilestoneEffect(data.milestone);
      }
    } catch (error) {
      console.error('Error playing milestone effect:', error);
    }
  }

  handleBoardCleared() {
    if (this.destroyed) return;
    try {
      this.playBoardClearedEffect();
    } catch (error) {
      console.error('Error playing board cleared effect:', error);
    }
  }

  handlePaletteChanged(data) {
    if (this.destroyed) return;
    try {
      if (data && data.colors) {
        this.playPaletteChangeEffect(data.colors);
      }
    } catch (error) {
      console.error('Error playing palette change effect:', error);
    }
  }

  setupEventListeners() {
    // Listen for lines cleared
    this.events.on(EVENTS.LINES_CLEARED, this.boundHandleLinesCleared);

    // Listen for score updates to show combo effects
    this.events.on(EVENTS.SCORE_UPDATED, this.boundHandleScoreUpdated);

    // Listen for shape placed to update streak
    this.events.on(EVENTS.SHAPE_PLACED, this.boundHandleShapePlaced);

    // Listen for milestone celebrations
    this.events.on(EVENTS.MILESTONE_REACHED, this.boundHandleMilestoneReached);

    // Listen for board cleared (palette change trigger)
    this.events.on(EVENTS.BOARD_CLEARED, this.boundHandleBoardCleared);

    // Listen for palette change (visual transition)
    this.events.on(EVENTS.PALETTE_CHANGED, this.boundHandlePaletteChanged);
  }

  // ===========================================
  // LINE CLEAR EFFECTS - THE MAIN SHOW
  // ===========================================

  playLineClearEffect(cells, lineCount) {
    const blockColors = StyleManager.getBlockColors();

    // Group cells by their color for coordinated effects
    const cellsByColor = new Map();
    cells.forEach(cell => {
      const colorId = cell.colorId || 1;
      if (!cellsByColor.has(colorId)) {
        cellsByColor.set(colorId, []);
      }
      cellsByColor.get(colorId).push(cell);
    });

    // Calculate center of cleared area for directional effects
    let centerX = 0, centerY = 0;
    cells.forEach(({ x, y }) => {
      const pixel = this.gridView.gridToPixel(x, y);
      centerX += this.gridView.x + pixel.x;
      centerY += this.gridView.y + pixel.y;
    });
    centerX /= cells.length;
    centerY /= cells.length;

    // Sequential wave effect with colored particles
    cells.forEach(({ x, y, colorId }, index) => {
      const pixel = this.gridView.gridToPixel(x, y);
      const worldX = this.gridView.x + pixel.x;
      const worldY = this.gridView.y + pixel.y;
      const color = blockColors[(colorId || 1) - 1] || blockColors[0];

      // Staggered delay for wave effect (30ms between cells)
      const delay = index * 30;

      this.scene.time.delayedCall(delay, () => {
        if (this.destroyed || !this.scene) return;
        // 1. Glow flash at cell position
        this.createGlowFlash(worldX, worldY, color.fill);

        // 2. Colored particle burst
        this.createColoredBurst(worldX, worldY, color.fill, centerX, centerY);

        // 3. Expanding ring in block color
        this.createExpandingRing(worldX, worldY, color.fill);
      });
    });

    // Screen effects based on line count
    this.playScreenEffects(lineCount);

    // Fire mode intensifies everything
    if (this.isOnFire) {
      this.playFireModeBonus(cells.length);
    }
  }

  createGlowFlash(x, y, color) {
    const glow = this.getParticle();
    const size = CONFIG.CELL_SIZE;

    // Bright center
    glow.fillStyle(color, 0.8);
    glow.fillCircle(0, 0, size * 0.6);

    // Outer glow
    glow.fillStyle(color, 0.3);
    glow.fillCircle(0, 0, size);

    glow.setPosition(x, y);
    glow.setScale(0.5);

    this.activeParticles++;

    this.scene.tweens.add({
      targets: glow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => this.releaseParticle(glow)
    });
  }

  createColoredBurst(x, y, color, centerX, centerY) {
    // Calculate direction away from center
    const dx = x - centerX;
    const dy = y - centerY;
    const baseAngle = Math.atan2(dy, dx);

    // More particles when on fire
    const particleCount = this.isOnFire ? 10 : 8;
    const spreadAngle = Math.PI * 0.8; // Particles spread in a cone away from center

    for (let i = 0; i < particleCount; i++) {
      if (this.activeParticles >= this.maxParticles) break;

      const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
      const speed = 40 + Math.random() * 30;
      const size = 3 + Math.random() * 3;

      const particle = this.getParticle();
      particle.fillStyle(color, 1);
      particle.fillRoundedRect(-size/2, -size/2, size, size, 1);
      particle.setPosition(x, y);

      this.activeParticles++;

      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed;

      // Main movement
      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        duration: 350 + Math.random() * 150,
        ease: 'Power2'
      });

      // Fade and scale
      this.scene.tweens.add({
        targets: particle,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 400 + Math.random() * 100,
        ease: 'Power1',
        onComplete: () => this.releaseParticle(particle)
      });

      // Trail effect - spawn smaller particles behind
      if (i % 2 === 0) {
        this.createTrail(x, y, targetX, targetY, color);
      }
    }
  }

  createTrail(startX, startY, endX, endY, color) {
    const trailCount = 3;
    for (let i = 0; i < trailCount; i++) {
      if (this.activeParticles >= this.maxParticles) break;

      const t = (i + 1) / (trailCount + 1);
      const trailX = startX + (endX - startX) * t * 0.5;
      const trailY = startY + (endY - startY) * t * 0.5;

      this.scene.time.delayedCall(i * 30, () => {
        if (this.destroyed || !this.scene) return;
        const trail = this.getParticle();
        trail.fillStyle(color, 0.6);
        trail.fillCircle(0, 0, 2);
        trail.setPosition(trailX, trailY);

        this.activeParticles++;

        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: 0,
          scaleY: 0,
          duration: 200,
          onComplete: () => this.releaseParticle(trail)
        });
      });
    }
  }

  createExpandingRing(x, y, color) {
    const ring = this.getParticle();
    ring.lineStyle(3, color, 1);
    ring.strokeCircle(0, 0, 8);
    ring.setPosition(x, y);

    this.activeParticles++;

    this.scene.tweens.add({
      targets: ring,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => this.releaseParticle(ring)
    });
  }

  playScreenEffects(lineCount) {
    const cam = this.scene.cameras.main;

    // Screen shake - intensity increases with lines
    if (lineCount >= 1) {
      const intensity = Math.min(0.003 + lineCount * 0.003, 0.015);
      cam.shake(150 + lineCount * 50, intensity);
    }

    // Flash for multi-line clears
    if (lineCount >= 2) {
      const flashColors = [
        { r: 255, g: 255, b: 255 }, // 2 lines - white
        { r: 255, g: 255, b: 0 },   // 3 lines - yellow
        { r: 255, g: 100, b: 255 }  // 4+ lines - pink
      ];
      const colorIndex = Math.min(lineCount - 2, flashColors.length - 1);
      const c = flashColors[colorIndex];
      cam.flash(150, c.r, c.g, c.b, false);
    }

    // Zoom punch for big clears
    if (lineCount >= 3) {
      cam.zoomTo(1.03, 80, 'Power2', false, (cam, progress) => {
        if (progress === 1) {
          cam.zoomTo(1, 150, 'Bounce.easeOut');
        }
      });
    }
  }

  // ===========================================
  // FIRE MODE / STREAK SYSTEM
  // ===========================================

  incrementStreak() {
    this.streak++;

    // Fire mode thresholds: 3, 5, 7, 10+
    const wasOnFire = this.isOnFire;
    this.isOnFire = this.streak >= 3;

    if (this.isOnFire && !wasOnFire) {
      this.activateFireMode();
    }

    // Emit streak event for UI
    this.events.emit(EVENTS.STREAK_UPDATED, {
      streak: this.streak,
      isOnFire: this.isOnFire,
      fireLevel: this.getFireLevel()
    });
  }

  resetStreak() {
    if (this.streak > 0) {
      this.streak = 0;
      this.isOnFire = false;
      this.events.emit(EVENTS.STREAK_UPDATED, {
        streak: 0,
        isOnFire: false,
        fireLevel: 0
      });
    }
  }

  getFireLevel() {
    if (this.streak >= 10) return 4; // LEGENDARY
    if (this.streak >= 7) return 3;  // ON FIRE
    if (this.streak >= 5) return 2;  // HOT
    if (this.streak >= 3) return 1;  // WARMING UP
    return 0;
  }

  activateFireMode() {
    // Screen pulse
    const cam = this.scene.cameras.main;
    cam.flash(200, 255, 100, 0, false);

    // Brief zoom
    cam.zoomTo(1.02, 100, 'Power2', false, (cam, progress) => {
      if (progress === 1) cam.zoomTo(1, 200);
    });
  }

  playFireModeBonus(cellCount) {
    // Extra particles burst from edges
    const fireLevel = this.getFireLevel();
    const extraBursts = fireLevel * 2;
    const { width, height } = this.scene.cameras.main;

    for (let i = 0; i < extraBursts; i++) {
      if (this.activeParticles >= this.maxParticles) break;

      const x = Math.random() * width;
      const y = Math.random() < 0.5 ? 0 : height;

      this.scene.time.delayedCall(i * 50, () => {
        if (this.destroyed || !this.scene) return;
        this.createFireParticle(x, y);
      });
    }
  }

  createFireParticle(x, y) {
    if (this.destroyed || this.activeParticles >= this.maxParticles) return;

    const colors = [0xff4400, 0xff8800, 0xffcc00];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const { height } = this.scene.cameras.main;

    const particle = this.getParticle();
    particle.fillStyle(color, 0.8);
    particle.fillCircle(0, 0, 4 + Math.random() * 4);
    particle.setPosition(x, y);

    this.activeParticles++;

    const targetY = y === 0 ? height * 0.4 : height * 0.6;

    this.scene.tweens.add({
      targets: particle,
      y: targetY,
      x: x + (Math.random() - 0.5) * 100,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      duration: 600 + Math.random() * 400,
      ease: 'Power1',
      onComplete: () => this.releaseParticle(particle)
    });
  }

  // ===========================================
  // COMBO EFFECTS
  // ===========================================

  playComboEffect(combo) {
    const cam = this.scene.cameras.main;

    // Intensifying zoom pulse
    const zoomAmount = 1 + 0.01 * Math.min(combo, 5);
    cam.zoomTo(zoomAmount, 80, 'Power2', false, (cam, progress) => {
      if (progress === 1) {
        cam.zoomTo(1, 120, 'Bounce.easeOut');
      }
    });

    // Color flash based on combo level
    const comboColors = [
      { r: 255, g: 255, b: 255 }, // x2 - white
      { r: 255, g: 255, b: 0 },   // x3 - yellow
      { r: 255, g: 136, b: 0 },   // x4 - orange
      { r: 255, g: 0, b: 136 },   // x5+ - pink
    ];
    const colorIndex = Math.min(combo - 2, comboColors.length - 1);
    const c = comboColors[colorIndex];

    cam.flash(120, c.r, c.g, c.b, false);

    // Screen shake for high combos
    if (combo >= 3) {
      cam.shake(100, 0.003 * combo);
    }

    // Spawn celebration particles at screen center
    this.spawnCelebrationParticles(combo);
  }

  spawnCelebrationParticles(combo) {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 3;
    const particleCount = Math.min(combo * 3, 15);

    const colors = [0xff0040, 0xff8000, 0xffff00, 0x00ff80, 0x00ffff, 0x8000ff];

    for (let i = 0; i < particleCount; i++) {
      if (this.activeParticles >= this.maxParticles) break;

      this.scene.time.delayedCall(i * 20, () => {
        if (this.destroyed || !this.scene || this.activeParticles >= this.maxParticles) return;

        const angle = (i / particleCount) * Math.PI * 2;
        const color = colors[i % colors.length];
        const distance = 50 + Math.random() * 50;

        const particle = this.getParticle();
        particle.fillStyle(color, 1);
        particle.fillCircle(0, 0, 3 + Math.random() * 3);
        particle.setPosition(centerX, centerY);

        this.activeParticles++;

        this.scene.tweens.add({
          targets: particle,
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => this.releaseParticle(particle)
        });
      });
    }
  }

  // ===========================================
  // MILESTONE CELEBRATIONS
  // ===========================================

  playMilestoneEffect(milestone) {
    // milestone: 1000, 5000, 10000
    const intensity = milestone >= 10000 ? 3 : milestone >= 5000 ? 2 : 1;

    // Confetti burst
    this.spawnConfetti(intensity * 15);

    // Screen effects
    const cam = this.scene.cameras.main;
    cam.flash(300, 255, 255, 255, false);
    cam.shake(200, 0.008 * intensity);

    // Big zoom
    cam.zoomTo(1.05, 150, 'Power2', false, (cam, progress) => {
      if (progress === 1) cam.zoomTo(1, 300, 'Bounce.easeOut');
    });
  }

  spawnConfetti(count) {
    const colors = [0xff0040, 0xff8000, 0xffff00, 0x00ff80, 0x00ffff, 0x0080ff, 0x8000ff];
    const { width, height } = this.scene.cameras.main;

    for (let i = 0; i < count; i++) {
      if (this.activeParticles >= this.maxParticles) break;

      const x = Math.random() * width;
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.scene.time.delayedCall(i * 30, () => {
        if (this.destroyed || !this.scene || this.activeParticles >= this.maxParticles) return;

        const confetti = this.getParticle();
        confetti.fillStyle(color, 1);

        // Random shape - square or rectangle
        const w = 4 + Math.random() * 4;
        const h = 2 + Math.random() * 6;
        confetti.fillRect(-w/2, -h/2, w, h);

        confetti.setPosition(x, -10);
        confetti.setRotation(Math.random() * Math.PI);

        this.activeParticles++;

        const initialRotation = confetti.rotation;

        // Fall with rotation
        this.scene.tweens.add({
          targets: confetti,
          y: height + 20,
          rotation: initialRotation + (Math.random() - 0.5) * 10,
          duration: 2000 + Math.random() * 1000,
          ease: 'Linear',
          onComplete: () => this.releaseParticle(confetti)
        });

        // Horizontal drift
        this.scene.tweens.add({
          targets: confetti,
          x: x + (Math.random() - 0.5) * 100,
          duration: 2000 + Math.random() * 1000,
          ease: 'Sine.easeInOut'
        });
      });
    }
  }

  // ===========================================
  // GAME OVER
  // ===========================================

  playGameOverEffect() {
    // Slow fade to darker
    this.scene.cameras.main.fade(500, 0, 0, 0, false, (cam, progress) => {
      if (progress === 1) {
        this.scene.cameras.main.resetFX();
      }
    });

    // Reset streak
    this.resetStreak();
  }

  // ===========================================
  // BOARD CLEARED / PALETTE CHANGE EFFECTS
  // ===========================================

  playBoardClearedEffect() {
    const cam = this.scene.cameras.main;

    // Big celebratory flash
    cam.flash(400, 255, 255, 255, false);

    // Strong screen shake
    cam.shake(300, 0.012);

    // Dramatic zoom out then in
    cam.zoomTo(0.95, 200, 'Power2', false, (cam, progress) => {
      if (progress === 1) {
        cam.zoomTo(1.05, 150, 'Power2', false, (cam, progress2) => {
          if (progress2 === 1) {
            cam.zoomTo(1, 300, 'Bounce.easeOut');
          }
        });
      }
    });

    // Massive confetti burst
    this.spawnConfetti(30);

    // Radial burst from center
    this.createCenterBurst();
  }

  createCenterBurst() {
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const burstCount = 20;

    for (let i = 0; i < burstCount; i++) {
      if (this.activeParticles >= this.maxParticles) break;

      const angle = (i / burstCount) * Math.PI * 2;
      const distance = 150 + Math.random() * 100;
      const colors = [0xff0040, 0x00ffff, 0xffff00, 0x00ff80, 0xff00ff];
      const color = colors[i % colors.length];

      const particle = this.getParticle();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 5 + Math.random() * 5);
      particle.setPosition(centerX, centerY);

      this.activeParticles++;

      this.scene.tweens.add({
        targets: particle,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => this.releaseParticle(particle)
      });
    }
  }

  playPaletteChangeEffect(colors) {
    // Convert hex colors to numbers for effects
    const colorValues = colors.map(hex => {
      const clean = hex.replace('#', '');
      return parseInt(clean, 16);
    });

    const cam = this.scene.cameras.main;

    // Subtle color flash using first palette color
    const r = (colorValues[0] >> 16) & 0xff;
    const g = (colorValues[0] >> 8) & 0xff;
    const b = colorValues[0] & 0xff;
    cam.flash(200, r, g, b, false);

    // Spawn color-specific particles from edges
    this.spawnPaletteParticles(colorValues);
  }

  spawnPaletteParticles(colorValues) {
    const particlesPerColor = 8;
    const { width, height } = this.scene.cameras.main;

    colorValues.forEach((color, colorIndex) => {
      for (let i = 0; i < particlesPerColor; i++) {
        if (this.activeParticles >= this.maxParticles) break;

        // Spawn from edges
        const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;

        switch (edge) {
          case 0: x = Math.random() * width; y = 0; break;
          case 1: x = width; y = Math.random() * height; break;
          case 2: x = Math.random() * width; y = height; break;
          case 3: x = 0; y = Math.random() * height; break;
        }

        const delay = colorIndex * 50 + i * 30;

        this.scene.time.delayedCall(delay, () => {
          if (this.destroyed || !this.scene || this.activeParticles >= this.maxParticles) return;

          const particle = this.getParticle();
          particle.fillStyle(color, 0.9);
          particle.fillCircle(0, 0, 4 + Math.random() * 4);
          particle.setPosition(x, y);

          this.activeParticles++;

          // Move toward center
          const targetX = width / 2 + (Math.random() - 0.5) * 100;
          const targetY = height / 2 + (Math.random() - 0.5) * 100;

          this.scene.tweens.add({
            targets: particle,
            x: targetX,
            y: targetY,
            scaleX: 0.3,
            scaleY: 0.3,
            alpha: 0,
            duration: 500 + Math.random() * 300,
            ease: 'Power2',
            onComplete: () => this.releaseParticle(particle)
          });
        });
      }
    });
  }

  // ===========================================
  // CLEANUP
  // ===========================================

  destroy() {
    this.destroyed = true;

    // Unregister event listeners using bound references
    if (this.boundHandleLinesCleared) {
      this.events.off(EVENTS.LINES_CLEARED, this.boundHandleLinesCleared);
      this.boundHandleLinesCleared = null;
    }
    if (this.boundHandleScoreUpdated) {
      this.events.off(EVENTS.SCORE_UPDATED, this.boundHandleScoreUpdated);
      this.boundHandleScoreUpdated = null;
    }
    if (this.boundHandleShapePlaced) {
      this.events.off(EVENTS.SHAPE_PLACED, this.boundHandleShapePlaced);
      this.boundHandleShapePlaced = null;
    }
    if (this.boundHandleMilestoneReached) {
      this.events.off(EVENTS.MILESTONE_REACHED, this.boundHandleMilestoneReached);
      this.boundHandleMilestoneReached = null;
    }
    if (this.boundHandleBoardCleared) {
      this.events.off(EVENTS.BOARD_CLEARED, this.boundHandleBoardCleared);
      this.boundHandleBoardCleared = null;
    }
    if (this.boundHandlePaletteChanged) {
      this.events.off(EVENTS.PALETTE_CHANGED, this.boundHandlePaletteChanged);
      this.boundHandlePaletteChanged = null;
    }

    // Destroy all pooled particles
    this.particlePool.forEach(particle => {
      if (particle && particle.destroy) {
        particle.destroy();
      }
    });
    this.particlePool = [];
    this.activeParticles = 0;

    // Clear references
    this.gridView = null;
    this.scene = null;
  }
}
