# 👁️ Gaze

Click-to-code for Next.js. See exactly where your React components live and jump to their source with a single click.

Press `Shift+Z` to see through your UI. Click any element to instantly open it in your editor. No more hunting through files.

## Features

- 🚀 **Turbopack Compatible** - Works seamlessly with Next.js 15's Turbopack
- ⚛️ **React 19 Support** - Full compatibility with React 19 features
- 📍 **Source Location Injection** - Adds `data-insp-path` attributes in format `/absolute/path/file.tsx:line:column`
- 🛠️ **Developer Tools** - Runtime utilities for source navigation
- 🎯 **Click-to-Code** - Open source files directly in your editor
- 🔧 **Configurable** - Flexible options for different use cases
- 🏃 **Zero Runtime Overhead** - Attributes only added in development

## Installation

### From npm (when published)
```bash
npm install --save-dev gaze
# or
yarn add -D gaze
# or
pnpm add -D gaze
```

### From GitHub
```bash
pnpm add -D github:your-username/gaze
```

### For local development
```json
// In your package.json
{
  "devDependencies": {
    "gaze": "file:../path/to/gaze"
  }
}
```

## Usage with Next.js 15

### 🚀 Minimal Config

Configure once in `next.config.mjs`, and the settings are automatically applied:

```javascript
// next.config.mjs
const nextConfig = {
  turbopack: {
    rules: {
      '*.{jsx,tsx}': {
        loaders: [
          {
            loader: 'gaze',
            options: {
              runtime: {
                editor: 'vscode',        // Your editor: 'vscode' | 'cursor' | 'webstorm' | etc.
                tooltipPathDisplay: 'relative' // Show short paths in tooltips (optional)
              }
            }
          }
        ]
      }
    }
  }
};

export default nextConfig;
```

```javascript
// app/layout.tsx (Server Component - recommended approach)
import { GazeInitializer } from './gaze-initializer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && <GazeInitializer />}
      </body>
    </html>
  );
}

// app/gaze-initializer.tsx (Client Component - isolated from layout)
'use client';

import { useEffect } from 'react';
import { enableSourceHighlighting } from 'gaze/runtime';

export function GazeInitializer() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const cleanup = enableSourceHighlighting({});
      return cleanup;
    }
  }, []);

  return null;
}

// Alternative: All-in-one client-side approach
// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { enableSourceHighlighting } from 'gaze/runtime';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const cleanup = enableSourceHighlighting({}); // Uses config from next.config.mjs
      return cleanup;
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Done!** Press `Shift+Z` to toggle, click any element to open in your editor.

> **Note:** The `enableSourceHighlighting({})` function automatically uses the configuration from your `next.config.mjs`. You can pass additional options to override specific settings if needed.

### 🎨 Full Configuration

All available options with examples:

```javascript
const nextConfig = {
  turbopack: {
    rules: {
      '*.{jsx,tsx}': {
        loaders: [
          {
            loader: 'gaze',
            options: {
              // Core Options
              production: false,                    // Enable in production (default: false)
              attributeName: 'data-insp-path',      // HTML attribute name (default: 'data-insp-path')
              useRelativePaths: false,              // Use relative paths (default: false - absolute paths)
              rootDir: process.cwd(),               // Root for relative paths
              injectReactSource: false,             // Add React __source (default: false for Turbopack)
              
              // Runtime Configuration - these settings are passed to enableSourceHighlighting()
              runtime: {
                autoInject: false,                // Must be false for Next.js App Router
                editor: 'cursor',                 // Editor preset: 'vscode' | 'cursor' | 'webstorm' | etc.
                tooltipPathDisplay: 'relative',   // Show relative paths in tooltips
                enabledByDefault: false,          // Start with highlighting off
                showInstructions: true,           // Show console instructions
                styles: {
                  outline: '2px solid #0066cc',
                  outlineOffset: '2px'
                }
              }
            }
          }
        ]
      }
    }
  }
};

