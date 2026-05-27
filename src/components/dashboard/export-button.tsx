'use client';

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Database } from "@/types/supabase";

type Lead = Database['public']['Tables']['leads']['Row'];

interface ExportButtonProps {
  leads: Lead[];
}

export function ExportButton({ leads }: ExportButtonProps) {
  
  const handleExport = () => {
    if (!leads || leads.length === 0) {
      alert("Dışa aktarılacak veri bulunamadı.");
      return;
    }

    // CSV Başlıkları
    const headers = ["ID", "First Name", "Last Name", "Email", "Company", "Job Title", "Status", "Score", "Created At"];
    
    // Verileri CSV formatına dönüştür
    const csvContent = [
      headers.join(","),
      ...leads.map(lead => [
        lead.id,
        `"${lead.first_name || ''}"`,
        `"${lead.last_name || ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.company || ''}"`,
        `"${lead.job_title || ''}"`,
        lead.status,
        lead.score,
        lead.created_at
      ].join(","))
    ].join("\n");

    // CSV dosyasını indir
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `snaplead_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
