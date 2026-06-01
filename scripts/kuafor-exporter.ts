import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { promises as fs } from 'fs';
import * as XLSX from 'xlsx';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const targetCategories = [
  "Kuaför", "Bayan Kuaförü", "Erkek Kuaförü", "Berber", 
  "Güzellik Merkezi", "Beauty Salon", "Hair Salon", 
  "Saç Tasarım Merkezi", "Güzellik ve Bakım Merkezi", 
  "Estetik Merkezi", "Cilt Bakım Merkezi"
];

// Desktop path resolution
const desktopPath = process.platform === 'win32' 
  ? path.join(process.env.USERPROFILE || '', 'OneDrive', 'Desktop')
  : path.join(process.env.HOME || '', 'Desktop');
  
const EXPORT_ROOT = path.join(desktopPath, 'Kuafor Toptancilarina Musteriler');

const DIRS = {
  EXCEL: path.join(EXPORT_ROOT, 'Excel'),
  CSV: path.join(EXPORT_ROOT, 'CSV'),
  PREMIUM: path.join(EXPORT_ROOT, 'Premium Leads'),
  AI: path.join(EXPORT_ROOT, 'AI Analizleri'),
  REPORT: path.join(EXPORT_ROOT, 'Raporlar'),
  BACKUP: path.join(EXPORT_ROOT, 'Yedekler')
};

async function ensureDirs() {
  for (const dir of Object.values(DIRS)) {
    await fs.mkdir(dir, { recursive: true });
  }
}

function autoSize(worksheet: XLSX.WorkSheet, rows: any[]) {
  if (rows.length === 0) return;
  const colWidths = Object.keys(rows[0]).map(key => ({ wch: Math.max(key.length, 15) }));
  worksheet['!cols'] = colWidths;
}

function toCsvRow(obj: Record<string, any>, headers: string[]) {
  return headers.map(h => {
    const val = obj[h];
    if (val === null || val === undefined) return '';
    const escaped = String(val).replace(/"/g, '""');
    return `"${escaped}"`;
  }).join(',');
}

async function runExport() {
  console.log('🚀 Starting Kuaför Export Process...');
  await ensureDirs();

  const pageSize = 1000;
  let page = 0;
  let all: any[] = [];
  
  // Fetch only Kuaför categories
  while (true) {
    const { data, error } = await supabase
      .from('businesses')
      .select('*, business_analysis(*)')
      .in('category', targetCategories)
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) { console.error('❌ Supabase error:', error.message); return; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`✅ Fetched ${all.length} Kuaför records`);

  // Map data to clean Master format
  const masterData = all.map(row => {
    const ba = row.business_analysis?.[0] || {};
    let aiReason = {};
    try { aiReason = JSON.parse(ba.opportunity_reason); } catch(e){}

    return {
      "ID": row.id,
      "İşletme Adı": row.business_name,
      "Kategori": row.category,
      "Şehir": row.city,
      "İlçe": row.district || "",
      "Telefon": row.phone,
      "E-posta": row.email || "",
      "Web Sitesi": row.website !== "Yok" ? row.website : "",
      "Google Puanı": row.rating || 0,
      "Yorum Sayısı": row.review_count || 0,
      "Güven Skoru": row.trust_score || 0,
      "AI Skoru": ba.ai_score || 0,
      "Fırsat Analizi": aiReason.opportunity_analysis || "",
      "Satışa Hazır Mı": ba.sales_readiness || 0,
      "Alım Niyeti": aiReason.purchase_intent || "",
      "Neden Şimdi": aiReason.why_now || "",
      "Önerilen Ürünler": Array.isArray(aiReason.recommended_services) ? aiReason.recommended_services.join(', ') : "",
      "AI Güven Skoru": aiReason.confidence_score || 0,
      "Instagram": row.instagram || "",
      "Facebook": row.facebook || "",
      "Haritalar Linki": row.maps_url || ""
    };
  });

  if (masterData.length === 0) {
    console.log('No data found to export.');
    return;
  }

  // 1. MASTER EXCEL
  const wsMaster = XLSX.utils.json_to_sheet(masterData);
  autoSize(wsMaster, masterData);
  const wbMaster = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbMaster, wsMaster, "Tüm Kayıtlar");
  XLSX.writeFile(wbMaster, path.join(DIRS.EXCEL, 'kuafor_master.xlsx'));
  
  // 1.5 BACKUP EXCEL
  XLSX.writeFile(wbMaster, path.join(DIRS.BACKUP, 'kuafor_master_yedek.xlsx'));

  // 2. MASTER CSV
  const headers = Object.keys(masterData[0]);
  const csvLines = [headers.join(','), ...masterData.map(r => toCsvRow(r, headers))];
  await fs.writeFile(path.join(DIRS.CSV, 'kuafor_master.csv'), csvLines.join('\n'), 'utf8');

  // 3. PREMIUM LEADS (AI > 80, Trust > 50, Phone exist, Web exist)
  const premiumData = masterData.filter(d => 
    d["AI Skoru"] >= 80 && 
    d["Güven Skoru"] >= 50 && 
    d["Telefon"].length > 5 && 
    d["Web Sitesi"].length > 5
  );
  if (premiumData.length > 0) {
    const wsPremium = XLSX.utils.json_to_sheet(premiumData);
    autoSize(wsPremium, premiumData);
    const wbPremium = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbPremium, wsPremium, "Premium Leads");
    XLSX.writeFile(wbPremium, path.join(DIRS.PREMIUM, 'premium_leads.xlsx'));
  }

  // 4. AI OPPORTUNITY REPORT
  const aiData = masterData.map(d => ({
    "İşletme Adı": d["İşletme Adı"],
    "Telefon": d["Telefon"],
    "AI Skoru": d["AI Skoru"],
    "Alım Niyeti": d["Alım Niyeti"],
    "Neden Şimdi": d["Neden Şimdi"],
    "Fırsat Analizi": d["Fırsat Analizi"],
    "Önerilen Ürünler": d["Önerilen Ürünler"]
  })).filter(d => d["AI Skoru"] > 0);
  
  if (aiData.length > 0) {
    const wsAi = XLSX.utils.json_to_sheet(aiData);
    autoSize(wsAi, aiData);
    const wbAi = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbAi, wsAi, "AI Analizleri");
    XLSX.writeFile(wbAi, path.join(DIRS.AI, 'ai_opportunity_report.xlsx'));
  }

  // 5. DUPLICATE REMOVED (same as master for us, as ingestion drops dups)
  XLSX.writeFile(wbMaster, path.join(DIRS.REPORT, 'duplicate_removed.xlsx'));

  console.log('🎉 Export completed to:', EXPORT_ROOT);
}

runExport();
