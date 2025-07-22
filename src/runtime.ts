/**
 * Runtime utilities for reading source location metadata
 * Compatible with Next.js 15 and React 19
 */

import { getGazeConfig } from './config';

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
  raw: string;
}

/**
 * Default attribute name for source locations
 */
export const DEFAULT_ATTRIBUTE = 'data-insp-path';

/**
 * Parses a source location string in the format "file.tsx:line:column"
 */
export function parseSourceLocation(sourceString: string): SourceLocation | null {
  if (!sourceString) return null;
  
  const match = sourceString.match(/^(.+):(\d+):(\d+)$/);
  if (!match) return null;
  
  const [, file, line, column] = match;
  
  return {
    file,
    line: parseInt(line, 10),
    column: parseInt(column, 10),
    raw: sourceString
  };
}

/**
 * Gets the source location from a DOM element
 */
export function getElementSourceLocation(
  element: Element,
  attributeName: string = DEFAULT_ATTRIBUTE
): SourceLocation | null {
  const sourceAttr = element.getAttribute(attributeName);
  if (!sourceAttr) return null;
  
  return parseSourceLocation(sourceAttr);
}

/**
 * Gets source location from a React component (React 19 compatible)
 */
export function getComponentSourceLocation(component: any): SourceLocation | null {
  // React 19 fiber structure
  if (component._debugInfo) {
    const debugInfo = component._debugInfo;
    if (debugInfo.fileName && debugInfo.lineNumber) {
      return {
        file: debugInfo.fileName,
        line: debugInfo.lineNumber,
        column: debugInfo.columnNumber || 0,
        raw: `${debugInfo.fileName}:${debugInfo.lineNumber}:${debugInfo.columnNumber || 0}`
      };
    }
  }
  
  // Legacy React __source prop
  if (component._debugSource) {
    const { fileName, lineNumber, columnNumber } = component._debugSource;
    return {
      file: fileName,
      line: lineNumber,
      column: columnNumber || 0,
      raw: `${fileName}:${lineNumber}:${columnNumber || 0}`
    };
  }
  
  // Try to get from DOM element
  if (component._hostNode) {
    return getElementSourceLocation(component._hostNode);
  }
  
  return null;
}

/**
 * Finds the nearest parent element with source location metadata
 */
export function findNearestSourceLocation(
  element: Element,
  attributeName: string = DEFAULT_ATTRIBUTE
): SourceLocation | null {
  let current: Element | null = element;
  
  while (current) {
    const location = getElementSourceLocation(current, attributeName);
    if (location) return location;
    
    current = current.parentElement;
  }
  
  return null;
}

/**
 * Editor configuration for opening source files
 */
export interface EditorConfig {
  /**
   * Editor command/protocol handler
   * Examples:
   * - 'vscode://file/{file}:{line}:{column}'
   * - 'cursor://file/{file}:{line}:{column}'
   * - 'idea://open?file={file}&line={line}'
   * - 'subl://{file}:{line}:{column}'
   * - 'atom://open?url=file://{file}&line={line}&column={column}'
   */
  handler: string;
  
  /**
   * Whether the file path should be absolute
   * @default true
   */
  useAbsolutePath?: boolean;
}

/**
 * Default editor configurations
 */
export const EDITOR_HANDLERS: Record<string, EditorConfig> = {
  vscode: {
    handler: 'vscode://file/{file}:{line}:{column}',
    useAbsolutePath: true
  },
  cursor: {
    handler: 'cursor://file/{file}:{line}:{column}',
    useAbsolutePath: true
  },
  webstorm: {
    handler: 'webstorm://open?file={file}&line={line}&column={column}',
    useAbsolutePath: true
  },
  idea: {
    handler: 'idea://open?file={file}&line={line}',
    useAbsolutePath: true
  },
  sublime: {
    handler: 'subl://{file}:{line}:{column}',
    useAbsolutePath: true
  },
  atom: {
    handler: 'atom://open?url=file://{file}&line={line}&column={column}',
    useAbsolutePath: true
  },
  phpstorm: {
    handler: 'phpstorm://open?file={file}&line={line}',
    useAbsolutePath: true
  }
};

/**
 * Opens the source file in an editor at the specified location
 * @param location Source location
 * @param editorConfig Editor configuration or preset name
 */
