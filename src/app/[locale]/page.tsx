import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/navbar';
import { TrustSection } from '@/components/trust-section';
import { FeaturesSection } from '@/components/features-section';
import { WorkflowSection } from '@/components/workflow-section';
import { PricingSection } from '@/components/pricing-section';
import { FaqSection } from '@/components/faq-section';
import { Footer } from '@/components/footer';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { ArrowRight, PlayCircle } from 'lucide-react';
import Script from 'next/script';

export default function Home() {
  const t = useTranslations('Index');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Basepound',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '29.00',
      priceCurrency: 'USD',
    },
    description: t('subheadline'),
  };

  return (
    <>
      <Script
        id="schema-org"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] opacity-60 translate-x-1/3 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[120px] opacity-60 -translate-x-1/3 translate-y-1/2" />
          
          <div className="container mx-auto px-4 text-center">
            <h1 className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8 text-foreground leading-[1.1]">
              {t('headline')}
            </h1>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
              {t('subheadline')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 sm:mb-20">
              <Link href="/signup" className={buttonVariants({ size: "lg", className: "h-12 px-8 text-base gap-2 rounded-full w-full sm:w-auto shadow-lg shadow-primary/20 hover:scale-105 transition-transform" })}>
                {t('getStarted')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#demo-video" className={buttonVariants({ variant: "outline", size: "lg", className: "h-12 px-8 text-base gap-2 rounded-full w-full sm:w-auto hover:bg-secondary transition-colors" })}>
                <PlayCircle className="h-5 w-5" /> {t('watchDemo')}
              </Link>
            </div>
            
            <div id="demo-video" className="relative mx-auto max-w-5xl aspect-[16/9] md:aspect-[21/9] rounded-2xl p-1.5 sm:p-2 bg-gradient-to-b from-primary/30 via-border/20 to-transparent shadow-2xl shadow-primary/10 overflow-hidden scroll-mt-24">
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/50" />
              <div className="relative w-full h-full rounded-xl overflow-hidden z-10 bg-zinc-950/90 flex flex-col font-sans">
                
                {/* Mockup Window Header */}
                <div className="h-10 border-b border-white/10 flex items-center px-4 gap-2 bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="mx-auto bg-black/40 px-3 py-1 rounded-md text-[10px] text-zinc-400 border border-white/5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    AI İstihbarat Motoru Çalışıyor...
                  </div>
                </div>

                {/* Mockup Body */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Sidebar Mockup */}
                  <div className="w-48 border-r border-white/10 hidden md:flex flex-col p-4 gap-3 bg-white/[0.02]">
                    <div className="h-8 w-full bg-white/10 rounded-md" />
                    <div className="h-4 w-3/4 bg-white/5 rounded-md mt-4" />
                    <div className="h-4 w-2/3 bg-white/5 rounded-md" />
                    <div className="h-4 w-5/6 bg-white/5 rounded-md" />
                  </div>

                  {/* Main Content Area Mockup */}
                  <div className="flex-1 p-6 relative overflow-hidden flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                      <div>
                        <div className="h-6 w-48 bg-white/20 rounded-md mb-2" />
                        <div className="h-3 w-64 bg-white/10 rounded-md" />
                      </div>
                      <div className="h-10 w-32 bg-primary/80 rounded-full" />
                    </div>

                    {/* Cards Animation */}
                    <div className="flex-1 flex gap-4 mt-2">
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/40 transition-colors duration-1000" />
                        
                        <div className="flex justify-between items-start mb-6">
                          <div className="h-5 w-1/3 bg-white/20 rounded-md" />
                          <div className="h-6 w-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                            <div className="h-2 w-8 bg-emerald-400/80 rounded-full" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="h-3 w-1/2 bg-white/10 rounded-md" />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="h-3 w-2/3 bg-white/10 rounded-md" />
                          </div>
                        </div>

                        {/* Scanner Effect */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-[scan_3s_ease-in-out_infinite]" />
                      </div>

                      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden hidden sm:block opacity-50">
                        <div className="flex justify-between items-start mb-6">
                          <div className="h-5 w-1/2 bg-white/20 rounded-md" />
                          <div className="h-6 w-16 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center">
                            <div className="h-2 w-8 bg-blue-400/80 rounded-full" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="h-3 w-1/3 bg-white/10 rounded-md" />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <TrustSection />
        <FeaturesSection />
        <WorkflowSection />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}
