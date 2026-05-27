import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Zap } from "lucide-react";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-border/40 bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight">SnapLead</span>
            </Link>
            <p className="text-muted-foreground max-w-xs">
              Global AI lead generation for modern web professionals.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t("product")}</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t("legal")}</h4>
            <ul className="space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          {t("copyright")}
        </div>
      </div>
    </footer>
  );
}
