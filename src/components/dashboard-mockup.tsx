"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, ChevronDown, Download, MessageSquare, Search, Send, Star, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function DashboardMockup() {
  const t = useTranslations("Dashboard");

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-xl border border-border/50 bg-background shadow-2xl overflow-hidden flex flex-col h-[500px] sm:h-[600px]">
      {/* Header */}
      <div className="h-14 border-b border-border/50 flex items-center justify-between px-4 sm:px-6 bg-muted/20">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t("filters")}:</span>
            <Badge variant="secondary" className="gap-1 rounded-md px-2 py-1">
              {t("country")} <ChevronDown className="h-3 w-3" />
            </Badge>
            <Badge variant="secondary" className="hidden sm:inline-flex gap-1 rounded-md px-2 py-1">
              {t("city")} <ChevronDown className="h-3 w-3" />
            </Badge>
            <Badge variant="secondary" className="gap-1 rounded-md px-2 py-1">
              {t("niche")} <ChevronDown className="h-3 w-3" />
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="hidden sm:flex gap-2">
            <Download className="h-4 w-4" />
            {t("exportCsv")}
          </Button>
          <Button size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-muted/10 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Card 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border/50 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">A</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-card-foreground">Apex Web Solutions</h4>
                  <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20 gap-1">
                    <Star className="h-3 w-3 fill-orange-600" />
                    {t("hotLead")}
                  </Badge>
                  <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1">
                    Score: 98
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> No Website</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Email Found</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" className="gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                {t("generateMessage")}
              </Button>
              <Button size="sm" className="gap-2">
                <Send className="h-3.5 w-3.5" />
                {t("generateProposal")}
              </Button>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border/50 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
             <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <span className="text-blue-500 font-bold">B</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-card-foreground">Blue Ocean Dentists</h4>
                  <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-500/20 flex items-center gap-1">
                    Score: 85
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Poor Website</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Phone Found</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-2">
                <Search className="h-3.5 w-3.5" />
                {t("redesignPreview")}
              </Button>
              <Button size="sm" variant="secondary" className="gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                {t("generateMessage")}
              </Button>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border/50 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
             <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <span className="text-purple-500 font-bold">E</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-card-foreground">Elite Fitness Gym</h4>
                  <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20 gap-1">
                    <Star className="h-3 w-3 fill-orange-600" />
                    {t("hotLead")}
                  </Badge>
                  <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full border border-green-500/20 flex items-center gap-1">
                    Score: 92
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> No Website</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> IG Profile Found</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="gap-2">
                <Send className="h-3.5 w-3.5" />
                {t("generateProposal")}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
