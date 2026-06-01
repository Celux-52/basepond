import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AlertTriangle } from 'lucide-react';

export default async function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mb-6">
        <AlertTriangle className="w-12 h-12 text-muted-foreground" />
      </div>
      <h1 className="text-5xl font-black text-foreground mb-3">404</h1>
      <p className="text-xl font-semibold text-foreground mb-2">Sayfa Bulunamadı</p>
      <p className="text-muted-foreground max-w-sm mb-8">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link 
        href="/dashboard" 
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-xl font-bold transition-colors"
      >
        Dashboard'a Dön
      </Link>
    </div>
  );
}
