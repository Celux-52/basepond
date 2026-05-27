import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/navbar';
import { DashboardMockup } from '@/components/dashboard-mockup';
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
    name: 'SnapLead',
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
              <Link href="#" className={buttonVariants({ size: "lg", className: "h-12 px-8 text-base gap-2 rounded-full w-full sm:w-auto shadow-lg shadow-primary/20 hover:scale-105 transition-transform" })}>
                {t('getStarted')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#" className={buttonVariants({ variant: "outline", size: "lg", className: "h-12 px-8 text-base gap-2 rounded-full w-full sm:w-auto hover:bg-secondary transition-colors" })}>
                <PlayCircle className="h-5 w-5" /> {t('watchDemo')}
              </Link>
            </div>
            
            <div className="relative mx-auto max-w-5xl rounded-2xl p-1.5 sm:p-2 bg-gradient-to-b from-primary/20 via-border/10 to-transparent shadow-2xl">
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/50" />
              <DashboardMockup />
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
