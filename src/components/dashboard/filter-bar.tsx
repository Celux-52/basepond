'use client';

import { Trophy, Zap, Bot, Unlock, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FILTERS = [
  { id: 'PREMIUM', label: 'Premium Leads', icon: Trophy, activeColor: 'text-amber-500 bg-amber-50 border-amber-200' },
  { id: 'URGENT', label: 'Acil Fırsatlar', icon: Zap, activeColor: 'text-rose-500 bg-rose-50 border-rose-200' },
  { id: 'AI_RECOMMENDATIONS', label: 'AI Tavsiyeleri', icon: Bot, activeColor: 'text-blue-500 bg-blue-50 border-blue-200' },
  { id: 'UNLOCKED', label: 'Kilidi Açılanlar', icon: Unlock, activeColor: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
];

interface Sector {
  name: string;
  count: number;
}

export function FilterBar({ 
  activeFilter, 
  onFilterChange,
  sectors = [] 
}: { 
  activeFilter: string; 
  onFilterChange: (id: string) => void;
  sectors?: Sector[];
}) {
  const [showSectors, setShowSectors] = useState(false);

  return (
    <div className="flex flex-col border-b border-border bg-card text-card-foreground sticky top-0 z-10">
      <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide">
        {FILTERS.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => {
                onFilterChange(filter.id);
                setShowSectors(false);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 border whitespace-nowrap
                ${isActive ? filter.activeColor : 'text-muted-foreground bg-card text-card-foreground border-border hover:bg-muted'}
              `}
            >
              <Icon className="w-4 h-4" />
              {filter.label}
            </button>
          );
        })}
        
        {/* Sector Toggle Button */}
        <button
          onClick={() => setShowSectors(!showSectors)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 border whitespace-nowrap
            ${activeFilter.startsWith('SECTOR_') || showSectors 
              ? 'text-purple-600 bg-purple-50 border-purple-200' 
              : 'text-muted-foreground bg-card text-card-foreground border-border hover:bg-muted'}
          `}
        >
          🎯 Sektörler
          <ChevronDown className={`w-4 h-4 transition-transform ${showSectors ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Sectors Sub-menu */}
      {showSectors && sectors.length > 0 && (
        <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide animate-in slide-in-from-top-2 duration-200">
          <div className="w-px h-8 bg-neutral-200 mx-2 hidden md:block"></div>
          {sectors.map((sector) => {
            const filterId = `SECTOR_${sector.name}`;
            const isActive = activeFilter === filterId;
            return (
              <button
                key={sector.name}
                onClick={() => onFilterChange(filterId)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap
                  ${isActive 
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm' 
                    : 'bg-card text-card-foreground text-foreground border-border hover:border-purple-300 hover:bg-purple-50'}
                `}
              >
                {sector.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
