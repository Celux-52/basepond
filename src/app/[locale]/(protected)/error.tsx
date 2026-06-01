'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { XCircle, RefreshCw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Basepound Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 rounded-3xl bg-destructive/10 flex items-center justify-center mb-6">
        <XCircle className="w-12 h-12 text-destructive" />
      </div>
      <h1 className="text-3xl font-black text-foreground mb-3">Bir Hata Oluştu</h1>
      <p className="text-muted-foreground max-w-sm mb-2">
        Beklenmeyen bir hatayla karşılaşıldı. Lütfen tekrar deneyin.
      </p>
      {error.digest && (
        <p className="text-xs font-mono text-muted-foreground/60 mb-8">Hata Kodu: {error.digest}</p>
      )}
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Tekrar Dene
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 bg-muted text-foreground hover:bg-muted/80 px-6 py-3 rounded-xl font-bold transition-colors border border-border"
        >
          Dashboard'a Dön
        </Link>
      </div>
    </div>
  );
}
