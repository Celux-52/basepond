"use client";

import { useTranslations } from "next-intl";
import { Check, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PricingSection() {
  const t = useTranslations("Pricing");

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 text-foreground">
            Sıradan Data Değil, <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">Premium İstihbarat.</span>
          </h2>
          <p className="text-xl text-muted-foreground">Gerçek fırsatları keşfedin. Yapay zeka ile analiz edilmiş işletme dataları ile satışlarınızı katlayın.</p>
        </div>

        <div className="max-w-md mx-auto mb-16">
          {/* Single Premium Plan */}
          <div className="p-8 rounded-2xl border-2 border-primary bg-primary/5 flex flex-col relative shadow-2xl shadow-primary/20 scale-105 transition-transform hover:-translate-y-2">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-6 py-1.5 text-xs font-bold rounded-full uppercase tracking-wide shadow-md">
              Sadece Tek Paket
            </div>
            <h3 className="text-3xl font-black mb-2 flex items-center justify-center gap-2 mt-4">
              <Star className="w-8 h-8 text-primary" /> Basepound Growth
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">Sınırları aşın, tüm özellikleri kilitsiz kullanın.</p>
            <div className="mt-2 mb-6 text-center"><span className="text-5xl font-extrabold text-foreground">$49.99</span><span className="text-xl font-medium text-muted-foreground"> / ay</span></div>
            <ul className="space-y-4 mb-8 flex-1 px-4">
              <li className="flex gap-3 items-center"><Check className="h-6 w-6 text-emerald-500 flex-shrink-0" /> <span className="font-semibold text-primary text-lg">Aylık 3000 Tarama (Scan)</span></li>
              <li className="flex gap-3 items-center"><Check className="h-6 w-6 text-emerald-500 flex-shrink-0" /> <span className="text-lg">Gelişmiş Fırsat Analizi</span></li>
              <li className="flex gap-3 items-center"><Check className="h-6 w-6 text-emerald-500 flex-shrink-0" /> <span className="text-lg">Rakip Fırsatı Gasp Etme (Steal)</span></li>
              <li className="flex gap-3 items-center"><Check className="h-6 w-6 text-emerald-500 flex-shrink-0" /> <span className="text-lg">AI Destekli Satış Metinleri</span></li>
              <li className="flex gap-3 items-center"><Check className="h-6 w-6 text-emerald-500 flex-shrink-0" /> <span className="text-lg">Öncelikli API Hızı (Limitsiz)</span></li>
            </ul>
            <Link href="/tr/register" className="w-full">
              <Button className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl">
                Hemen Başla <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Basepound Ne Satar Section */}
        <div className="max-w-4xl mx-auto text-center border-t border-border/50 pt-16">
          <h2 className="text-3xl font-extrabold mb-8">Basepound Ne Satar?</h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="p-6 bg-card border border-border/50 rounded-xl">
              <p className="text-xl font-medium text-muted-foreground mb-4">Basepound <span className="line-through text-rose-500">sadece işletme datası satmaz.</span></p>
              <p className="text-2xl font-bold text-foreground">Basepound, AI destekli satış fırsatları sunar.</p>
              <p className="mt-6 text-muted-foreground italic text-lg border-l-4 border-primary pl-4">
                Amaç: “Hangi işletmeden iş çıkar?” sorusunu cevaplamak.
              </p>
            </div>
            <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
              <h4 className="font-bold text-lg mb-4 text-foreground">Sistem Nasıl Çalışır:</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> <span className="text-lg">İşletmeleri analiz eder</span></li>
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> <span className="text-lg">Dijital zayıflıkları bulur</span></li>
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> <span className="text-lg">Fırsat skorları oluşturur</span></li>
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> <span className="text-lg">Satış potansiyelini keşfeder</span></li>
              </ul>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
