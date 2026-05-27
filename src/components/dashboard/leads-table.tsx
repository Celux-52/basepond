'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase"
import { formatDistanceToNow } from "date-fns"
import { Flame, Zap } from "lucide-react"
import { sendLeadToAutomation } from '@/app/actions/n8n';
import { toast } from 'sonner';

type Lead = Database['public']['Tables']['leads']['Row']

interface LeadsTableProps {
  leads: Lead[];
}

export function LeadsTable({ leads }: LeadsTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'new': return 'default'
      case 'contacted': return 'secondary'
      case 'qualified': return 'outline'
      case 'lost': return 'destructive'
      default: return 'outline'
    }
  }

  const handleSendToN8n = async (leadId: string) => {
    setLoadingId(leadId);
    try {
      const result = await sendLeadToAutomation(leadId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Müşteri verileri n8n'e başarıyla gönderildi!");
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
    } finally {
      setLoadingId(null);
    }
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md border-dashed">
        <h3 className="text-lg font-medium">No leads found</h3>
        <p className="text-sm text-muted-foreground mt-1">Add your first lead to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">
                {lead.first_name} {lead.last_name}
                <div className="text-xs text-muted-foreground font-normal">{lead.email}</div>
              </TableCell>
              <TableCell>
                {lead.company || '-'}
                <div className="text-xs text-muted-foreground">{lead.job_title || ''}</div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(lead.status) as any} className="capitalize">
                  {lead.status || 'new'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold ${
                    (lead.score || 0) >= 70 ? 'text-orange-500' : 
                    (lead.score || 0) >= 40 ? 'text-blue-500' : 'text-muted-foreground'
                  }`}>
                    {lead.score || 0}
                  </span>
                  {(lead.score || 0) >= 70 && (
                    <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1"
                  onClick={() => handleSendToN8n(lead.id)}
                  disabled={loadingId === lead.id}
                >
                  <Zap className="h-3.5 w-3.5 text-yellow-500" />
                  {loadingId === lead.id ? 'Sending...' : 'n8n'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
