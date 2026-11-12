import { EVENTS } from '../events.js';

// SoundManager - Handles game audio
// Owner: Agent B (Presentation)
//
// API Contract:
// - playPlace(): void - play placement sound
// - playClear(lineCount): void - play line clear sound
// - playCombo(level): void - play combo sound
// - playGameOver(): void - play game over sound
// - setMuted(muted): void - mute/unmute all sounds

export class SoundManager {
  constructor(scene, eventEmitter) {
    this.scene = scene;
    this.events = eventEmitter;
    this.muted = false;

    // Sound references (loaded in PreloadScene)
    this.sounds = {
      // Actions
      place: null,
      pickup: null,
      click: null,
      invalid: null,
      // Clear (by line count)
      clear1: null,
      clear2: null,
      clear3: null,
      clear4: null,
      // Combo (by combo level)
      combo2: null,
      combo3: null,
      combo4: null,
      combo5: null,
      // Milestones
      milestone_small: null,
      milestone_medium: null,
      milestone_big: null,
      // Game state
      gameover: null,
      newbest: null
    };

    // Track pending sounds to avoid overlap
    this.pendingPlaceSound = null;

    // Sound priority queue system - play only highest priority sound per frame
    this.pendingSounds = [];
    this.flushTimer = null;
    // Simplified priority: milestone > clear
    this.soundPriority = {
      milestone_big: 100,
      clear3: 30,  // 4+ lines
      clear2: 20,  // 3 lines
      clear1: 15   // 1-2 lines
    };

    this.setupEventListeners();
    this.loadSounds();
  }

  // Load sound references
  loadSounds() {
    const soundKeys = Object.keys(this.sounds);
    soundKeys.forEach(key => {
      if (this.scene.cache.audio.exists(key)) {
        this.sounds[key] = this.scene.sound.add(key, { volume: 0.5 });
      }
    });
  }

  setupEventListeners() {
    // Shape placed - delay sound to allow cancellation if lines clear
    this.events.on(EVENTS.SHAPE_PLACED, () => {
      // Schedule place sound with small delay
      this.pendingPlaceSound = setTimeout(() => {
        this.playPlace();
        this.pendingPlaceSound = null;
      }, 30);
    });

    // Placement rejected (invalid position)
    this.events.on(EVENTS.PLACEMENT_REJECTED, () => {
      this.playInvalid();
    });

    // Lines cleared - cancel place sound, queue clear sound
    this.events.on(EVENTS.LINES_CLEARED, (data) => {
      // Cancel pending place sound - clear sound is more rewarding
      if (this.pendingPlaceSound) {
        clearTimeout(this.pendingPlaceSound);
        this.pendingPlaceSound = null;
      }
      this.queueClearSound(data.lineCount);
    });

    // Score updated (for combo sounds) - DISABLED
    // this.events.on(EVENTS.SCORE_UPDATED, (data) => {
    //   if (data.combo > 1) {
    //     this.queueComboSound(data.combo);
    //   }
    // });

    // Milestone reached - queue milestone sound
    this.events.on(EVENTS.MILESTONE_REACHED, (data) => {
      this.queueMilestoneSound(data.milestone);
    });

    // Game over (check for new best)
    this.events.on(EVENTS.GAME_OVER, (data) => {
      if (data.isNewBest) {
        this.playNewBest();
      } else {
        this.playGameOver();
      }
    });
  }

  // Play placement sound
  playPlace() {
    if (this.muted) return;
    if (this.sounds.place) {
      // Add slight pitch variation for variety
      const detune = (Math.random() - 0.5) * 100;
      this.sounds.place.play({ detune });
    }
  }

  // Play line clear sound
  playClear(lineCount) {
    if (this.muted) return;

    // Select sound based on line count (1-4, capped at 4)
    const clearLevel = Math.min(lineCount, 4);
    const sound = this.sounds[`clear${clearLevel}`];

    if (sound) {
      sound.play();
    }
  }

  // Play combo sound
  playCombo(level) {
    if (this.muted) return;

    // combo2 for level 2, combo3 for level 3, etc. (max combo5)
    const comboLevel = Math.min(Math.max(level, 2), 5);
    const sound = this.sounds[`combo${comboLevel}`];

    if (sound) {
      sound.play();
    }
  }

  // Play game over sound
  playGameOver() {
    if (this.muted) return;
    if (this.sounds.gameover) {
      this.sounds.gameover.play();
    }
  }

  // Play UI click sound
  playClick() {
    if (this.muted) return;
    if (this.sounds.click) {
      this.sounds.click.play();
    }
  }

  // Play pickup sound (when shape is grabbed)
  playPickup() {
    if (this.muted) return;
    if (this.sounds.pickup) {
      this.sounds.pickup.play();
    }
  }

  // Play invalid placement sound
  playInvalid() {
    if (this.muted) return;
    if (this.sounds.invalid) {
      this.sounds.invalid.play();
    }
  }

  // Play milestone sound (direct, for non-queued calls)
  playMilestone(milestone) {
    if (this.muted) return;

    let sound;
    if (milestone >= 10000) {
      sound = this.sounds.milestone_big;
    } else if (milestone >= 5000) {
      sound = this.sounds.milestone_medium;
    } else {
      sound = this.sounds.milestone_small;
    }

    if (sound) {
      sound.play();
    }
  }

  // Queue clear sound for priority processing
  // 1-2 lines → clear1, 3 lines → clear2, 4+ lines → clear3
  queueClearSound(lineCount) {
    let soundKey;
    if (lineCount <= 2) {
      soundKey = 'clear1';
    } else if (lineCount === 3) {
      soundKey = 'clear2';
    } else {
      soundKey = 'clear3';
    }
    this.queueSound(soundKey);
  }

  // Queue combo sound for priority processing
  queueComboSound(level) {
    const comboLevel = Math.min(Math.max(level, 2), 5);
    const soundKey = `combo${comboLevel}`;
    this.queueSound(soundKey);
  }

  // Queue milestone sound for priority processing
  // Only milestone_big at 10k+ intervals
  queueMilestoneSound(milestone) {
    if (milestone >= 10000) {
      this.queueSound('milestone_big');
    }
    // No sound for milestones below 10k
  }

  // Add sound to priority queue and schedule flush
  queueSound(soundKey) {
    this.pendingSounds.push(soundKey);

    // Schedule flush if not already scheduled
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushSoundQueue();
      }, 10); // Small delay to collect all sounds from same frame
    }
  }

  // Play only the highest priority sound from queue
  flushSoundQueue() {
    this.flushTimer = null;

    if (this.muted || this.pendingSounds.length === 0) {
      this.pendingSounds = [];
      return;
    }

    // Sort by priority (descending) and play highest
    const highest = this.pendingSounds.sort((a, b) =>
      (this.soundPriority[b] || 0) - (this.soundPriority[a] || 0)
    )[0];

    if (this.sounds[highest]) {
      this.sounds[highest].play();
    }

    this.pendingSounds = [];
  }

  // Play new best score sound
  playNewBest() {
    if (this.muted) return;
    if (this.sounds.newbest) {
      this.sounds.newbest.play();
    }
  }

  // Set mute state
  setMuted(muted) {
    this.muted = muted;
    // Also mute/unmute the Phaser sound manager
    this.scene.sound.mute = muted;
  }

  // Toggle mute
  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // Cleanup
  destroy() {
    if (this.pendingPlaceSound) {
      clearTimeout(this.pendingPlaceSound);
      this.pendingPlaceSound = null;
    }
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.pendingSounds = [];
  }
}
