export function TrustSection() {
  return (
    <section className="py-12 border-y border-border/40 bg-muted/20">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-8">
          TRUSTED BY INNOVATIVE AGENCIES & FREELANCERS WORLDWIDE
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="font-heading font-bold text-xl flex items-center gap-2"><div className="w-6 h-6 rounded bg-primary/20"></div>Acme Corp</div>
          <div className="font-heading font-bold text-xl flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-500/20"></div>Globex</div>
          <div className="font-heading font-bold text-xl flex items-center gap-2"><div className="w-6 h-6 rotate-45 bg-purple-500/20"></div>Soylent</div>
          <div className="font-heading font-bold text-xl flex items-center gap-2"><div className="w-6 h-6 rounded-tl-xl bg-orange-500/20"></div>Initech</div>
          <div className="font-heading font-bold text-xl flex items-center gap-2"><div className="w-6 h-6 rounded-br-xl bg-green-500/20"></div>Umbrella</div>
        </div>
      </div>
    </section>
  );
}
