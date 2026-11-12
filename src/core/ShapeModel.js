import { SHAPES } from '../data/shapes.js';

// ShapeModel - Represents a single shape instance
// Owner: Agent A (Core Logic)
//
// API Contract:
// - id: string - unique instance identifier
// - type: string - shape type key (e.g., 'line3h', 'square2')
// - blocks: [number, number][] - relative cell coordinates
// - colorId: number - color index (1-7)
// - getWidth(): number - shape width in cells
// - getHeight(): number - shape height in cells
// - getCellCount(): number - number of cells in shape

let shapeIdCounter = 0;

export class ShapeModel {
  constructor(type, colorId) {
    this.id = `shape_${++shapeIdCounter}`;
    this.type = type;

    // Validate colorId
    if (!Number.isInteger(colorId) || colorId < 1) {
      this.colorId = 1; // Default to 1 if invalid
    } else {
      this.colorId = colorId;
    }

    // Get block positions from shape definitions
    const shapeDef = SHAPES[type];
    if (!shapeDef) {
      throw new Error(`Unknown shape type: ${type}`);
    }

    // Deep clone blocks to prevent mutation
    this.blocks = shapeDef.blocks.map(block => [...block]);
    this.name = shapeDef.name;

    // Cache dimensions for performance (calculated once)
    this._width = this._calculateWidth();
    this._height = this._calculateHeight();
  }

  // Internal: calculate width
  _calculateWidth() {
    if (this.blocks.length === 0) return 0;
    const maxX = Math.max(...this.blocks.map(([x]) => x));
    return maxX + 1;
  }

  // Internal: calculate height
  _calculateHeight() {
    if (this.blocks.length === 0) return 0;
    const maxY = Math.max(...this.blocks.map(([, y]) => y));
    return maxY + 1;
  }

  // Get shape width (cached)
  getWidth() {
    return this._width;
  }

  // Get shape height (cached)
  getHeight() {
    return this._height;
  }

  // Get number of cells
  getCellCount() {
    return this.blocks.length;
  }

  // Create a plain object representation (for events)
  // Returns deep copy to prevent external mutation
  toData() {
    return {
      id: this.id,
      type: this.type,
      blocks: this.blocks.map(block => [...block]),
      colorId: this.colorId
    };
  }
}
