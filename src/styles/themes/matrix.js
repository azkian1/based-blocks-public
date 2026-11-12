// Matrix theme - green terminal aesthetic
export const matrixTheme = {
  id: 'matrix',
  name: 'Matrix',
  locked: false,
  price: 0,

  colors: {
    // Background colors
    background: 0x000a00,
    gridBackground: 0x001a00,

    // Grid lines
    gridLine: 0x00ff41,
    gridLineAlpha: 0.08,

    // Line clear preview highlight
    lineHighlight: 0x00ff41,

    // Frame style (for NeonFrame component)
    frame: {
      stroke: 0x00ff41,
      strokeAlpha: 1,
      glowColor: 0x00ff41,
      glowAlpha: 0.4,
      glowLayers: 3,
      cornerRadius: 8
    },

    // Block colors (fallback, palettes override these)
    blocks: [
      { name: 'GREEN_BRIGHT', fill: 0x00ff41, glow: 'rgba(0,255,65,0.6)' },
      { name: 'GREEN_LIME',   fill: 0x80ff80, glow: 'rgba(128,255,128,0.6)' },
      { name: 'GREEN_DARK',   fill: 0x00aa2a, glow: 'rgba(0,170,42,0.6)' },
      { name: 'GREEN_PALE',   fill: 0xaaffaa, glow: 'rgba(170,255,170,0.6)' },
      { name: 'GREEN_DEEP',   fill: 0x00cc00, glow: 'rgba(0,204,0,0.6)' },
      { name: 'GREEN_FOREST', fill: 0x004400, glow: 'rgba(0,68,0,0.6)' },
      { name: 'WHITE',        fill: 0xffffff, glow: 'rgba(255,255,255,0.6)' }
    ],

    // UI colors
    ui: {
      titleColor: '#00ff41',
      textPrimary: '#ffffff',
      textSecondary: '#55aa55',
      textAccent: '#00ff41',
      textWarning: '#aaff00',
      textDanger: '#ff0040',
      textSuccess: '#00ff41',

      buttonText: '#00ff41',
      buttonHover: '#ffffff',
      buttonBg: 0x00ff41,
      buttonBgAlpha: 0.1
    },

    // Slot colors
    slot: {
      empty: 0x0a2a0a,
      emptyAlpha: 0.5,
      border: 0x00ff41,
      borderAlpha: 0.3
    }
  },

  effects: {
    // Particle colors for line clear
    lineClearParticle: 0x00ff41,

    // Combo flash colors (escalating intensity)
    comboFlash: [0x00ff41, 0x80ff80, 0xaaffaa, 0xffffff],

    // Screen shake intensity
    shakeIntensity: 0.005
  },

  // Theme-specific palettes (override CONFIG.COLOR_PALETTES)
  palettes: [
    { name: 'Terminal',  colors: ['#00ff41', '#00aa2a'] },
    { name: 'Phosphor',  colors: ['#80ff80', '#00cc00'] },
    { name: 'Hacker',    colors: ['#00ff41', '#004400'] },
    { name: 'Code',      colors: ['#aaffaa', '#00ff41'] },
    { name: 'Glitch',    colors: ['#00ff41', '#ffffff'] }
  ]
};
