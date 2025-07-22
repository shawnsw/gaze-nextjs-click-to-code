'use client';

import { useEffect } from 'react';
import { enableSourceHighlighting } from 'gaze/runtime';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const cleanup = enableSourceHighlighting({});
      return cleanup;
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}