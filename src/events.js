// Event definitions for communication between Core and Presentation
// This is the CONTRACT between Agent A and Agent B

export const EVENTS = {
  // ============================================
  // FROM PRESENTATION (Agent B) TO CORE (Agent A)
  // ============================================

  // Player dropped a shape on the grid
  // Payload: { shapeId: string, gridX: number, gridY: number }
  SHAPE_DROP_REQUESTED: 'shape:dropRequested',

  // Player requested game restart
  // Payload: {}
  RESTART_REQUESTED: 'game:restartRequested',

  // ============================================
  // FROM CORE (Agent A) TO PRESENTATION (Agent B)
  // ============================================

  // Shape was successfully placed on grid
  // Payload: { shapeId: string, gridX: number, gridY: number, cells: [{x, y, colorId}, ...] }
  SHAPE_PLACED: 'shape:placed',

  // Shape placement was rejected (invalid position)
  // Payload: { shapeId: string, reason: 'occupied' | 'out_of_bounds' }
  PLACEMENT_REJECTED: 'shape:rejected',

  // Lines were cleared from the grid
  // Payload: { rows: number[], cols: number[], cells: [{x, y}, ...], lineCount: number, score: number }
  LINES_CLEARED: 'lines:cleared',

  // Score was updated
  // Payload: { score: number, bestScore: number, combo: number, delta: number }
  SCORE_UPDATED: 'score:updated',

  // New shapes were generated for player
  // Payload: { shapes: [{ id, type, blocks, colorId }, ...] }
  NEW_SHAPES_GENERATED: 'shapes:new',

  // Game is over (no valid moves)
  // Payload: { finalScore: number, bestScore: number, isNewBest: boolean }
  GAME_OVER: 'game:over',

  // Game was restarted
  // Payload: {}
  GAME_RESTARTED: 'game:restarted',

  // ============================================
  // STYLE EVENTS
  // ============================================

  // Style was changed
  // Payload: { styleId: string }
  STYLE_CHANGED: 'style:changed',

  // Style was purchased
  // Payload: { styleId: string }
  STYLE_PURCHASED: 'style:purchased',

  // ============================================
  // DOPAMINE EFFECTS EVENTS
  // ============================================

  // Streak updated (for Fire Mode)
  // Payload: { streak: number, isOnFire: boolean, fireLevel: number }
  STREAK_UPDATED: 'effects:streakUpdated',

  // Milestone reached
  // Payload: { milestone: number, score: number }
  MILESTONE_REACHED: 'effects:milestone',

  // ============================================
  // PALETTE EVENTS
  // ============================================

  // Board was completely cleared (all cells empty after line clear)
  // Payload: { previousOccupancy: number }
  BOARD_CLEARED: 'board:cleared',

  // Color palette was changed
  // Payload: { paletteIndex: number, paletteName: string, colors: string[] }
  PALETTE_CHANGED: 'palette:changed'
};