export function openInEditor(
  location: SourceLocation,
  editorConfig: string | EditorConfig = 'vscode'
): void {
  if (typeof window === 'undefined') return;
  
  const { file, line, column } = location;
  
  // Get editor configuration
  const config: EditorConfig = typeof editorConfig === 'string' 
    ? EDITOR_HANDLERS[editorConfig] || EDITOR_HANDLERS.vscode
    : editorConfig;
  
  // Build the URL
  let url = config.handler;
  const filePath = config.useAbsolutePath !== false ? file : file;
  
  url = url.replace('{file}', encodeURIComponent(filePath));
  url = url.replace('{line}', line.toString());
  url = url.replace('{column}', column.toString());
  
  window.open(url, '_blank');
}

/**
 * React 19 compatible hook to get source location for a component
 */
export function useSourceLocation(): SourceLocation | null {
  if (typeof window === 'undefined') return null;
  
  // This would need React 19's useDebugValue or similar
  // For now, return null as a placeholder
  return null;
}

/**
 * Creates a click handler that opens the source location in the editor
 */
export function createSourceClickHandler(
  editorConfig: string | EditorConfig = 'vscode',
  attributeName: string = DEFAULT_ATTRIBUTE
) {
  return (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.currentTarget;
    const location = findNearestSourceLocation(element, attributeName);
    
    if (location) {
      openInEditor(location, editorConfig);
    }
  };
}

/**
 * Format location for display
 */
export function formatLocationForDisplay(
  element: Element | null,
  editorConfig: string | EditorConfig = 'vscode',
  attributeName: string = DEFAULT_ATTRIBUTE
): { location: SourceLocation | null; onClick: () => void } | null {
  if (!element) return null;
  
  const location = getElementSourceLocation(element, attributeName);
  if (!location) return null;
  
  return {
    location,
    onClick: () => openInEditor(location, editorConfig)
  };
}

/**
 * Get all elements with source location metadata in the document
 */
export function getAllElementsWithSource(
  attributeName: string = DEFAULT_ATTRIBUTE
): Array<{ element: Element; location: SourceLocation }> {
  if (typeof document === 'undefined') return [];
  
  const elements = document.querySelectorAll(`[${attributeName}]`);
  const results: Array<{ element: Element; location: SourceLocation }> = [];
  
  elements.forEach(element => {
    const location = getElementSourceLocation(element, attributeName);
    if (location) {
      results.push({ element, location });
    }
  });
  
  return results;
}

/**
 * Configuration for source highlighting
 */
export interface HighlightConfig {
  /**
   * Editor configuration or preset name
   * @default 'vscode'
   */
  editor?: string | EditorConfig;
  
  /**
   * Attribute name to look for
   * @default 'data-insp-path'
   */
  attributeName?: string;
  
  /**
   * Whether highlighting is enabled by default
   * @default false
   */
  enabledByDefault?: boolean;
  
  /**
   * How to display paths in tooltips: 'absolute' or 'relative'
   * @default 'absolute'
   */
  tooltipPathDisplay?: 'absolute' | 'relative';
  
  /**
   * Custom styles for highlighting
   */
  styles?: {
    outline?: string;
    outlineOffset?: string;
    tooltipBackground?: string;
    tooltipColor?: string;
  };
}

/**
 * Enables source highlighting with Shift+Z toggle and click-to-open
 */
