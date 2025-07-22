import type { LoaderContext } from 'webpack';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { validate } from 'schema-utils';
import { relative as pathRelative } from 'path';

interface LoaderOptions {
  /**
   * Whether to inject source locations in production builds
   * @default false
   */
  production?: boolean;
  
  /**
   * Custom attribute name for source location
   * @default 'data-insp-path'
   */
  attributeName?: string;
  
  /**
   * Whether to use relative paths from project root
   * @default false (uses absolute paths)
   */
  useRelativePaths?: boolean;
  
  /**
   * Custom root directory for relative paths
   * @default process.cwd()
   */
  rootDir?: string;
  
  /**
   * Whether to inject React's __source prop
   * @default false (to avoid conflicts with Turbopack)
   */
  injectReactSource?: boolean;
  
  /**
   * Auto-inject runtime configuration
   */
  runtime?: {
    /**
     * Enable runtime auto-injection
     * @default true
     */
    autoInject?: boolean;
    
    /**
     * Editor configuration
     * @default 'vscode'
     */
    editor?: string | { handler: string; useAbsolutePath?: boolean };
    
    /**
     * Start with highlighting enabled
     * @default false
     */
    enabledByDefault?: boolean;
    
    /**
     * Show instructions in console
     * @default true
     */
    showInstructions?: boolean;
    
    /**
     * How to display paths in tooltips
     * @default 'absolute'
     */
    tooltipPathDisplay?: 'absolute' | 'relative';
    
    /**
     * Custom styles
     */
    styles?: {
      outline?: string;
      outlineOffset?: string;
      tooltipBackground?: string;
      tooltipColor?: string;
    };
  };
}

const schema = {
  type: 'object',
  properties: {
    production: { type: 'boolean' },
    attributeName: { type: 'string' },
    useRelativePaths: { type: 'boolean' },
    rootDir: { type: 'string' },
    injectReactSource: { type: 'boolean' },
    runtime: {
      type: 'object',
      properties: {
        autoInject: { type: 'boolean' },
        editor: { 
          oneOf: [
            { type: 'string' },
            { 
              type: 'object',
              properties: {
                handler: { type: 'string' },
                useAbsolutePath: { type: 'boolean' }
              },
              required: ['handler']
            }
          ]
        },
        enabledByDefault: { type: 'boolean' },
        showInstructions: { type: 'boolean' },
        tooltipPathDisplay: { 
          type: 'string',
          enum: ['absolute', 'relative']
        },
        styles: {
          type: 'object',
          properties: {
            outline: { type: 'string' },
            outlineOffset: { type: 'string' },
            tooltipBackground: { type: 'string' },
            tooltipColor: { type: 'string' }
          }
        }
      }
    }
  },
  additionalProperties: false
};

/**
 * Turbopack-compatible webpack loader that injects source location metadata
 * into JSX elements for debugging purposes
 */
export default function turbopackSourceLoader(
  this: LoaderContext<LoaderOptions>,
  source: string
): string {
  // Get options from query or getOptions (for webpack 5)
  const rawOptions = this.getOptions ? this.getOptions() : this.query || {};
  const options: LoaderOptions = typeof rawOptions === 'string' ? {} : rawOptions;
  
  // Validate options
  validate(schema as any, options, {
    name: 'Gaze Loader',
    baseDataPath: 'options'
  });
  
  // Skip in production unless explicitly enabled
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !options.production) {
    return source;
  }
  
  // Get configuration with proper defaults
  const attributeName: string = typeof options.attributeName === 'string' ? options.attributeName : 'data-insp-path';
  const useRelativePaths: boolean = typeof options.useRelativePaths === 'boolean' ? options.useRelativePaths : false;
  const rootDir: string = typeof options.rootDir === 'string' ? options.rootDir : process.cwd();
  const injectReactSource: boolean = typeof options.injectReactSource === 'boolean' ? options.injectReactSource : false;
  
  const filename = this.resourcePath;
  
  try {
    // Parse the source code
    const ast = parse(source, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'throwExpressions',
        'logicalAssignment',
        'nullishCoalescingOperator',
        'optionalChaining',
        'dynamicImport',
        'topLevelAwait'
      ]
    });
    
    // Transform the AST
    traverse(ast, {
      JSXOpeningElement(path) {
        const { node } = path;
        
        if (!node.loc) return;
        
        const { line, column } = node.loc.start;
        
        // Format the file path
        let filePath = filename;
        if (useRelativePaths) {
          filePath = pathRelative(rootDir, filename);
        }
        
        // Create source location string
        const sourceLocation = `${filePath}:${line}:${column}`;
        
        // Check if attribute already exists
        const hasAttribute = node.attributes.some(
          attr => t.isJSXAttribute(attr) && 
          t.isJSXIdentifier(attr.name) && 
          attr.name.name === attributeName
        );
        
        if (!hasAttribute && sourceLocation) {
          // Add custom attribute
          const sourceAttr = t.jsxAttribute(
            t.jsxIdentifier(attributeName),
            t.stringLiteral(sourceLocation)
          ) as any;
          node.attributes.push(sourceAttr);
        }
        
        // Optionally add React's __source prop
        if (injectReactSource) {
          const hasReactSource = node.attributes.some(
            attr => t.isJSXAttribute(attr) && 
            t.isJSXIdentifier(attr.name) && 
            attr.name.name === '__source'
          );
          
          if (!hasReactSource) {
            const reactSourceAttr = t.jsxAttribute(
              t.jsxIdentifier('__source'),
              t.jsxExpressionContainer(
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('fileName'),
                    t.stringLiteral(filePath)
                  ),
                  t.objectProperty(
                    t.identifier('lineNumber'),
                    t.numericLiteral(line)
                  ),
                  t.objectProperty(
                    t.identifier('columnNumber'),
                    t.numericLiteral(column)
                  )
                ])
              )
            ) as any;
            node.attributes.push(reactSourceAttr);
          }
        }
      }
    });
    
    // Generate the transformed code
    let { code } = generate(ast, {
      sourceMaps: true,
      sourceFileName: filename,
      retainLines: true,
      compact: false
    });
    
    // Auto-inject runtime if enabled
    const runtime = options.runtime;
    const autoInject = runtime?.autoInject !== false; // Default to true
    
    // For any file, inject the config setup (after 'use client' if present)
    if (!isProduction && runtime) {
      const configScript = `
if (typeof window !== 'undefined' && !window.__GAZE_LOADER_CONFIG__) {
  window.__GAZE_LOADER_CONFIG__ = ${JSON.stringify({
    editor: runtime.editor || 'vscode',
    enabledByDefault: runtime.enabledByDefault || false,
    tooltipPathDisplay: runtime.tooltipPathDisplay || 'absolute',
    showInstructions: runtime.showInstructions !== false,
    styles: runtime.styles || {}
  })};
}
`;
      
      // Check if the file has 'use client' directive
      const useClientMatch = code.match(/^(\s*['"]use client['"];?\s*\n)/);
      if (useClientMatch) {
        // Insert after 'use client'
        code = useClientMatch[0] + configScript + code.slice(useClientMatch[0].length);
      } else {
        // Insert at the beginning
        code = configScript + code;
      }
    }
    
    return code;
  } catch (error) {
    // Log error but don't fail the build
    console.error(`[gaze] Error processing ${filename}:`, error);
    return source;
  }
}

// Export the loader function
module.exports = turbopackSourceLoader;
module.exports.default = turbopackSourceLoader;