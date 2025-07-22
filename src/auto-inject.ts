/**
 * Auto-injection script for source highlighting
 * This is injected automatically by the loader
 */

// Only run in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Get configuration from window object (injected by loader)
  const config = (window as any).__TURBOPACK_SOURCE_CONFIG__ || {};
  
  // Import and initialize the highlighting system
  import('./runtime').then(({ enableSourceHighlighting }) => {
    const cleanup = enableSourceHighlighting({
      editor: config.editor || 'vscode',
      enabledByDefault: config.enabledByDefault || false,
      attributeName: config.attributeName || 'data-insp-path',
      styles: config.styles || {}
    });
    
    // Store cleanup function globally
    (window as any).__TURBOPACK_SOURCE_CLEANUP__ = cleanup;
    
    // Log instructions to console
    if (config.showInstructions !== false) {
      console.log('🔍 Press Shift+Z to toggle source highlighting');
      console.log('🖱️ Click any element while highlighting is on to open in editor');
      console.log(`📝 Editor: ${config.editor || 'vscode'}`);
    }
  }).catch(err => {
    console.error('Failed to initialize source highlighting:', err);
  });
}