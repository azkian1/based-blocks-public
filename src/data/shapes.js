// Shape definitions
// Each shape is defined as an array of [x, y] relative coordinates
// Origin (0,0) is the top-left block of the shape

export const SHAPES = {
  // ============================================
  // SINGLE BLOCK
  // ============================================
  single: {
    name: 'Single',
    blocks: [[0, 0]]
  },

  // ============================================
  // HORIZONTAL LINES
  // ============================================
  line2h: {
    name: 'Line 2H',
    blocks: [[0, 0], [1, 0]]
  },
  line3h: {
    name: 'Line 3H',
    blocks: [[0, 0], [1, 0], [2, 0]]
  },
  line4h: {
    name: 'Line 4H',
    blocks: [[0, 0], [1, 0], [2, 0], [3, 0]]
  },
  line5h: {
    name: 'Line 5H',
    blocks: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]
  },

  // ============================================
  // VERTICAL LINES
  // ============================================
  line2v: {
    name: 'Line 2V',
    blocks: [[0, 0], [0, 1]]
  },
  line3v: {
    name: 'Line 3V',
    blocks: [[0, 0], [0, 1], [0, 2]]
  },
  line4v: {
    name: 'Line 4V',
    blocks: [[0, 0], [0, 1], [0, 2], [0, 3]]
  },
  line5v: {
    name: 'Line 5V',
    blocks: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]
  },

  // ============================================
  // SQUARES
  // ============================================
  square2: {
    name: 'Square 2x2',
    blocks: [[0, 0], [1, 0], [0, 1], [1, 1]]
  },
  square3: {
    name: 'Square 3x3',
    blocks: [
      [0, 0], [1, 0], [2, 0],
      [0, 1], [1, 1], [2, 1],
      [0, 2], [1, 2], [2, 2]
    ]
  },

  // ============================================
  // L-SHAPES (all 4 orientations)
  // ============================================
  l_0: {
    name: 'L Shape 0',
    blocks: [[0, 0], [0, 1], [0, 2], [1, 2]]
  },
  l_90: {
    name: 'L Shape 90',
    blocks: [[0, 0], [1, 0], [2, 0], [0, 1]]
  },
  l_180: {
    name: 'L Shape 180',
    blocks: [[0, 0], [1, 0], [1, 1], [1, 2]]
  },
  l_270: {
    name: 'L Shape 270',
    blocks: [[2, 0], [0, 1], [1, 1], [2, 1]]
  },

  // ============================================
  // J-SHAPES (mirrored L, all 4 orientations)
  // ============================================
  j_0: {
    name: 'J Shape 0',
    blocks: [[1, 0], [1, 1], [0, 2], [1, 2]]
  },
  j_90: {
    name: 'J Shape 90',
    blocks: [[0, 0], [0, 1], [1, 1], [2, 1]]
  },
  j_180: {
    name: 'J Shape 180',
    blocks: [[0, 0], [1, 0], [0, 1], [0, 2]]
  },
  j_270: {
    name: 'J Shape 270',
    blocks: [[0, 0], [1, 0], [2, 0], [2, 1]]
  },

  // ============================================
  // T-SHAPES
  // ============================================
  t_0: {
    name: 'T Shape 0',
    blocks: [[0, 0], [1, 0], [2, 0], [1, 1]]
  },
  t_90: {
    name: 'T Shape 90',
    blocks: [[1, 0], [0, 1], [1, 1], [1, 2]]
  },
  t_180: {
    name: 'T Shape 180',
    blocks: [[1, 0], [0, 1], [1, 1], [2, 1]]
  },
  t_270: {
    name: 'T Shape 270',
    blocks: [[0, 0], [0, 1], [1, 1], [0, 2]]
  },

  // ============================================
  // CORNER SHAPES (2x2 with one missing)
  // ============================================
  corner_0: {
    name: 'Corner 0',
    blocks: [[0, 0], [1, 0], [0, 1]]
  },
  corner_90: {
    name: 'Corner 90',
    blocks: [[0, 0], [1, 0], [1, 1]]
  },
  corner_180: {
    name: 'Corner 180',
    blocks: [[1, 0], [0, 1], [1, 1]]
  },
  corner_270: {
    name: 'Corner 270',
    blocks: [[0, 0], [0, 1], [1, 1]]
  },

  // ============================================
  // S-SHAPES (Zigzag)
  // ============================================
  s_0: {
    name: 'S Shape 0',
    //  ▓▓
    // ▓▓
    blocks: [[1, 0], [2, 0], [0, 1], [1, 1]]
  },
  s_90: {
    name: 'S Shape 90',
    // ▓
    // ▓▓
    //  ▓
    blocks: [[0, 0], [0, 1], [1, 1], [1, 2]]
  },

  // ============================================
  // Z-SHAPES (Mirrored Zigzag)
  // ============================================
  z_0: {
    name: 'Z Shape 0',
    // ▓▓
    //  ▓▓
    blocks: [[0, 0], [1, 0], [1, 1], [2, 1]]
  },
  // ============================================
  // RECTANGLES
  // ============================================
  rect_2x3: {
    name: 'Rectangle 2x3',
    // ▓▓▓
    // ▓▓▓
    blocks: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]
  },
  rect_3x2: {
    name: 'Rectangle 3x2',
    // ▓▓
    // ▓▓
    // ▓▓
    blocks: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]]
  },

  // ============================================
  // BIG L-SHAPES (3x3 corner, 5 blocks)
  // ============================================
  bigL_0: {
    name: 'Big L 0',
    // ▓
    // ▓
    // ▓▓▓
    blocks: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]
  },
  bigL_90: {
    name: 'Big L 90',
    // ▓▓▓
    // ▓
    // ▓
    blocks: [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]]
  },
  bigL_180: {
    name: 'Big L 180',
    // ▓▓▓
    //   ▓
    //   ▓
    blocks: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]
  },
};

// Shape type lists for generator (grouped by size for balancing)
// xlarge = shapes that fill lines quickly (5+ blocks or line-filling)
export const SHAPE_GROUPS = {
  tiny: ['single'],
  small: ['line2h', 'line2v', 'corner_0', 'corner_90', 'corner_180', 'corner_270'],
  medium: ['line3h', 'line3v', 'square2', 'l_0', 'l_90', 'l_180', 'l_270', 'j_0', 'j_90', 'j_180', 'j_270', 's_0', 's_90', 'z_0'],
  large: ['line4h', 'line4v', 't_0', 't_90', 't_180', 't_270'],
  xlarge: ['line5h', 'line5v', 'square3', 'bigL_0', 'bigL_90', 'bigL_180', 'rect_2x3', 'rect_3x2']
};

// All shape types as flat array
export const ALL_SHAPE_TYPES = Object.keys(SHAPES);
