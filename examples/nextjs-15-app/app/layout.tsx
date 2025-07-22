import type { ReactNode } from 'react';
import { GazeInitializer } from './gaze-initializer';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === 'development' && <GazeInitializer />}
      </body>
    </html>
  );
}