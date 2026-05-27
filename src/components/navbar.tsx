import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { buttonVariants } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function Navbar() {
  const t = useTranslations("Navbar");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">SnapLead</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t("features")}
            </Link>
            <Link href="#workflow" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t("workflow")}
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t("pricing")}
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t("faq")}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              {t("login")}
            </Link>
            <Link href="/signup" className={buttonVariants({ variant: "default" })}>
              {t("getStarted")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
