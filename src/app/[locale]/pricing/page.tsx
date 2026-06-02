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
        body: JSON.stringify({ amount })
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
        <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Basepound Pricing</h2>
        <p className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
          Sıradan Data Değil, <span className="text-primary text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">Premium İstihbarat.</span>
        </p>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
          Gerçek fırsatları keşfedin. Yapay zeka ile analiz edilmiş işletme dataları ile satışlarınızı katlayın.
        </p>
      </div>

      <div className="mt-16 max-w-md mx-auto flex justify-center">
        {/* Single Premium Plan */}
        <Card className="flex flex-col justify-between border-primary bg-primary/5 shadow-lg shadow-primary/20 relative transform w-full transition-all duration-300 hover:shadow-primary/30">
          <div className="absolute top-0 right-0 -mt-4 mr-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
            Tek Paket
          </div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" /> Premium
            </CardTitle>
            <CardDescription className="text-sm">Tüm özellikleri sınırları zorlayarak kullanın.</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              $44.99
              <span className="ml-2 text-xl font-medium text-muted-foreground">/ ay</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <ul className="space-y-3">
              <li className="flex gap-2"><CheckCircle2 className="flex-shrink-0 h-5 w-5 text-emerald-500" /> <span className="font-medium text-primary">3000 Business Scan</span></li>
              <li className="flex gap-2"><CheckCircle2 className="flex-shrink-0 h-5 w-5 text-emerald-500" /> <span>Gelişmiş Fırsat Analizi</span></li>
              <li className="flex gap-2"><CheckCircle2 className="flex-shrink-0 h-5 w-5 text-emerald-500" /> <span>Premium İşletme Verileri</span></li>
              <li className="flex gap-2"><CheckCircle2 className="flex-shrink-0 h-5 w-5 text-emerald-500" /> <span>Sosyal Medya Analizi</span></li>
              <li className="flex gap-2"><CheckCircle2 className="flex-shrink-0 h-5 w-5 text-emerald-500" /> <span>Gelişmiş Filtreleme</span></li>
              <li className="flex gap-2"><CheckCircle2 className="flex-shrink-0 h-5 w-5 text-emerald-500" /> <span>Excel Export</span></li>
              <li className="flex gap-2"><CheckCircle2 className="flex-shrink-0 h-5 w-5 text-emerald-500" /> <span>Öncelikli Tarama Hızı</span></li>
              <li className="flex gap-2"><CheckCircle2 className="flex-shrink-0 h-5 w-5 text-emerald-500" /> <span>Güçlü Opportunity Scoring</span></li>
            </ul>
            <div className="mt-6 pt-6 border-t border-primary/20">
              <p className="text-sm font-semibold mb-2">Sınırsız Özgürlük</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Dijital Ajanslar & Satış Ekipleri için en ideali</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handleBuyCredits(3000, 'Premium')}
              disabled={loadingPlan === 'Premium'}
            >
              {loadingPlan === 'Premium' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Premium Planı Seç
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Pay-As-You-Go Section */}
      <div className="mt-20 max-w-4xl mx-auto bg-muted/30 border border-border/50 rounded-2xl p-8 lg:flex lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Extra Kullanım</h3>
          <p className="mt-2 text-muted-foreground">
            Kullanıcılar ihtiyaç duydukça ek tarama satın alabilir.
          </p>
        </div>
        <div className="mt-6 lg:mt-0 lg:ml-8 flex-shrink-0">
          <div className="bg-card border border-border/50 rounded-xl p-6 text-center shadow-sm">
            <span className="block text-sm font-medium text-muted-foreground uppercase tracking-wide">+1000 Ek Business Scan</span>
            <span className="mt-2 block text-4xl font-extrabold text-foreground">$15</span>
            <Button 
              className="mt-4 w-full flex items-center justify-center gap-2" 
              variant={hasPurchased ? "default" : "secondary"}
              onClick={() => handleBuyCredits(100, 'Ekstra Paket')}
              disabled={loadingPlan === 'Ekstra Paket' || (!hasPurchased && !isChecking)}
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : 
               loadingPlan === 'Ekstra Paket' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
               !hasPurchased ? "Önce Paket Almalısınız" :
               <>Anında Yükle <ArrowRight className="w-4 h-4" /></>}
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
