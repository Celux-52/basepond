import { useTranslations } from "next-intl";
import { MessageSquare, MousePointerClick, FileText, PhoneCall } from "lucide-react";

export function FeaturesSection() {
  const t = useTranslations("Features");

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">{t("title")}</h2>
          <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t("feature1Title")}</h3>
            <p className="text-muted-foreground leading-relaxed">{t("feature1Desc")}</p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
              <MousePointerClick className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t("feature2Title")}</h3>
            <p className="text-muted-foreground leading-relaxed">{t("feature2Desc")}</p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t("feature3Title")}</h3>
            <p className="text-muted-foreground leading-relaxed">{t("feature3Desc")}</p>
          </div>

          <div className="p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors shadow-sm">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t("feature4Title")}</h3>
            <p className="text-muted-foreground leading-relaxed">{t("feature4Desc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
