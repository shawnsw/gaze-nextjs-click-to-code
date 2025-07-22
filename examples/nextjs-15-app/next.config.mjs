/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    rules: {
      '*.{jsx,tsx}': {
        loaders: [
          {
            loader: 'gaze',
            options: {
              // Loader options
              production: false,
              injectReactSource: false,
              
              // Runtime configuration - no layout changes needed!
              runtime: {
                autoInject: false,       // Manual setup required for Next.js App Router
                editor: 'cursor',        // Your editor: 'vscode', 'cursor', 'webstorm', etc.
                enabledByDefault: false, // Start with highlighting off
                showInstructions: true,  // Show console instructions
                tooltipPathDisplay: 'relative', // Show relative paths in tooltips
                
                // Custom editor example:
                // editor: {
                //   handler: 'myeditor://open?file={file}&line={line}',
                //   useAbsolutePath: true
                // },
                
                // Custom styles (optional)
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