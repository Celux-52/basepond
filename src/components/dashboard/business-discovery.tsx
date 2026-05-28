"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Download } from "lucide-react";
import { OpportunityCard } from "./opportunity-card";
import { ProcessedBusiness } from "@/lib/engine/orchestrator";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";

export function BusinessDiscovery() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("20");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ProcessedBusiness[]>([]);

  const handleSearch = async () => {
    if (!city || !category) {
      toast.error("Please enter both city and category");
      return;
    }

    setIsScanning(true);
    setResults([]);

    try {
      const url = `/api/search?city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}&amount=${amount}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 402) {
          toast.error("Insufficient credits. Please upgrade your plan.");
        } else {
          toast.error("Failed to start scan");
        }
        setIsScanning(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error("No reader");
      }

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              setIsScanning(false);
              toast.success("Scan complete!");
              return;
            }

            try {
              const result = JSON.parse(dataStr);
              if (result.error) {
                toast.error(result.error);
                setIsScanning(false);
                return;
              }
              setResults(prev => [...prev, result as ProcessedBusiness]);
            } catch (e) {
              // ignore parse errors for partial chunks if any
            }
          }
        }
      }
    } catch (error) {
      toast.error("An error occurred during scanning");
      setIsScanning(false);
    }
  };

  const handleExport = () => {
    if (results.length === 0) return;
    exportToCsv(results, `SnapLead_${city}_${category}`);
    toast.success("Exported to CSV");
  };

  return (
    <div className="space-y-6">
      {/* Search Header Card */}
      <Card className="bg-card border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium">Target City / Region</label>
              <Input 
                placeholder="e.g. Istanbul" 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={isScanning}
              />
            </div>
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium">Business Category</label>
              <Input 
                placeholder="e.g. Hair Salon, Dentist..." 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isScanning}
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Select value={amount} onValueChange={(val) => val && setAmount(val)} disabled={isScanning}>
                <SelectTrigger>
                  <SelectValue placeholder="Count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isScanning} 
              className="w-full md:w-auto min-w-[140px]"
            >
              {isScanning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...</>
              ) : (
                <><Search className="mr-2 h-4 w-4" /> Start Scan</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Header */}
      {results.length > 0 && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Found Opportunities ({results.length})
          </h2>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((business, i) => (
          <OpportunityCard key={business.id || i} business={business} />
        ))}
      </div>

      {isScanning && results.length > 0 && (
        <div className="flex justify-center p-8">
          <div className="flex flex-col items-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">Fetching and analyzing more businesses...</p>
          </div>
        </div>
      )}
    </div>
  );
}
