"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Phone, Star, TrendingUp, AlertCircle } from "lucide-react";
import { ProcessedBusiness } from "@/lib/engine/orchestrator";

export function OpportunityCard({ business }: { business: ProcessedBusiness }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 bg-green-500/10";
    if (score >= 50) return "text-yellow-500 bg-yellow-500/10";
    return "text-red-500 bg-red-500/10";
  };

  const getScoreBorder = (score: number) => {
    if (score >= 80) return "border-green-500/50";
    if (score >= 50) return "border-yellow-500/50";
    return "border-red-500/50";
  };

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md border-t-4 ${getScoreBorder(business.ai_score || 0)}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{business.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" /> {business.city} • {business.category}
            </CardDescription>
          </div>
          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${getScoreColor(business.ai_score || 0)}`}>
            {business.ai_score || 0}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          {business.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> <span>{business.phone}</span>
            </div>
          )}
          {business.website ? (
            <div className="flex items-center gap-2 text-primary">
              <Globe className="w-4 h-4" /> 
              <a href={business.website} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-[200px]">
                {business.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" /> <span>No Website Found</span>
            </div>
          )}
          {business.rating && (
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 
              <span>{business.rating} ({business.review_count} reviews)</span>
            </div>
          )}
        </div>

        {/* AI Insight */}
        <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
          <p className="text-sm font-medium flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" /> AI Insight
          </p>
          <p className="text-sm text-muted-foreground italic">
            "{business.opportunity_reason}"
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/50 flex justify-between items-center bg-muted/10">
        <div className="flex gap-2">
          {/* Social Badges */}
          <Badge variant="outline" className="opacity-50">Social Check</Badge>
        </div>
        {business.cached && (
           <Badge variant="secondary" className="text-[10px]">Cached</Badge>
        )}
      </CardFooter>
    </Card>
  );
}
