'use client';

import { useState, useEffect } from 'react';

export function GlobalCreditDisplay({ initialCredits }: { initialCredits: number }) {
  const [credits, setCredits] = useState(initialCredits);

  useEffect(() => {
    // Listen for custom events from dashboard
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (customEvent.detail) {
        setCredits(prev => Math.max(0, prev + customEvent.detail));
      }
    };

    window.addEventListener('update-credits', handleUpdate);
    return () => window.removeEventListener('update-credits', handleUpdate);
  }, []);

  // Sync with initialCredits if it changes via server action / router refresh
  useEffect(() => {
    setCredits(initialCredits);
  }, [initialCredits]);

  return (
    <span className="text-amber-500 font-bold">⭐ {credits}</span>
  );
}
