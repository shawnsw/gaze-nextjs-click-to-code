'use client';

import { useEffect } from 'react';
import { enableSourceHighlighting } from 'gaze/runtime';

/**
 * Client component that initializes Gaze in development
 * This is isolated from the main layout to keep it server-side
 */
export function GazeInitializer() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const cleanup = enableSourceHighlighting({});
      return cleanup;
    }
  }, []);

  return null;
}