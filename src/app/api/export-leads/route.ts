import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
    }

    // Prepare CSV data
    const headers = [
      'İşletme Adı', 'Kategori', 'Şehir/İlçe', 'Telefon', 'Website', 'Email',
      'Google Puanı', 'Yorum Sayısı', 'Yapay Zeka Skoru', 'Neden Şimdi Ulaşmalı', 'Harita Linki'
    ];

    const rows = businesses.map((b: any) => {
      return [
        `"${(b.business_name || '').replace(/"/g, '""')}"`,
        `"${(b.category || '').replace(/"/g, '""')}"`,
        `"${(b.city || '')} - ${(b.district || '')}"`,
        `"${(b.phone || '').replace(/"/g, '""')}"`,
        `"${(b.website || '').replace(/"/g, '""')}"`,
        `"${(b.email || '').replace(/"/g, '""')}"`,
        b.rating || 0,
        b.review_count || 0,
        b.ai_score || 0,
        `"${(b.why_now || '').replace(/"/g, '""')}"`,
        `"${(b.maps_url || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n'); // Added BOM for Excel UTF-8 support

    // Return as a downloadable CSV file
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="firsat_havuzu_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
