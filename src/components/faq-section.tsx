import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
  const t = useTranslations("FAQ");

  return (
    <section id="faq" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">{t("title")}</h2>
        </div>

        <Accordion className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left text-lg font-semibold">{t("q1")}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base leading-relaxed">
              {t("a1")}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left text-lg font-semibold">{t("q2")}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base leading-relaxed">
              {t("a2")}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left text-lg font-semibold">{t("q3")}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base leading-relaxed">
              {t("a3")}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