export default nextConfig;
```

### Webpack Fallback Configuration

For projects not yet using Turbopack:

```javascript
module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        use: ['gaze']
      });
    }
    return config;
  }
};
```

## Runtime Usage

### Basic Example

```tsx
import { useEffect } from 'react';
import { enableSourceHighlighting } from 'gaze/runtime';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Enable source highlighting in development
    if (process.env.NODE_ENV === 'development') {
      const cleanup = enableSourceHighlighting();
      return cleanup;
    }
  }, []);

  return <Component {...pageProps} />;
}
```

### Click-to-Open Component

```tsx
import { createSourceClickHandler } from 'gaze/runtime';

export function DebugButton({ children }) {
  const handleSourceClick = createSourceClickHandler('vscode');
  
  return (
    <button
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) {
          handleSourceClick(e);
        }
      }}
    >
      {children}
    </button>
  );
}
```

### Keyboard Shortcut Integration

```tsx
'use client';

import { useEffect } from 'react';
import { enableSourceHighlighting } from 'gaze/runtime';

export default function Layout({ children }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const cleanup = enableSourceHighlighting({
        editor: 'vscode', // or 'cursor', 'webstorm', etc.
        enabledByDefault: false
      });
      
      return cleanup;
    }
  }, []);

  return children;
}
```

**Usage:**
- Press `Shift+Z` to toggle source highlighting
- Click any highlighted element to open in your editor

### Editor Configuration

```tsx
// Built-in editor presets
enableSourceHighlighting({ editor: 'vscode' });    // VS Code
enableSourceHighlighting({ editor: 'cursor' });    // Cursor
enableSourceHighlighting({ editor: 'webstorm' });  // WebStorm
enableSourceHighlighting({ editor: 'sublime' });   // Sublime Text

// Custom editor configuration
enableSourceHighlighting({
  editor: {
    handler: 'myeditor://open?file={file}&line={line}',
    useAbsolutePath: true
  }
});

// Full configuration example
enableSourceHighlighting({
  editor: 'cursor',
  enabledByDefault: true,              // Start with highlighting on
  attributeName: 'data-insp-path',     // Custom attribute name
  styles: {
    outline: '3px solid #00ff00',      // Green outline
    outlineOffset: '4px',
    tooltipBackground: 'rgba(0, 255, 0, 0.9)',
    tooltipColor: 'white'
  }
});
```

### Tooltip Path Display

Control how file paths appear in hover tooltips while keeping full paths for editor integration:

```javascript
// Show relative paths in tooltips (cleaner UI)
enableSourceHighlighting({
  tooltipPathDisplay: 'relative'  // Shows: "app/page.tsx:10:5"
});

