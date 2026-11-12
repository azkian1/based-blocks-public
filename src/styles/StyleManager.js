// StyleManager - singleton for managing game themes/styles
import { themes, themeList } from './themes/index.js';
import { CONFIG } from '../config.js';
import { EVENTS } from '../events.js';

const STORAGE_KEYS = {
  ACTIVE_STYLE: 'blockpuzzle.activeStyle',
  UNLOCKED_STYLES: 'blockpuzzle.unlockedStyles',
  CURRENT_PALETTE: 'blockpuzzle.currentPalette'
};

const DEFAULT_STYLE = 'neon';

class StyleManagerClass {
  constructor() {
    this.themes = themes;
    this.activeStyleId = DEFAULT_STYLE;
    this.unlockedStyles = new Set([DEFAULT_STYLE]);
    this.eventEmitter = null;

    // Palette system
    this.currentPaletteIndex = 0;

    this.loadFromStorage();
  }

  // Set event emitter for notifying about style changes
  setEventEmitter(emitter) {
    this.eventEmitter = emitter;
  }

  // Load saved data from localStorage
  loadFromStorage() {
    try {
      // Load active style
      const savedActive = localStorage.getItem(STORAGE_KEYS.ACTIVE_STYLE);
      if (savedActive && this.themes[savedActive]) {
        this.activeStyleId = savedActive;
      }

      // Load unlocked styles
      const savedUnlocked = localStorage.getItem(STORAGE_KEYS.UNLOCKED_STYLES);
      if (savedUnlocked) {
        const parsed = JSON.parse(savedUnlocked);
        if (Array.isArray(parsed)) {
          // Validate each style exists
          parsed.forEach(id => {
            if (this.themes[id]) {
              this.unlockedStyles.add(id);
            }
          });
        }
      }

      // Load palette index
      this.loadPaletteFromStorage();
    } catch (e) {
      console.warn('StyleManager: Failed to load from storage', e);
    }
  }

