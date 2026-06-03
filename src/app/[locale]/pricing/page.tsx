'use client';

import { useState } from "react";
import { CheckCircle2, Zap, Rocket, Star, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from '@/lib/supabase/client';
import { useEffect } from "react";

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('has_purchased').eq('id', user.id).single();
        if (data && data.has_purchased) {
          setHasPurchased(true);
        }
      }
      setIsChecking(false);
    };
    checkPurchaseStatus();
  }, []);

  const handleBuyCredits = async (amount: number, planName: string) => {
    setLoadingPlan(planName);
    try {
      const res = await fetch('/api/credits/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, planName })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'İşlem başarısız');
      
      toast.success(`✅ ${planName} başarıyla tanımlandı! Hesabınıza ${amount} kredi eklendi.`);
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 1500);
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Abonelik & Kontör (Top-up)</h2>
        <p className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
          Sıradan Data Değil, <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">Premium İstihbarat.</span>
        </p>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
          Gerçek fırsatları keşfedin. Yapay zeka ile analiz edilmiş işletme dataları ile satışlarınızı katlayın.
        </p>
      </div>

      <div className="mt-16 max-w-md mx-auto flex justify-center">
        {/* Single Premium Plan */}
        <Card className="flex flex-col justify-between border-primary bg-primary/5 shadow-2xl shadow-primary/20 relative transform w-full max-w-lg transition-all duration-300 hover:shadow-primary/40 hover:-translate-y-2 border-2">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 bg-primary text-primary-foreground text-xs font-bold px-6 py-1.5 rounded-full uppercase tracking-wider shadow-md">
            Sadece Tek Paket
          </div>
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-3xl font-black flex items-center justify-center gap-2">
              <Star className="w-8 h-8 text-primary" /> Basepound Growth
            </CardTitle>
            <CardDescription className="text-base mt-2">Sınırları aşın, tüm özellikleri kilitsiz kullanın.</CardDescription>
            <div className="mt-6 flex items-baseline justify-center text-6xl font-extrabold text-foreground">
              $49.99
              <span className="ml-2 text-2xl font-medium text-muted-foreground">/ ay</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 px-8">
            <ul className="space-y-4 text-lg">
              <li className="flex gap-3 items-center"><CheckCircle2 className="flex-shrink-0 h-6 w-6 text-emerald-500" /> <span className="font-semibold text-primary">Aylık 3000 Tarama (Scan)</span></li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="flex-shrink-0 h-6 w-6 text-emerald-500" /> <span className="font-medium">Gelişmiş Fırsat Analizi</span></li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="flex-shrink-0 h-6 w-6 text-emerald-500" /> <span className="font-medium">Rakip Fırsatı Gasp Etme (Steal)</span></li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="flex-shrink-0 h-6 w-6 text-emerald-500" /> <span className="font-medium">AI Destekli Satış Metinleri</span></li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="flex-shrink-0 h-6 w-6 text-emerald-500" /> <span className="font-medium">Öncelikli API Hızı (Limitsiz)</span></li>
            </ul>
            <div className="mt-8 pt-8 border-t border-primary/20 text-center">
              <p className="text-sm font-semibold mb-2 text-foreground">Büyümenizi Hızlandırın</p>
              <p className="text-sm text-muted-foreground">İptal edene kadar her ay yenilenir.</p>
            </div>
          </CardContent>
          <CardFooter className="pb-8 px-8">
            <Button 
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl"
              onClick={() => handleBuyCredits(3000, 'Basepound Growth')}
              disabled={loadingPlan === 'Basepound Growth'}
            >
              {loadingPlan === 'Basepound Growth' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Growth Planını Başlat
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Pay-As-You-Go Section */}
      <div className="mt-16 max-w-3xl mx-auto bg-muted/40 border border-border rounded-2xl p-8 lg:flex lg:items-center lg:justify-between shadow-sm">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Cephane Doldur (Top-up)</h3>
          <p className="mt-2 text-muted-foreground max-w-md">
            Limitiniz mi bitti? Hiç sorun değil. Aylık planınız devam ettiği sürece dilediğiniz an ek kredi yükleyebilirsiniz.
          </p>
          {!hasPurchased && !isChecking && (
            <p className="mt-3 text-sm font-semibold text-rose-500 bg-rose-500/10 inline-block px-3 py-1 rounded-md">
              Bu işlem için aktif aylık paket gereklidir.
            </p>
          )}
        </div>
        <div className="mt-6 lg:mt-0 lg:ml-8 flex-shrink-0 min-w-[250px]">
          <div className="bg-background border border-border/80 rounded-xl p-6 text-center shadow-md">
            <span className="block text-sm font-bold text-primary uppercase tracking-wide">+1000 Kredi</span>
            <span className="mt-2 block text-4xl font-extrabold text-foreground">$15</span>
            <Button 
              className="mt-6 w-full flex items-center justify-center gap-2 h-12 font-medium" 
              variant={hasPurchased ? "default" : "secondary"}
              onClick={() => handleBuyCredits(1000, 'Top-up')}
              disabled={loadingPlan === 'Top-up' || (!hasPurchased && !isChecking)}
            >
              {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : 
               loadingPlan === 'Top-up' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
               !hasPurchased ? "Aktif Paket Gerekli" :
               <>Cephane Doldur <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </div>
        </div>
      </div>

      {/* Basepound Ne Satar Section */}
      <div className="mt-24 max-w-5xl mx-auto text-center border-t border-border/50 pt-20">
        <h2 className="text-4xl font-black mb-12 uppercase tracking-tight">Basepound Ne Satar?</h2>
        <div className="grid md:grid-cols-2 gap-12 text-left">
          <div className="p-8 bg-card border border-border/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <p className="text-2xl font-medium text-muted-foreground mb-6">Basepound <span className="line-through text-rose-500">sadece işletme datası satmaz.</span></p>
            <p className="text-3xl font-black text-foreground leading-tight">Basepound, AI destekli satış fırsatları sunar.</p>
            <div className="mt-8 p-6 bg-primary/5 rounded-xl border-l-4 border-primary">
              <p className="text-xl font-medium text-primary italic">
                Amaç: “Hangi işletmeden iş çıkar?” sorusunu cevaplamak.
              </p>
            </div>
          </div>
          <div className="p-8 bg-secondary/50 border border-secondary rounded-2xl shadow-sm">
            <h4 className="font-bold text-2xl mb-8 text-foreground">Sistem Nasıl Çalışır:</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="bg-emerald-500/10 p-2 rounded-full mt-1"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
                <div><span className="font-bold text-lg">İşletmeleri analiz eder</span></div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-emerald-500/10 p-2 rounded-full mt-1"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
                <div><span className="font-bold text-lg">Dijital zayıflıkları bulur</span></div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-emerald-500/10 p-2 rounded-full mt-1"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
                <div><span className="font-bold text-lg">Fırsat skorları oluşturur</span></div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-emerald-500/10 p-2 rounded-full mt-1"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
                <div><span className="font-bold text-lg">Satış potansiyelini keşfeder</span></div>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
