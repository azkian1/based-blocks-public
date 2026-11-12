// Local game configuration.
export const CONFIG = {
  // Fonts
  FONTS: {
    primary: 'Orbitron, sans-serif',
    secondary: 'Arial, sans-serif'
  },

  // Grid settings
  GRID_SIZE: 8,           // 8x8 grid
  CELL_SIZE: 36,          // pixels per cell (288/8 = 36)
  SHAPES_PER_TURN: 3,     // shapes given each turn
  COLOR_COUNT: 2,         // number of block colors (2 per palette)

  // Game dimensions (2:3 aspect ratio)
  GAME_WIDTH: 400,
  GAME_HEIGHT: 600,

  // Grid position (centered horizontally)
  GRID_OFFSET_X: 56,      // (400 - 288) / 2
  GRID_OFFSET_Y: 75,      // Start below score with gap

  // Inventory (shape dock) settings
  INVENTORY: {
    Y: 450,               // Y position of inventory (below grid)
    WIDTH: 288,           // Same as grid width
    HEIGHT: 60,           // Height of inventory area
    SLOT_SIZE: 80,        // Size of each slot
    SLOT_PADDING: 8,      // Padding inside slot
    SPACING: 10           // Space between slots
  },

  // Legacy dock settings (for compatibility)
  DOCK_Y: 540,
  DOCK_SPACING: 110,

  // Scoring
  SCORE: {
    PER_CELL: 10,         // points per placed cell
    PER_LINE: 100,        // points per cleared line
    LINE_MULTIPLIER: 0.5, // bonus multiplier per additional line
    COMBO_BONUS: 50       // bonus per combo level
  },

  // Animation timings (ms)
  ANIMATION: {
    PLACE_DURATION: 150,
    CLEAR_DURATION: 200,
    SCORE_POPUP_DURATION: 500,
    FADE_DURATION: 300,    // Scene transition fade
    BREATHING_INTERVAL: 2000,  // Block breathing effect interval
    GLOW_FLASH_DURATION: 250,
    PARTICLE_BURST_DURATION: 400,
    RING_EXPAND_DURATION: 350,
    COMBO_FLASH_DURATION: 120,
    CONFETTI_FALL_DURATION: 2500,
    FIRE_PARTICLE_DURATION: 700,
    PALETTE_CHANGE_FLASH: 100
  },

  // Effects settings
  EFFECTS: {
    MAX_PARTICLES: 50,      // Maximum active particles (mobile optimization)
    WAVE_DELAY: 30,         // Delay between cell effects in wave pattern
    TRAIL_COUNT: 3,         // Particles in trails
    PARTICLES_PER_CELL: 8,  // Particles per cell in bursts
    FIRE_PARTICLES_PER_CELL: 10,
    CONFETTI_COUNT_BASE: 15, // Base confetti count (multiplied by intensity)
    CENTER_BURST_COUNT: 20,
    GLOW_SIZE_MULTIPLIER: 0.6,  // Relative to cell size
    PARTICLE_SIZE_MIN: 3,
    PARTICLE_SIZE_MAX: 6,
    PARTICLE_SPEED_MIN: 40,
    PARTICLE_SPEED_MAX: 70
  },

  // UI Layout
  UI: {
    SCORE_Y: 15           // Score at top center
  },

  // TabBar settings
  TAB_BAR: {
    Y: 540,               // CONFIG.GAME_HEIGHT - 60
    HEIGHT: 60,
    BUTTON_WIDTH: 133,    // 400 / 3
    TABS: ['home', 'leaderboard', 'profile'],
    ICONS: {
      home: '🏠',
      leaderboard: '🏆',
      profile: '👤'
    },
    SCENES: {
      home: 'MenuScene',
      leaderboard: 'LeaderboardScene',
      profile: 'ProfileScene'
    }
  },

  // Solvability checker settings
  SOLVABILITY: {
    TIMEOUT_MS: 100,              // Max time for solvability check
    MAX_POSITIONS_PER_SHAPE: 20,  // Limit positions to check per shape
    MAX_GENERATION_ATTEMPTS: 15   // Retry attempts before fallback (increased for adaptive)
  },

  // Adaptive shape weights based on grid occupancy
  // Format: { threshold, weights: { tiny, small, medium, large, xlarge } }
  // Goal: empty board = massive shapes (3x3, rect, line5) to fill lines fast
  ADAPTIVE_WEIGHTS: [
    { threshold: 0.10, weights: { tiny: 0.00, small: 0.00, medium: 0.05, large: 0.30, xlarge: 0.65 } }, // Very empty: 65% xlarge!
    { threshold: 0.25, weights: { tiny: 0.00, small: 0.00, medium: 0.10, large: 0.30, xlarge: 0.60 } }, // Empty: 60% xlarge
    { threshold: 0.50, weights: { tiny: 0.02, small: 0.15, medium: 0.38, large: 0.30, xlarge: 0.15 } }, // Medium: balanced
    { threshold: 0.70, weights: { tiny: 0.05, small: 0.25, medium: 0.40, large: 0.20, xlarge: 0.10 } }, // Filling up: smaller shapes
    { threshold: 1.00, weights: { tiny: 0.10, small: 0.35, medium: 0.40, large: 0.12, xlarge: 0.03 } }  // Critical: tiny shapes
  ],

  // Color palettes (2 colors each, neon contrasting pairs)
  COLOR_PALETTES: [
    { name: 'Cyber',    colors: ['#ff0040', '#00ffff'] },  // red + cyan
    { name: 'Sunset',   colors: ['#ff8000', '#8000ff'] },  // orange + purple
    { name: 'Electric', colors: ['#ffff00', '#0080ff'] },  // yellow + blue
    { name: 'Nature',   colors: ['#00ff80', '#ff0080'] },  // green + pink
    { name: 'Ocean',    colors: ['#00ffff', '#ff00ff'] }   // cyan + magenta
  ]
};

