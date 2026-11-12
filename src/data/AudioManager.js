// AudioManager - Global audio state manager (singleton)
// Manages mute state for both SFX and Music

import { safeGetItem, safeSetItem } from '../utils/storage.js';

const STORAGE_KEY = 'blockpuzzle.muted';

export const AudioManager = {
  muted: false,
  initialized: false,
  game: null, // Phaser game reference

  /**
   * Initialize with Phaser game instance
   */
  init(game) {
    this.game = game;
    this.loadFromStorage();
    this.initialized = true;
    this.applyMuteState();
  },

  /**
   * Load mute state from localStorage
   */
  loadFromStorage() {
    const saved = safeGetItem(STORAGE_KEY);
    this.muted = saved === 'true';
  },

  /**
   * Save mute state to localStorage
   */
  saveToStorage() {
    safeSetItem(STORAGE_KEY, this.muted.toString());
  },

  /**
   * Apply mute state to Phaser sound manager
   */
  applyMuteState() {
    if (this.game && this.game.sound) {
      this.game.sound.mute = this.muted;
    }
  },

  /**
   * Toggle mute state
   * @returns {boolean} New mute state
   */
  toggle() {
    this.muted = !this.muted;
    this.saveToStorage();
    this.applyMuteState();
    return this.muted;
  },

  /**
   * Set mute state
   * @param {boolean} muted
   */
  setMuted(muted) {
    this.muted = muted;
    this.saveToStorage();
    this.applyMuteState();
  },

  /**
   * Get current mute state
   * @returns {boolean}
   */
  isMuted() {
    return this.muted;
  }
};
