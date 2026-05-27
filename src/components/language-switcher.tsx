"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { useRouter, usePathname, locales } from "@/i18n/routing";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languageNames: Record<string, string> = {
  en: "English", tr: "Türkçe", es: "Español", pt: "Português", de: "Deutsch",
  fr: "Français", it: "Italiano", ru: "Русский", ar: "العربية", hi: "हिन्दी",
  zh: "中文", ja: "日本語", ko: "한국어", id: "Bahasa Indonesia", vi: "Tiếng Việt",
  nl: "Nederlands", pl: "Polski", uk: "Українська"
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  function onSelectChange(nextLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "sm", className: "h-9 gap-2 px-2" })} disabled={isPending}>
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline-block text-sm">{languageNames[locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
        {locales.map((cur) => (
          <DropdownMenuItem 
            key={cur} 
            onClick={() => onSelectChange(cur)}
            className={cur === locale ? "bg-muted" : ""}
          >
            {languageNames[cur]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
