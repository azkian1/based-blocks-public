// Neon Cyberpunk theme - default style
export const neonTheme = {
  id: 'neon',
  name: 'Neon Cyberpunk',
  locked: false,
  price: 0,

  colors: {
    // Background colors
    background: 0x0a0a0f,
    gridBackground: 0x0d1b2a,  // Midnight Blue

    // Grid lines
    gridLine: 0xffffff,
    gridLineAlpha: 0.1,

    // Line clear preview highlight
    lineHighlight: 0xffffff,

    // Frame style (for NeonFrame component)
    frame: {
      stroke: 0x00ffff,
      strokeAlpha: 1,
      glowColor: 0x00ffff,
      glowAlpha: 0.4,
      glowLayers: 3,
      cornerRadius: 8
    },

    // Block colors
    blocks: [
      { name: 'RED',    fill: 0xff0040, glow: 'rgba(255,0,64,0.6)' },
      { name: 'ORANGE', fill: 0xff8000, glow: 'rgba(255,128,0,0.6)' },
      { name: 'YELLOW', fill: 0xffff00, glow: 'rgba(255,255,0,0.6)' },
      { name: 'GREEN',  fill: 0x00ff80, glow: 'rgba(0,255,128,0.6)' },
      { name: 'CYAN',   fill: 0x00ffff, glow: 'rgba(0,255,255,0.6)' },
      { name: 'BLUE',   fill: 0x0080ff, glow: 'rgba(0,128,255,0.6)' },
      { name: 'PURPLE', fill: 0x8000ff, glow: 'rgba(128,0,255,0.6)' }
    ],

    // UI colors
    ui: {
      titleColor: '#00ffff',
      textPrimary: '#ffffff',
      textSecondary: '#888888',
      textAccent: '#00ffff',
      textWarning: '#ffff00',
      textDanger: '#ff0040',
      textSuccess: '#00ff80',

      buttonText: '#00ffff',
      buttonHover: '#ffffff',
      buttonBg: 0x00ffff,
      buttonBgAlpha: 0.1
    },

    // Slot colors
    slot: {
      empty: 0x1a2a3a,
      emptyAlpha: 0.5,
      border: 0x00ffff,
      borderAlpha: 0.3
    }
  },

  effects: {
    // Particle colors for line clear
    lineClearParticle: 0x00ffff,

    // Combo flash colors (escalating intensity)
    comboFlash: [0xffffff, 0xffff00, 0xff8800, 0xff0088],

    // Screen shake intensity
    shakeIntensity: 0.005
  }
};