export function enableSourceHighlighting(config: HighlightConfig = {}): () => void {
  if (typeof document === 'undefined') return () => {};
  
  // Merge loader config with user config (user config takes precedence)
  const loaderConfig = getGazeConfig();
  const mergedConfig = { ...loaderConfig, ...config };
  
  // Debug log to verify config is loaded
  if (process.env.NODE_ENV === 'development') {
    console.log('[Gaze] Loaded config from next.config.mjs:', loaderConfig);
    console.log('[Gaze] Merged config:', mergedConfig);
  }
  
  const {
    editor = 'vscode',
    attributeName = DEFAULT_ATTRIBUTE,
    enabledByDefault = false,
    tooltipPathDisplay = 'absolute',
    styles = {}
  } = mergedConfig;
  
  let isEnabled = enabledByDefault;
  let styleElement: HTMLStyleElement | null = null;
  let clickHandler: ((e: MouseEvent) => void) | null = null;
  
  // Default styles
  const defaultStyles = {
    outline: styles.outline || '2px solid #0066cc',
    outlineOffset: styles.outlineOffset || '2px',
    tooltipBackground: styles.tooltipBackground || 'rgba(0, 0, 0, 0.9)',
    tooltipColor: styles.tooltipColor || 'white'
  };
  
  // Helper to get display path
  const getDisplayPath = (fullPath: string): string => {
    if (tooltipPathDisplay === 'relative') {
      // Extract just the filename and line/column info
      const match = fullPath.match(/([^/\\]+:\d+:\d+)$/);
      if (match) {
        // Get the parent directory and filename
        const pathParts = fullPath.split(/[\/\\]/);
        if (pathParts.length >= 2) {
          const fileName = pathParts[pathParts.length - 1];
          const parentDir = pathParts[pathParts.length - 2];
          return `${parentDir}/${fileName}`;
        }
        return match[1];
      }
    }
    return fullPath;
  };

  // Process elements to add tooltip attributes
  const processElements = () => {
    const elements = document.querySelectorAll(`[${attributeName}]:not([data-tooltip-path])`);
    elements.forEach(element => {
      const fullPath = element.getAttribute(attributeName);
      if (fullPath) {
        element.setAttribute('data-tooltip-path', getDisplayPath(fullPath));
      }
    });
  };

  // Create styles
  const createStyles = () => {
    if (styleElement) return;
    
    styleElement = document.createElement('style');
    styleElement.id = 'turbopack-source-highlighting';
    styleElement.textContent = `
      .turbopack-source-highlight-enabled [${attributeName}] {
        position: relative;
        cursor: pointer;
        transition: outline 0.2s ease;
      }
      
      .turbopack-source-highlight-enabled [${attributeName}]:hover {
        outline: ${defaultStyles.outline};
        outline-offset: ${defaultStyles.outlineOffset};
      }
      
      .turbopack-source-highlight-enabled [${attributeName}]:hover::after {
        content: attr(data-tooltip-path);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: ${defaultStyles.tooltipBackground};
        color: ${defaultStyles.tooltipColor};
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-family: monospace;
        white-space: nowrap;
        z-index: 10000;
        pointer-events: none;
        margin-bottom: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
    `;
    
    document.head.appendChild(styleElement);
  };
  
  // Click handler
  clickHandler = (e: MouseEvent) => {
    if (!isEnabled) return;
    
    const target = e.target as Element;
    const location = findNearestSourceLocation(target, attributeName);
    
    if (location) {
      e.preventDefault();
      e.stopPropagation();
      openInEditor(location, editor);
    }
  };
  
  // Mutation observer to handle dynamically added elements
  let observer: MutationObserver | null = null;

  // Toggle highlighting
  const toggleHighlighting = () => {
    isEnabled = !isEnabled;
    
    if (isEnabled) {
      createStyles();
      processElements();
      document.body.classList.add('turbopack-source-highlight-enabled');
      document.addEventListener('click', clickHandler!, true);
      
      // Set up mutation observer
      observer = new MutationObserver(() => {
        processElements();
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [attributeName]
      });
    } else {
      document.body.classList.remove('turbopack-source-highlight-enabled');
      document.removeEventListener('click', clickHandler!, true);
      
      // Clean up observer
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }
  };
  
  // Keyboard handler for Shift+Z
  const keyboardHandler = (e: KeyboardEvent) => {
    if (e.shiftKey && e.key === 'Z') {
      e.preventDefault();
      toggleHighlighting();
    }
  };
  
  // Initialize
  document.addEventListener('keydown', keyboardHandler);
  if (enabledByDefault) {
    toggleHighlighting();
  }
  
  // Show instructions if configured
  if (mergedConfig.showInstructions !== false) {
    console.log('🔍 Press Shift+Z to toggle source highlighting');
    console.log('🖱️ Click any element while highlighting is on to open in editor');
    console.log(`📝 Editor: ${editor}`);
  }
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', keyboardHandler);
    if (clickHandler) {
      document.removeEventListener('click', clickHandler, true);
    }
    if (styleElement) {
      styleElement.remove();
    }
    if (observer) {
      observer.disconnect();
    }
    document.body.classList.remove('turbopack-source-highlight-enabled');
  };
}