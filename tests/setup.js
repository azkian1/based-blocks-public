// Test setup with mocks
import { vi } from 'vitest';

// Mock localStorage
export const createLocalStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] || null),
    _getStore: () => store,
    _setStore: (newStore) => { store = newStore; }
  };
};

// Mock event emitter
export const createEventEmitterMock = () => {
  const listeners = {};
  const emittedEvents = [];

  return {
    on: vi.fn((event, callback) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    }),
    emit: vi.fn((event, data) => {
      emittedEvents.push({ event, data });
      if (listeners[event]) {
        listeners[event].forEach(cb => cb(data));
      }
    }),
    off: vi.fn((event, callback) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    }),
    getEmittedEvents: () => emittedEvents,
    getLastEmitted: (eventName) => {
      const filtered = emittedEvents.filter(e => e.event === eventName);
      return filtered[filtered.length - 1] || null;
    },
    clearEmittedEvents: () => { emittedEvents.length = 0; }
  };
};

// Helper to create an empty grid
export const createEmptyGrid = (size = 8) => {
  return Array(size).fill(null).map(() => Array(size).fill(0));
};

// Helper to create a filled grid (all 1s)
export const createFilledGrid = (size = 8) => {
  return Array(size).fill(null).map(() => Array(size).fill(1));
};

// Helper to create grid with specific pattern
export const createGridFromPattern = (pattern) => {
  return pattern.map(row => [...row]);
};

// Mock window object for tests that need it
export const setupWindowMock = () => {
  if (typeof global !== 'undefined') {
    global.window = {
      game: {
        registry: {
          get: vi.fn(() => null),
          set: vi.fn()
        }
      }
    };
  }
};
