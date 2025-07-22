'use client';

import { useState } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';

export default function HomePage() {
  const [count, setCount] = useState(0);

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Turbopack Source Location Demo</h1>
      
      <Card>
        <h2>Instructions</h2>
        <p>
          This demo shows how source location metadata is injected into React components
          using Turbopack and Next.js 15.
        </p>
        <ul>
          <li>Hover over any element to see its source location</li>
          <li>Cmd/Ctrl + Click to open in your editor</li>
          <li>Use the dev toolbar to toggle highlighting</li>
        </ul>
      </Card>

      <Card>
        <h2>Interactive Counter</h2>
        <p>Count: {count}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={() => setCount(count + 1)}>
            Increment
          </Button>
          <Button onClick={() => setCount(count - 1)}>
            Decrement
          </Button>
          <Button onClick={() => setCount(0)}>
            Reset
          </Button>
        </div>
      </Card>

      <Card>
        <h2>Nested Components</h2>
        <NestedExample />
      </Card>
    </main>
  );
}

function NestedExample() {
  return (
    <div>
      <p>This is a nested component.</p>
      <DeeplyNested />
    </div>
  );
}

function DeeplyNested() {
  return (
    <div style={{ padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
      <p>Even deeply nested components have source locations!</p>
    </div>
  );
}