// Show absolute paths in tooltips (default)
enableSourceHighlighting({
  tooltipPathDisplay: 'absolute'  // Shows: "/Users/name/project/app/page.tsx:10:5"
});
```

**Note:** Regardless of the tooltip display setting, clicking always uses the full absolute path to ensure your editor can properly open the file.

## API Reference

### Loader Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `production` | `boolean` | `false` | Enable in production builds |
| `attributeName` | `string` | `'data-insp-path'` | HTML attribute name |
| `useRelativePaths` | `boolean` | `false` | Use relative paths (false = absolute paths) |
| `rootDir` | `string` | `process.cwd()` | Root directory for paths |
| `injectReactSource` | `boolean` | `false` | Add React `__source` prop (disabled by default to avoid Turbopack conflicts) |

### Runtime Functions

#### `parseSourceLocation(sourceString: string): SourceLocation | null`
Parse a source location string.

#### `getElementSourceLocation(element: Element): SourceLocation | null`
Get source location from a DOM element.

#### `findNearestSourceLocation(element: Element): SourceLocation | null`
Find source location in element or ancestors.

#### `openInEditor(location: SourceLocation, editor?: string): void`
Open source file in editor. Supports: `vscode`, `cursor`, `webstorm`, `fleet`.

#### `enableSourceHighlighting(config?: HighlightConfig): () => void`
Enable source highlighting with Shift+Z toggle. Returns cleanup function.

When called with an empty object `{}`, it automatically uses the configuration from your `next.config.mjs` runtime options. Any config passed directly will override the loader config.

Config options:
- `editor`: Editor preset name or custom config
- `enabledByDefault`: Start with highlighting on
- `tooltipPathDisplay`: How to display paths in tooltips ('absolute' | 'relative')
- `attributeName`: Attribute to look for
- `styles`: Custom highlight styles

#### `createSourceClickHandler(editor?: string): MouseEventHandler`
Create click handler for opening source in editor.

#### `getAllElementsWithSource(): Array<{element, location}>`
Get all elements with source location metadata.

## How It Works

1. **Build Time**: The loader parses JSX/TSX files using Babel
2. **AST Transform**: Injects attributes into JSX opening elements
3. **Configuration**: Runtime config from `next.config.mjs` is injected into your code
4. **Runtime**: When you call `enableSourceHighlighting({})`, it automatically uses the injected config
5. **Output**: Transformed code with source location metadata and configuration

### Example Output

Input:
```tsx
// components/Button.tsx - Line 5
function Button({ children }) {
  return (
    <button className="btn">
      {children}
    </button>
  );
}
```

Output HTML:
```html
<button 
  class="btn" 
  data-insp-path="/Users/username/project/components/Button.tsx:3:5"
>
  Click me
</button>
```

## Next.js 15 & React 19 Features

### Server Components
Source locations are injected for both Server and Client components:

```tsx
// Server Component
export default async function Page() {
  return <div>Server rendered with source location</div>;
}

// Client Component
'use client';
export function ClientComponent() {
  return <div>Client rendered with source location</div>;
}
```

### App Router
Full support for Next.js 15 App Router:

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        {process.env.NODE_ENV === 'development' && <DevSourceToolbar />}
      </body>
    </html>
  );
}
```

## Performance Considerations

- **Development Only**: By default, disabled in production
- **Build Time**: Minimal impact on build performance
- **Runtime**: No overhead when disabled
- **Bundle Size**: Attributes stripped in production builds

## Troubleshooting

### Loader Not Working
1. Ensure the loader is installed: `npm ls gaze`
2. Check file extensions match the rule pattern
3. Verify Turbopack is enabled in Next.js
4. Clear `.next` cache and rebuild

### Source Locations Missing
1. Check browser DevTools for `data-source-location` attributes
2. Ensure you're in development mode
3. Verify the loader is in your config
4. Check for conflicting loaders

### Editor Integration Issues
1. Ensure your editor protocol handler is installed
2. Check the editor is running
3. Try different editor options
4. Verify file paths are correct

### Duplicate __source Error
If you get a "Duplicate __source is found" error with Next.js 15 and Turbopack:
1. Set `injectReactSource: false` in the loader options
2. Turbopack already includes React's development transforms
3. Our loader should only inject the `data-insp-path` attribute

### Module Resolution Errors (.tsx.tsx)
If you see errors like "Can't resolve './Component.tsx.tsx'":
1. Remove the `as: '*.tsx'` option from your Turbopack configuration
2. Let Turbopack preserve the original file extensions
3. The loader outputs valid JSX/TSX that Turbopack can process

### Runtime Import Errors
If you get "Module not found: Can't resolve 'gaze/runtime'":
1. Ensure the package is properly installed with `pnpm install`
2. The package.json must have proper `exports` field configuration
3. For local development, use `file:` protocol in package.json dependencies
4. Try importing from the absolute path if subpath exports aren't working

## Compatibility

- ✅ Next.js 15+
- ✅ React 19
- ✅ Turbopack
- ✅ TypeScript
- ✅ JavaScript
- ✅ Server Components
- ✅ Client Components
- ✅ App Router
- ✅ Pages Router

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT