import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ThemeToggle } from "./theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Zap, LayoutDashboard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export async function Navbar() {
  const t = useTranslations("Navbar");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl tracking-tight leading-none">BasePond</span>
            </div>
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
            <ThemeToggle />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className={buttonVariants({ variant: "default", className: "gap-2" })}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
                  {t("login")}
                </Link>
                <Link href="/signup" className={buttonVariants({ variant: "default" })}>
                  {t("getStarted")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
