/**
 * This module provides access to the Gaze configuration
 * that was set in next.config.mjs
 */

// This will be populated by the loader
declare global {
  var __GAZE_LOADER_CONFIG__: any;
}

export function getGazeConfig() {
  if (typeof window !== 'undefined' && window.__GAZE_LOADER_CONFIG__) {
    return window.__GAZE_LOADER_CONFIG__;
  }
  return {};
}