  // Save data to localStorage
  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_STYLE, this.activeStyleId);
      localStorage.setItem(
        STORAGE_KEYS.UNLOCKED_STYLES,
        JSON.stringify([...this.unlockedStyles])
      );
    } catch (e) {
      console.warn('StyleManager: Failed to save to storage', e);
    }
  }

  // Get currently active style object
  getActiveStyle() {
    return this.themes[this.activeStyleId] || this.themes[DEFAULT_STYLE];
  }

  // Get active style ID
  getActiveStyleId() {
    return this.activeStyleId;
  }

  // Set active style by ID
  setActiveStyle(styleId) {
    if (!this.themes[styleId]) {
      console.warn(`StyleManager: Style "${styleId}" not found`);
      return false;
    }

    if (!this.unlockedStyles.has(styleId)) {
      console.warn(`StyleManager: Style "${styleId}" is locked`);
      return false;
    }

    this.activeStyleId = styleId;

    // Clamp palette index to new theme's palette count
    const palettes = this.getActivePalettes();
    if (this.currentPaletteIndex >= palettes.length) {
      this.currentPaletteIndex = 0;
      this.savePaletteToStorage();
    }

    this.saveToStorage();

    // Emit event if emitter is set
    if (this.eventEmitter) {
      this.eventEmitter.emit('style:changed', { styleId });
    }

    return true;
  }

  // Get all available themes
  getAllThemes() {
    return themeList;
  }

  // Get unlocked styles
  getUnlockedStyles() {
    return themeList.filter(theme => this.unlockedStyles.has(theme.id));
  }

  // Get locked styles
  getLockedStyles() {
    return themeList.filter(theme => !this.unlockedStyles.has(theme.id));
  }

  // Check if style is unlocked
  isUnlocked(styleId) {
    return this.unlockedStyles.has(styleId);
  }

  // Unlock a style
  unlockStyle(styleId) {
    if (!this.themes[styleId]) {
      console.warn(`StyleManager: Style "${styleId}" not found`);
      return false;
    }

    this.unlockedStyles.add(styleId);
    this.saveToStorage();

    // Emit event if emitter is set
    if (this.eventEmitter) {
      this.eventEmitter.emit('style:purchased', { styleId });
    }

    return true;
  }

  // Helper: get current colors
  getColors() {
    return this.getActiveStyle().colors;
  }

  // Helper: get current effects
  getEffects() {
    return this.getActiveStyle().effects;
  }

  // Helper: get block colors array (from current palette)
  getBlockColors() {
    const paletteColors = this.getCurrentPaletteColors();

    // Convert palette hex strings to block color objects
    return paletteColors.map((hexColor, index) => {
      const fill = this.hexToNumber(hexColor);
      return {
        name: `COLOR_${index + 1}`,
        fill: fill,
        glow: `${hexColor}99` // hex with 60% alpha
      };
    });
  }

  // Convert hex string to number (e.g., '#ff0040' -> 0xff0040)
  hexToNumber(hex) {
    if (typeof hex === 'number') return hex;
    const cleanHex = hex.replace('#', '');
    return parseInt(cleanHex, 16);
  }

  // Helper: get UI colors
  getUIColors() {
    return this.getColors().ui;
  }

  // Helper: get frame style
  getFrameStyle() {
    return this.getColors().frame;
  }

  // ============================================
  // PALETTE SYSTEM
  // ============================================

  // Get palettes for active theme (theme-specific or global fallback)
  getActivePalettes() {
    const theme = this.getActiveStyle();
    return (theme.palettes && theme.palettes.length > 0)
      ? theme.palettes
      : CONFIG.COLOR_PALETTES;
  }

  // Get current palette
  getCurrentPalette() {
    const palettes = this.getActivePalettes();
    if (!palettes || palettes.length === 0) {
      return { name: 'Default', colors: ['#ff0040', '#00ffff'] };
    }
    return palettes[this.currentPaletteIndex] || palettes[0];
  }

  // Get current palette index
  getCurrentPaletteIndex() {
    return this.currentPaletteIndex;
  }

  // Get current palette colors
  getCurrentPaletteColors() {
    return this.getCurrentPalette().colors;
  }

  // Get block color by colorId (1-based index)
  getPaletteBlockColor(colorId) {
    const colors = this.getCurrentPaletteColors();
    const index = ((colorId - 1) % colors.length);
    return colors[index];
  }

  // Switch to next random palette (different from current)
  nextPalette() {
    const palettes = this.getActivePalettes();
    if (!palettes || palettes.length <= 1) return;

    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * palettes.length);
    } while (newIndex === this.currentPaletteIndex);

    this.currentPaletteIndex = newIndex;
    this.savePaletteToStorage();

    // Emit palette changed event
    if (this.eventEmitter) {
      this.eventEmitter.emit(EVENTS.PALETTE_CHANGED, {
        paletteIndex: this.currentPaletteIndex,
        paletteName: this.getCurrentPalette().name,
        colors: this.getCurrentPaletteColors()
      });
    }
  }

  // Set specific palette by index
  setPalette(index) {
    const palettes = this.getActivePalettes();
    if (!palettes || index < 0 || index >= palettes.length) return;

    this.currentPaletteIndex = index;
    this.savePaletteToStorage();

    if (this.eventEmitter) {
      this.eventEmitter.emit(EVENTS.PALETTE_CHANGED, {
        paletteIndex: this.currentPaletteIndex,
        paletteName: this.getCurrentPalette().name,
        colors: this.getCurrentPaletteColors()
      });
    }
  }

  // Reset palette to first one (for new game)
  resetPalette() {
    this.currentPaletteIndex = 0;
    this.savePaletteToStorage();
  }

  // Save palette index to storage
  savePaletteToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PALETTE, this.currentPaletteIndex.toString());
    } catch (e) {
      console.warn('StyleManager: Failed to save palette', e);
    }
  }

  // Load palette index from storage
  loadPaletteFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_PALETTE);
      if (saved !== null) {
        const index = parseInt(saved, 10);
        const palettes = this.getActivePalettes();
        if (!isNaN(index) && palettes && index >= 0 && index < palettes.length) {
          this.currentPaletteIndex = index;
        }
      }
    } catch (e) {
      console.warn('StyleManager: Failed to load palette', e);
    }
  }
}

// Export singleton instance
export const StyleManager = new StyleManagerClass();
