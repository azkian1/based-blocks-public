// Export all themes
import { neonTheme } from './neon.js';
import { matrixTheme } from './matrix.js';

export const themes = {
  neon: neonTheme,
  matrix: matrixTheme
};

export const themeList = Object.values(themes);
