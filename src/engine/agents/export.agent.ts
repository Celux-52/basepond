import { BaseAgent } from '../core/base.agent';
import { IStorageAdapter } from '../interfaces/storage.interface';
import { CONFIG } from '../config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as XLSX from 'xlsx';

export class ExportAgent extends BaseAgent<void, void> {
  private storage: IStorageAdapter;

  constructor(storage: IStorageAdapter) {
    super('ExportAgent');
    this.storage = storage;
  }

  async execute(): Promise<void> {
    this.log('Starting Export Process...');
    
    // Create Folder Structure
    const base = CONFIG.EXPORT_BASE_DIR;
    const folders = ['CSV', 'Excel', 'Premium Leads', 'Low Quality Leads', 'AI Reports', 'Logs', 'Backups'];
    
    for (const folder of folders) {
      await fs.mkdir(path.join(base, folder), { recursive: true });
    }

    // Fetch Data
    const allLeads = await this.storage.getAllLeads();
    const premiumLeads = await this.storage.getPremiumLeads();

    this.log(`Fetched ${allLeads.length} total leads, ${premiumLeads.length} premium leads.`);

    // Map for Excel
    const mappedAll = allLeads.map(l => this.mapRecord(l));
    const mappedPremium = premiumLeads.map(l => this.mapRecord(l));
    
    const lowQualityLeads = allLeads.filter(l => {
      const score = (l as any).business_analysis?.ai_score || (l as any).ai_score || 0;
      return score < 70;
    });
    const mappedLowQuality = lowQualityLeads.map(l => this.mapRecord(l));

    // Write Excel Files
    this.writeExcel(mappedAll, path.join(base, 'Excel', 'kuafor_master.xlsx'));
    this.writeExcel(mappedPremium, path.join(base, 'Premium Leads', 'premium_leads.xlsx'));
    this.writeExcel(mappedLowQuality, path.join(base, 'Low Quality Leads', 'low_quality_leads.xlsx'));

    // Write AI Report (just name and analysis)
    const aiReport = allLeads.map(l => {
      const analysis = Array.isArray(l.business_analysis) ? l.business_analysis[0] : l.business_analysis;
      return {
        'İşletme Adı': l.business_name,
        'AI Fırsat Analizi': analysis?.opportunity_reason || l.opportunity_analysis,
        'Satışa Hazırlık (%)': analysis?.sales_readiness || l.sales_readiness
      };
    });
    this.writeExcel(aiReport, path.join(base, 'AI Reports', 'ai_opportunity_report.xlsx'));

    // Write CSV
    const csvContent = this.convertToCSV(mappedAll);
    await fs.writeFile(path.join(base, 'CSV', 'kuafor_master.csv'), csvContent, 'utf8');

    this.log('✅ Export Completed Successfully!');
  }

  private mapRecord(l: any) {
    const analysis = Array.isArray(l.business_analysis) ? l.business_analysis[0] : l.business_analysis;
    return {
      'İşletme Adı': l.business_name,
      'Kategori': l.category,
      'Şehir/İlçe': l.city,
      'Telefon': l.phone,
      'Website': l.website,
      'Email': l.email,
      'Google Puanı': l.rating,
      'Yorum Sayısı': l.review_count,
      'Güven Skoru': l.trust_score,
      'AI Skoru': (l as any).business_analysis?.ai_score || l.ai_score,
      'Maps Linki': l.maps_url
    };
  }

  private writeExcel(data: any[], filePath: string) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Veriler");
    XLSX.writeFile(wb, filePath);
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}
