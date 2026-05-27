import { useTranslations } from "next-intl";

export function WorkflowSection() {
  const t = useTranslations("Workflow");

  return (
    <section id="workflow" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">{t("title")}</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="relative p-6">
             <div className="text-5xl font-black text-primary/10 absolute top-0 right-4">01</div>
             <h3 className="text-xl font-bold mb-2 mt-4">{t("step1")}</h3>
             <p className="text-muted-foreground">{t("step1Desc")}</p>
          </div>
          <div className="relative p-6">
             <div className="text-5xl font-black text-primary/10 absolute top-0 right-4">02</div>
             <h3 className="text-xl font-bold mb-2 mt-4">{t("step2")}</h3>
             <p className="text-muted-foreground">{t("step2Desc")}</p>
          </div>
          <div className="relative p-6">
             <div className="text-5xl font-black text-primary/10 absolute top-0 right-4">03</div>
             <h3 className="text-xl font-bold mb-2 mt-4">{t("step3")}</h3>
             <p className="text-muted-foreground">{t("step3Desc")}</p>
          </div>
          <div className="relative p-6">
             <div className="text-5xl font-black text-primary/10 absolute top-0 right-4">04</div>
             <h3 className="text-xl font-bold mb-2 mt-4">{t("step4")}</h3>
             <p className="text-muted-foreground">{t("step4Desc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
