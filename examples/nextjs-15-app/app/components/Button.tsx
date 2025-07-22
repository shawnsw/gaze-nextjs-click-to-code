'use client';

import { createSourceClickHandler } from 'gaze/runtime';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ children, onClick }: ButtonProps) {
  const handleSourceClick = createSourceClickHandler('vscode');
  
  return (
    <button
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey) {
          // Cmd/Ctrl + Click opens in editor
          handleSourceClick(e);
        } else {
          onClick?.();
        }
      }}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        background: '#0066cc',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#0052a3';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#0066cc';
      }}
    >
      {children}
    </button>
  );
}