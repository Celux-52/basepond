import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const t = useTranslations("Pricing");

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">{t("title")}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="p-8 rounded-2xl border border-border/50 bg-card flex flex-col">
            <h3 className="text-2xl font-bold mb-2">{t("starter")}</h3>
            <div className="mt-4 mb-6"><span className="text-4xl font-extrabold">$29</span><span className="text-muted-foreground">/{t("monthly").toLowerCase()}</span></div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>500 Leads / month</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>Basic AI Messages</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>Email Support</span></li>
            </ul>
            <Button variant="outline" className="w-full">{t("getStarted")}</Button>
          </div>

          {/* Pro */}
          <div className="p-8 rounded-2xl border-2 border-primary bg-card flex flex-col relative shadow-xl shadow-primary/10 scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-full">
              {t("popular")}
            </div>
            <h3 className="text-2xl font-bold mb-2">{t("pro")}</h3>
            <div className="mt-4 mb-6"><span className="text-4xl font-extrabold">$79</span><span className="text-muted-foreground">/{t("monthly").toLowerCase()}</span></div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>2,500 Leads / month</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>Advanced AI Messages</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>AI Proposals & Redesigns</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>Priority Support</span></li>
            </ul>
            <Button className="w-full">{t("getStarted")}</Button>
          </div>

          {/* Enterprise */}
          <div className="p-8 rounded-2xl border border-border/50 bg-card flex flex-col">
            <h3 className="text-2xl font-bold mb-2">{t("enterprise")}</h3>
            <div className="mt-4 mb-6"><span className="text-4xl font-extrabold">$199</span><span className="text-muted-foreground">/{t("monthly").toLowerCase()}</span></div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>10,000+ Leads / month</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>Custom AI Models</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>API Access</span></li>
              <li className="flex gap-2"><Check className="h-5 w-5 text-primary" /> <span>Dedicated Manager</span></li>
            </ul>
            <Button variant="outline" className="w-full">{t("getStarted")}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
