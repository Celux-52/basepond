'use client';

import { Star, Plus } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export function CreditIndicator({ balance, isAdmin = false }: { balance: number; isAdmin?: boolean }) {
  const locale = useLocale();
  const formattedBalance = new Intl.NumberFormat('tr-TR').format(balance);
  const isLow = balance < 10;

  const indicator = (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-md border transition-all
      ${isLow 
        ? 'bg-red-950 border-red-800 hover:border-red-600 cursor-pointer' 
        : 'bg-neutral-900 border-neutral-800 text-white'
      }`}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isLow ? 'bg-red-500/20' : 'bg-amber-400/20'}`}>
        <Star className={`w-4 h-4 ${isLow ? 'text-red-400' : 'text-amber-400'}`} />
      </div>
      <div className="flex flex-col pr-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isLow ? 'text-red-400' : 'text-neutral-400'}`}>
          {isLow ? '⚠ Kredi Azaldı' : 'Premium Paket'}
        </span>
        <span className={`text-sm font-black ${isLow ? 'text-red-300' : 'text-white'}`}>
          {formattedBalance} Kredi
        </span>
      </div>
      {isLow && !isAdmin && (
        <div className="flex items-center justify-center w-7 h-7 bg-red-500 rounded-lg ml-1">
          <Plus className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );

  // Normal users with low balance → redirect to pricing
  if (isLow && !isAdmin) {
    return (
      <Link href={`/${locale}/pricing`} title="Kredi satın al">
        {indicator}
      </Link>
    );
  }

  return indicator;
}
