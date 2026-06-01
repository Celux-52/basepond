"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const t = useTranslations("Pricing");

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">SnapLead Pricing</h2>
          <p className="text-xl text-muted-foreground">İhtiyacınıza uygun planı seçin.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          {/* Starter */}
          <div className="p-8 rounded-2xl border border-border/50 bg-card flex flex-col hover:border-primary/30 transition-all">
            <h3 className="text-2xl font-bold mb-2">Starter</h3>
            <p className="text-sm text-muted-foreground mb-4">Küçük ajanslar, freelancerlar ve bireysel kullanıcılar için.</p>
            <div className="mt-2 mb-6"><span className="text-4xl font-extrabold">$19</span><span className="text-muted-foreground"> / ay</span></div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>500 Business Scan</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Temel İşletme Analizi</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Fırsat Skoru</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>SEO ve Dijital Görünürlük Analizi</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>CSV Export</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Temel Filtreleme</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Cache Destekli Hızlı Sonuçlar</span></li>
            </ul>
            <Button variant="outline" className="w-full" onClick={() => alert("Stripe ödeme altyapısı şirket kurulumu tamamlandığında aktif edilecektir. İlginiz için teşekkürler!")}>Hemen Başla</Button>
          </div>

          {/* Growth */}
          <div className="p-8 rounded-2xl border-2 border-primary bg-primary/5 flex flex-col relative shadow-xl shadow-primary/10 scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide">
              Önerilen
            </div>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">Growth</h3>
            <p className="text-sm text-muted-foreground mb-4">Daha fazla işletme keşfetmek isteyen ajanslar ve satış ekipleri için.</p>
            <div className="mt-2 mb-6"><span className="text-4xl font-extrabold">$49</span><span className="text-muted-foreground"> / ay</span></div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span className="font-medium">2000 Business Scan</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Gelişmiş Fırsat Analizi</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Premium İşletme Verileri</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Sosyal Medya Analizi</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Gelişmiş Filtreleme</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Excel Export</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Öncelikli Tarama Hızı</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Güçlü Opportunity Scoring</span></li>
            </ul>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => alert("Stripe ödeme altyapısı şirket kurulumu tamamlandığında aktif edilecektir. İlginiz için teşekkürler!")}>Growth Planı Seç</Button>
          </div>

          {/* Pro */}
          <div className="p-8 rounded-2xl border border-border/50 bg-card flex flex-col hover:border-primary/30 transition-all">
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-sm text-muted-foreground mb-4">Yoğun veri kullanan profesyonel ekipler için.</p>
            <div className="mt-2 mb-6"><span className="text-4xl font-extrabold">$99</span><span className="text-muted-foreground"> / ay</span></div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>5000+ Business Scan</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Tam Opportunity Intelligence Engine</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Premium İşletme Verileri</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Gelişmiş Yapay Zeka Analizi</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Bulk Export</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>API Access</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Öncelikli İşlem Gücü</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary flex-shrink-0" /> <span>Enterprise Hız ve Performans</span></li>
            </ul>
            <Button variant="outline" className="w-full" onClick={() => alert("Enterprise planı için detaylı iletişim formu şirket kurulumu tamamlandığında aktif edilecektir. İlginiz için teşekkürler!")}>Enterprise İletişim</Button>
          </div>
        </div>
        
        {/* SnapLead Ne Satar Section */}
        <div className="mt-20 max-w-4xl mx-auto text-center border-t border-border/50 pt-16">
          <h2 className="text-3xl font-extrabold mb-8">SnapLead Ne Satar?</h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="p-6 bg-card border border-border/50 rounded-xl">
              <p className="text-xl font-medium text-muted-foreground mb-4">SnapLead <span className="line-through text-rose-500">sadece işletme datası satmaz.</span></p>
              <p className="text-2xl font-bold text-foreground">SnapLead, AI destekli satış fırsatları sunar.</p>
              <p className="mt-6 text-muted-foreground italic text-lg border-l-4 border-primary pl-4">
                Amaç: “Hangi işletmeden iş çıkar?” sorusunu cevaplamak.
              </p>
            </div>
            <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
              <h4 className="font-bold text-lg mb-4 text-foreground">Sistem Nasıl Çalışır:</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> <span>İşletmeleri analiz eder</span></li>
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> <span>Dijital zayıflıkları bulur</span></li>
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> <span>Fırsat skorları oluşturur</span></li>
                <li className="flex items-center gap-3"><Check className="h-5 w-5 text-emerald-500" /> <span>Satış potansiyelini keşfeder</span></li>
              </ul>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
