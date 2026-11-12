import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { StyleManager } from './styles/StyleManager.js';
import { AudioManager } from './data/AudioManager.js';

// Scenes
import { PreloadScene } from './scenes/PreloadScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { ShopScene } from './scenes/ShopScene.js';
import { GameScene } from './scenes/GameScene.js';
import { UIScene } from './scenes/UIScene.js';
import { LeaderboardScene } from './scenes/LeaderboardScene.js';
import { ProfileScene } from './scenes/ProfileScene.js';

// Get initial background color from StyleManager
const colors = StyleManager.getColors();

// Detect mobile and iframe context
const isInIframe = window.parent !== window;
const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isFullscreenMode = isInIframe || isMobileDevice;

if (isFullscreenMode) {
  document.body.classList.add('fullscreen');
  console.log('[main] Running in fullscreen mode (iframe:', isInIframe, ', mobile:', isMobileDevice, ')');
}

// Get iOS safe area insets (for proper bottom nav positioning)
function getSafeAreaInsets() {
  const styles = getComputedStyle(document.documentElement);
  return {
    top: parseInt(styles.getPropertyValue('--sat') || '0', 10) ||
         parseInt(getComputedStyle(document.body).paddingTop || '0', 10),
    bottom: parseInt(styles.getPropertyValue('--sab') || '0', 10) ||
            parseInt(getComputedStyle(document.body).paddingBottom || '0', 10),
    left: parseInt(styles.getPropertyValue('--sal') || '0', 10) ||
          parseInt(getComputedStyle(document.body).paddingLeft || '0', 10),
    right: parseInt(styles.getPropertyValue('--sar') || '0', 10) ||
           parseInt(getComputedStyle(document.body).paddingRight || '0', 10)
  };
}

// Store safe area insets globally for layout calculations
window.safeAreaInsets = getSafeAreaInsets();

// Mobile performance cap
const maxPixelRatio = isMobileDevice ? 2 : window.devicePixelRatio;

// Game instance (initialized after DOM is ready)
export let game = null;
let resizeTimeout = null;
let resizeObserver = null;

// ============================================
// iOS WebView Dimension Polling
// ============================================
const MIN_EXPECTED_HEIGHT = 500;
const MAX_POLLING_ATTEMPTS = 20;
const POLLING_INTERVAL = 50;

async function waitForValidDimensions() {
  return new Promise((resolve) => {
    let attempts = 0;

    function check() {
      attempts++;
      const container = document.getElementById('game-container');

      // Try different dimension sources
      const sources = {
        container: container ? { w: container.clientWidth, h: container.clientHeight } : null,
        client: { w: document.documentElement.clientWidth, h: document.documentElement.clientHeight },
        visual: window.visualViewport ? { w: window.visualViewport.width, h: window.visualViewport.height } : null,
        inner: { w: window.innerWidth, h: window.innerHeight }
      };

      // Priority: container > visual > client > inner
      let dims = sources.container?.h >= MIN_EXPECTED_HEIGHT ? sources.container :
                 sources.visual?.h >= MIN_EXPECTED_HEIGHT ? sources.visual :
                 sources.client?.h >= MIN_EXPECTED_HEIGHT ? sources.client :
                 sources.inner;

      if ((dims.h >= MIN_EXPECTED_HEIGHT && dims.w > 0) || attempts >= MAX_POLLING_ATTEMPTS) {
        console.log('[main] Valid dimensions found after', attempts, 'attempts:', dims);
        resolve({ width: dims.w, height: dims.h });
      } else {
        setTimeout(check, POLLING_INTERVAL);
      }
    }
    check();
  });
}

// ============================================
// GAME INITIALIZATION (Deferred for WebView)
// ============================================
async function initGame() {
  // Get dimensions - use polling for fullscreen mode to handle iOS WebView timing
  let gameWidth = CONFIG.GAME_WIDTH;
  let gameHeight = CONFIG.GAME_HEIGHT;

  if (isFullscreenMode) {
    const dims = await waitForValidDimensions();
    gameWidth = dims.width;
    gameHeight = dims.height;
    console.log('[main] Fullscreen dimensions:', gameWidth, 'x', gameHeight);
  }

  // Phaser game configuration
  const config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    parent: 'game-container',
    backgroundColor: colors.background,
    scene: [
      PreloadScene,
      MenuScene,
      ShopScene,
      GameScene,
      UIScene,
      LeaderboardScene,
      ProfileScene
    ],
    scale: {
      mode: isFullscreenMode ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
      autoCenter: isFullscreenMode
        ? Phaser.Scale.NO_CENTER    // Fullscreen: no centering needed
        : Phaser.Scale.CENTER_BOTH, // Desktop: center both axes
      width: '100%',
      height: '100%',
      expandParent: true,
      resolution: Math.min(window.devicePixelRatio || 1, maxPixelRatio)
    },
    render: {
      pixelArt: false,
      antialias: true,
      roundPixels: false,
      autoRound: false
    },
    input: {
      activePointers: 1
    },
    audio: {
      disableWebAudio: false,
      noAudio: false
    }
  };

  // Create game instance
  game = new Phaser.Game(config);

  // Initialize global audio manager
  AudioManager.init(game);

  // Setup resize handlers after game is created
  setupResizeHandlers();

  console.log('[main] Game initialized with dimensions:', gameWidth, 'x', gameHeight);
}

// ============================================
// VIEWPORT RESIZE HANDLING (Mobile fix)
// ============================================
function handleViewportResize() {
  // Skip if game not yet created
  if (!game) return;

  // Debounce resize events (100ms)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  resizeTimeout = setTimeout(() => {
    const width = window.visualViewport?.width || window.innerWidth;
    const height = window.visualViewport?.height || window.innerHeight;

    console.log('[main] Viewport resize:', width, 'x', height);

    // Explicitly resize Phaser canvas
    game.scale.resize(width, height);

    // Emit event for scenes to handle
    game.events.emit('viewport-resize', { width, height });
  }, 100);
}

function setupResizeHandlers() {
  // Listen for resize events
  window.addEventListener('resize', handleViewportResize);
  window.addEventListener('orientationchange', handleViewportResize);

  // iOS Safari: visualViewport is more reliable for address bar changes
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
  }

  // ResizeObserver for container - more reliable for iOS WebView
  setupResizeObserver();
}

function setupResizeObserver() {
  const container = document.getElementById('game-container');
  if (!container || !window.ResizeObserver) return;

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0 && game) {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          console.log('[main] ResizeObserver:', width, 'x', height);
          game.scale.resize(width, height);
          game.events.emit('viewport-resize', { width, height });
        }, 100);
      }
    }
  });

  resizeObserver.observe(container);
}

// ============================================
// CLEANUP ON PAGE UNLOAD
// ============================================
function cleanup() {
  // Clear pending timeout
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }

  // Disconnect ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // Remove event listeners
  window.removeEventListener('resize', handleViewportResize);
  window.removeEventListener('orientationchange', handleViewportResize);
  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportResize);
  }

  // Destroy game instance
  if (game) {
    game.destroy(true);
    game = null;
  }
}

// Register cleanup on page unload
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);

// ============================================
// START GAME (after DOM is fully loaded)
// ============================================
if (document.readyState === 'complete') {
  // DOM already loaded, init immediately
  initGame();
} else {
  // Wait for full load (including iframes, images, WebView setup)
  window.addEventListener('load', initGame);
}