// Adaptive layout helpers for mini-app mode
// Returns positions AND sizes scaled relative to screen dimensions
// LAYOUT MODEL (top-to-bottom):
//   1. Score HUD zone (fixed height)
//   2. Game Field zone (calculated, centered)
//   3. Inventory zone (fixed height, guaranteed spacing from grid)
//   4. TabBar zone (locked to viewport bottom, respects safe area)
export function getLayout(width, height) {
  // Use integers to prevent sub-pixel variance between reloads
  const w = Math.floor(width);
  const h = Math.floor(height);

  // Get safe area insets (for iOS notch/home indicator)
  const safeArea = (typeof window !== 'undefined' && window.safeAreaInsets) || {
    top: 0, bottom: 0, left: 0, right: 0
  };

  // Fixed zone heights (explicit boundaries)
  const LAYOUT = {
    MARGIN: 16,
    SCORE_HEIGHT: 50,
    TABBAR_HEIGHT: 60,
    INVENTORY_HEIGHT: 100,
    GRID_INVENTORY_GAP: 12,
    MIN_TOP_GAP: 8,
    SAFE_AREA_BOTTOM: safeArea.bottom
  };

  // Calculate TabBar position (locked to viewport bottom, respects safe area)
  const tabBarY = h - LAYOUT.TABBAR_HEIGHT - LAYOUT.SAFE_AREA_BOTTOM;

  // Calculate available space for grid (between score and inventory)
  const inventoryTop = tabBarY - LAYOUT.INVENTORY_HEIGHT;
  const gridAreaTop = LAYOUT.SCORE_HEIGHT + LAYOUT.MIN_TOP_GAP;
  const gridAreaBottom = inventoryTop - LAYOUT.GRID_INVENTORY_GAP;
  const availableForGrid = gridAreaBottom - gridAreaTop;
  const availableWidth = w - 2 * LAYOUT.MARGIN;

  // Calculate optimal cellSize (grid is square, use smaller dimension)
  const maxGridSize = Math.min(availableWidth, availableForGrid);
  const MIN_CELL = 28, MAX_CELL = 48;
  let cellSize = Math.floor(maxGridSize / CONFIG.GRID_SIZE);
  cellSize = Math.max(MIN_CELL, Math.min(MAX_CELL, cellSize));

  const gridSize = cellSize * CONFIG.GRID_SIZE;

  // Adaptive inventory sizing (proportional to cell size)
  const slotSize = Math.floor(cellSize * 2.2);
  const slotSpacing = Math.floor(cellSize * 0.28);
  const slotPadding = Math.floor(cellSize * 0.22);

  // Grid position: horizontally centered, vertically centered in available space
  const gridOffsetX = Math.floor((w - gridSize) / 2);
  const gridOffsetY = Math.floor(gridAreaTop + (availableForGrid - gridSize) / 2);

  // Inventory position: centered in inventory zone
  const inventoryCenterY = Math.floor(inventoryTop + LAYOUT.INVENTORY_HEIGHT / 2);

  // Score position: centered in score zone
  const scoreY = Math.floor(LAYOUT.SCORE_HEIGHT / 2 - 10);

  return {
    // Explicit zone boundaries (for debugging and overlap prevention)
    zones: {
      score: { top: 0, bottom: LAYOUT.SCORE_HEIGHT },
      grid: { top: gridAreaTop, bottom: gridAreaBottom },
      inventory: { top: inventoryTop, bottom: tabBarY },
      tabBar: { top: tabBarY, bottom: h - LAYOUT.SAFE_AREA_BOTTOM },
      safeArea: { bottom: LAYOUT.SAFE_AREA_BOTTOM }
    },

    // Positions (all integers)
    gridOffsetX,
    gridOffsetY,
    inventoryY: inventoryCenterY,
    tabBarY,
    scoreY,
    centerX: Math.floor(w / 2),
    centerY: Math.floor(h / 2),

    // Adaptive sizes
    cellSize,
    gridSize,
    slotSize,
    slotSpacing,
    slotPadding,

    // Safe area insets
    safeAreaBottom: LAYOUT.SAFE_AREA_BOTTOM,

    // Canvas dimensions (for reference)
    width: w,
    height: h
  };
}
