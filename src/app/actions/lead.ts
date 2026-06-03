'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Idempotency lock set for race condition protection
const unlockLocks = new Set<string>();

export async function getDashboardLeads(
  filterMode: string = 'ALL',
  searchQuery: string = '',
  page: number = 0,
  smartFilters: string[] = [],
  cityFilter: string = '',
  sectorFilter: string = '',
  districtFilter: string = ''
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Unauthorized');

  const analysisFilters = ["website_down", "mobile_unfriendly", "no_ssl", "missing_socials", "high_potential", "seo_issues", "old_website"];
  const readyAnalysisFilters = ['r_website_down', 'r_mobile_unfriendly', 'r_no_ssl', 'r_seo_issues', 'r_call_now', 'r_high_potential', 'r_website_renewal'];
  
  const hasAnalysisFilter = 
    filterMode === 'PREMIUM' || 
    readyAnalysisFilters.includes(filterMode) || 
    smartFilters.some(f => analysisFilters.includes(f));

  let query = supabase
    .from('businesses')
    .select(`
      id,
      business_name,
      category,
      city,
      district,
      phone,
      email,
      maps_url,
      instagram_url,
      facebook_url,
      created_at,
      rating,
      review_count,
      website,
      claimed_by,
      claimed_at,
      business_analysis${hasAnalysisFilter ? '!inner' : ''} (
        ai_score,
        quality_tier,
        opportunity_reasons,
        opportunity_reason,
        website_status,
        mobile_score,
        seo_score,
        has_ssl,
        mobile_responsive,
        has_social_links,
        recommended_services
      ),
      user_lead_status${filterMode === 'UNLOCKED' ? '!inner' : ''} (
        status,
        is_unlocked,
        user_id
      )
    `);

  // Sadece analizi bitmiş ve çöp olmayan (AI skoru > 0) olanları göster
  query = query.gt('business_analysis.ai_score', 0);

  if (filterMode === 'PREMIUM') {
    query = query.gte('business_analysis.ai_score', 70);
  } else if (filterMode === 'URGENT') {
    query = query.is('website', null);
  } else if (filterMode === 'UNLOCKED') {
    query = query.eq('user_lead_status.is_unlocked', true).eq('user_lead_status.user_id', userData.user.id);
  }

  // --- SMART FILTERS (Checkboxes) ---
  if (smartFilters.includes("no_website")) query = query.is('website', null);
  if (smartFilters.includes("website_down")) query = query.ilike('business_analysis.website_status', '%broken%');
  if (smartFilters.includes("mobile_unfriendly")) query = query.eq('business_analysis.mobile_responsive', false);
  if (smartFilters.includes("no_ssl")) query = query.eq('business_analysis.has_ssl', false);
  if (smartFilters.includes("no_instagram")) query = query.is('instagram', null);
  if (smartFilters.includes("no_facebook")) query = query.is('facebook', null);
  if (smartFilters.includes("rating_below_4")) query = query.lt('rating', 4);
  // recent_reviews veritabanında sütun olmadığı için şimdilik kaldırıldı
  if (smartFilters.includes("has_phone")) query = query.not('phone', 'is', null);
  if (smartFilters.includes("has_email")) query = query.not('email', 'is', null);
  if (smartFilters.includes("has_whatsapp")) query = query.ilike('phone', '%5%'); 
  if (smartFilters.includes("has_maps")) query = query.not('maps_url', 'is', null);
  if (smartFilters.includes("reviews_below_50")) query = query.lt('review_count', 50);
  if (smartFilters.includes("reviews_below_10")) query = query.lt('review_count', 10);
  if (smartFilters.includes("old_website")) query = query.lt('business_analysis.seo_score', 30);
  if (smartFilters.includes("seo_issues")) query = query.lt('business_analysis.seo_score', 50);
  if (smartFilters.includes("no_contact_form")) query = query.is('email', null).not('website', 'is', null);
  if (smartFilters.includes("missing_socials")) query = query.eq('business_analysis.has_social_links', false);
  if (smartFilters.includes("high_potential")) query = query.gte('business_analysis.ai_score', 80);

  // --- READY FILTERS (Quick actions) ---
  if (filterMode === 'r_no_website') query = query.is('website', null);
  if (filterMode === 'r_website_down') query = query.ilike('business_analysis.website_status', '%broken%');
  if (filterMode === 'r_mobile_unfriendly') query = query.eq('business_analysis.mobile_responsive', false);
  if (filterMode === 'r_no_ssl') query = query.eq('business_analysis.has_ssl', false);
  if (filterMode === 'r_seo_issues') query = query.lt('business_analysis.seo_score', 50);
  if (filterMode === 'r_weak_digital') query = query.is('website', null).is('instagram', null);
  if (filterMode === 'r_low_rating') query = query.lt('rating', 4);
  if (filterMode === 'r_call_now') query = query.not('phone', 'is', null).gte('business_analysis.ai_score', 80);
  if (filterMode === 'r_high_potential') query = query.gte('business_analysis.ai_score', 90);
  if (filterMode === 'r_website_renewal') query = query.not('website', 'is', null).eq('business_analysis.mobile_responsive', false);
  if (filterMode === 'r_social_media') query = query.is('instagram', null).is('facebook', null);
  if (filterMode === 'r_google_ads') query = query.is('website', null).lt('rating', 4);

  // Basic Search Fields
  if (cityFilter) query = query.ilike('city', `%${cityFilter}%`);
  if (districtFilter) query = query.ilike('city', `%${districtFilter}%`); // Fallback if district not standalone
  
  if (sectorFilter) {
    if (sectorFilter === 'Güzellik & Bakım') {
      query = query.or('category.ilike.%kuaför%,category.ilike.%kuafor%,category.ilike.%güzellik%,category.ilike.%estetik%');
    } else if (sectorFilter === 'Sağlık & Klinik') {
      query = query.or('category.ilike.%diş%,category.ilike.%diyetisyen%,category.ilike.%klinik%,category.ilike.%hastane%');
    } else if (sectorFilter === 'Emlak & Gayrimenkul') {
      query = query.or('category.ilike.%emlak%,category.ilike.%gayrimenkul%,category.ilike.%danışman%');
    } else if (sectorFilter === 'Yeme & İçme') {
      query = query.or('category.ilike.%restoran%,category.ilike.%pastane%,category.ilike.%fırın%,category.ilike.%cafe%');
    } else if (sectorFilter === 'Bilişim & Medya') {
      query = query.or('category.ilike.%yazılım%,category.ilike.%reklam%,category.ilike.%ajans%,category.ilike.%dijital%');
    } else if (sectorFilter === 'Otomotiv') {
      query = query.or('category.ilike.%oto%,category.ilike.%yıkama%,category.ilike.%detailing%,category.ilike.%galeri%');
    } else if (sectorFilter === 'Hukuk') {
      query = query.or('category.ilike.%hukuk%,category.ilike.%avukat%');
    } else if (sectorFilter === 'Diğer Hizmetler') {
      query = query.not('category', 'ilike', '%kuaför%').not('category', 'ilike', '%güzellik%')
                   .not('category', 'ilike', '%klinik%').not('category', 'ilike', '%diş%')
                   .not('category', 'ilike', '%emlak%').not('category', 'ilike', '%gayrimenkul%')
                   .not('category', 'ilike', '%restoran%').not('category', 'ilike', '%cafe%')
                   .not('category', 'ilike', '%yazılım%').not('category', 'ilike', '%oto%')
                   .not('category', 'ilike', '%hukuk%');
    } else {
      query = query.ilike('category', `%${sectorFilter}%`);
    }
  }
  
  // Sort
  query = query.order('created_at', { ascending: false });

  if (searchQuery && searchQuery.trim() !== '') {
    query = query.ilike('business_name', `%${searchQuery.trim()}%`);
  }

  const limit = 50;
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error } = await query.range(from, to);
  
  if (error) {
    console.error('getDashboardLeads Error:', error);
    return [];
  }

  // Güvenlik Maskelemesi (İsim Gizleme)
  const maskName = (name: string) => {
    if (!name) return 'Gizli Kayıt';
    const words = name.split(' ');
    return words.map(w => w.charAt(0) + '••••').join(' ');
  };

  // Map to frontend schema
  return data.map((d: any) => {
    const analysis = Array.isArray(d.business_analysis) ? d.business_analysis[0] : d.business_analysis;
    // user_lead_status will be array if 1-to-many, we just check if any exists for this user
    const statusRecord = Array.isArray(d.user_lead_status) ? d.user_lead_status.find((s:any) => s.user_id === userData.user.id) : d.user_lead_status;
    
    let parsedReasons = analysis?.opportunity_reasons || [];
    let parsedServices = analysis?.recommended_services || [];

    if (parsedReasons.length === 0 && analysis?.opportunity_reason) {
      try {
        const parsed = JSON.parse(analysis.opportunity_reason);
        parsedReasons = parsed.summary || [];
        parsedServices = parsed.services || [];
      } catch (e) {
        // ignore JSON parse errors
      }
    }

    const isUnlocked = statusRecord?.is_unlocked || false;
    
    // Gasp edilme (Steal) kontrolü
    const isVictim = isUnlocked && d.claimed_by && d.claimed_by !== userData.user.id && d.claimed_at &&
                     (new Date().getTime() - new Date(d.claimed_at).getTime()) / (1000 * 3600 * 24) <= 7;
    
    const showDetails = isUnlocked && !isVictim;

    return {
      ...d,
      id: d.id,
      business_name: showDetails ? (d.business_name || null) : maskName(d.business_name),
      phone: showDetails ? (d.phone || null) : null,
      website: showDetails ? (d.website || null) : null,
      email: showDetails ? (d.email || null) : null,
      maps_url: showDetails ? (d.maps_url || null) : null,
      instagram_url: showDetails ? (d.instagram_url || null) : null,
      facebook_url: showDetails ? (d.facebook_url || null) : null,
      is_stolen: isVictim,
      category: d.category || null,
      city: d.city || null,
      district: d.district || '',
      last_verified_at: d.created_at || null,
      rating: d.rating || null,
      review_count: d.review_count || 0,
      ai_score: analysis?.ai_score || 0,
      quality_tier: analysis?.quality_tier || 'C',
      opportunity_reasons: parsedReasons,
      recommended_services: parsedServices,
      is_unlocked: isUnlocked,
      status: statusRecord?.status || 'NEW'
    };
  });
}
export async function getSecureLeadsPool() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      business_analysis (
        ai_score,
        opportunity_reasons,
        opportunity_reason,
        recommended_services,
        quality_tier
      ),
      user_lead_status (
        status,
        is_unlocked,
        user_id
      )
    `)
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('getSecureLeadsPool Error:', error);
    return [];
  }

  // Güvenlik Maskelemesi (İsim Gizleme)
  const maskName = (name: string) => {
    if (!name) return 'Gizli Kayıt';
    const words = name.split(' ');
    return words.map(w => w.charAt(0) + '••••').join(' ');
  };

  return data.map((d: any) => {
    const analysis = Array.isArray(d.business_analysis) ? d.business_analysis[0] : d.business_analysis;
    const statusRecord = Array.isArray(d.user_lead_status) ? d.user_lead_status.find((s:any) => s.user_id === userData.user.id) : d.user_lead_status;
    
    let parsedReasons = analysis?.opportunity_reasons || [];
    let parsedServices = analysis?.recommended_services || [];
    if (parsedReasons.length === 0 && analysis?.opportunity_reason) {
      try {
        const parsed = JSON.parse(analysis.opportunity_reason);
        parsedReasons = parsed.summary || [];
        parsedServices = parsed.services || [];
      } catch (e) {}
    }

    const isUnlocked = statusRecord?.is_unlocked || false;

    // Sinyalleri belirle (eski sayfa front-end'de yapıyordu, burada doğrudan datada maskeleyeceğiz)
    // d.signals varsa olduğu gibi bırakıyoruz, ancak tel, websitesi ve mail null yapılacak eğer unlock edilmemişse
    return {
      ...d,
      business_name: isUnlocked ? (d.business_name || null) : maskName(d.business_name),
      phone: isUnlocked ? (d.phone || null) : null,
      website: isUnlocked ? (d.website || null) : null,
      email: isUnlocked ? (d.email || null) : null,
      maps_url: isUnlocked ? (d.maps_url || null) : null,
      instagram_url: isUnlocked ? (d.instagram_url || null) : null,
      facebook_url: showDetails ? (d.facebook_url || null) : null,
      ai_score: analysis?.ai_score || 0,
      opportunity_reasons: parsedReasons,
      recommended_services: parsedServices,
      is_unlocked: isUnlocked,
    };
  });
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  // 1. Premium Leads Count (AI Score >= 70)
  const { count: premiumCount } = await supabase
    .from('business_analysis')
    .select('id', { count: 'exact', head: true })
    .gte('ai_score', 70);

  // 2. High Opportunity Count (AI Score >= 40 AND < 70)
  const { count: highOppCount } = await supabase
    .from('business_analysis')
    .select('id', { count: 'exact', head: true })
    .gte('ai_score', 40)
    .lt('ai_score', 70);

  // 3. Opened Leads (User's unlocked leads)
  const { count: openedCount } = await supabase
    .from('user_lead_status')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userData.user.id)
    .eq('is_unlocked', true);

  // 4. Contacted Leads
  const { count: contactedCount } = await supabase
    .from('user_lead_status')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userData.user.id)
    .neq('status', 'NEW')
    .neq('status', 'VIEWED');

  const openedLeads = openedCount || 0;
  const contactedLeads = contactedCount || 0;
  const conversionRate = openedLeads > 0 ? Math.round((contactedLeads / openedLeads) * 100) : 0;

  return {
    premium_count: premiumCount || 0,
    high_opportunity_count: highOppCount || 0,
    opened_leads: openedLeads,
    contacted_leads: contactedLeads,
    conversion_rate: conversionRate,
    last_update: '10 dk önce'
  };
}

export async function getSectorsWithCounts() {
  const supabase = await createClient();
  const { data } = await supabase.from('businesses').select('category');
  if (!data) return [];

  const umbrellaCounts: Record<string, number> = {
    'Güzellik & Bakım': 0,
    'Sağlık & Klinik': 0,
    'Emlak & Gayrimenkul': 0,
    'Yeme & İçme': 0,
    'Bilişim & Medya': 0,
    'Otomotiv': 0,
    'Hukuk': 0,
    'Diğer Hizmetler': 0
  };

  const rawCounts: Record<string, number> = {};

  data.forEach(d => {
    if (!d.category) return;
    const cat = d.category.toLowerCase();
    
    let matched = true;
    if (cat.includes('kuaför') || cat.includes('kuafor') || cat.includes('güzellik') || cat.includes('estetik')) {
      umbrellaCounts['Güzellik & Bakım']++;
    } else if (cat.includes('diş') || cat.includes('diyetisyen') || cat.includes('klinik') || cat.includes('hastane')) {
      umbrellaCounts['Sağlık & Klinik']++;
    } else if (cat.includes('emlak') || cat.includes('gayrimenkul') || cat.includes('danışman')) {
      umbrellaCounts['Emlak & Gayrimenkul']++;
    } else if (cat.includes('restoran') || cat.includes('pastane') || cat.includes('fırın') || cat.includes('cafe')) {
      umbrellaCounts['Yeme & İçme']++;
    } else if (cat.includes('yazılım') || cat.includes('reklam') || cat.includes('ajans') || cat.includes('dijital')) {
      umbrellaCounts['Bilişim & Medya']++;
    } else if (cat.includes('oto') || cat.includes('yıkama') || cat.includes('detailing') || cat.includes('galeri')) {
      umbrellaCounts['Otomotiv']++;
    } else if (cat.includes('hukuk') || cat.includes('avukat')) {
      umbrellaCounts['Hukuk']++;
    } else {
      matched = false;
      // It's unknown, track it raw
      rawCounts[d.category] = (rawCounts[d.category] || 0) + 1;
    }
  });

  const finalSectors: { name: string, count: number }[] = [];

  // Add standard umbrellas (only if count > 0)
  for (const [name, count] of Object.entries(umbrellaCounts)) {
    if (name !== 'Diğer Hizmetler' && count > 0) {
      finalSectors.push({ name, count });
    }
  }

  // Check raw counts for threshold (e.g. 5 for testing, ideally 100 for production as suggested)
  // I will set threshold to 15 for demo purposes so it triggers easily, but configurable
  const DYNAMIC_THRESHOLD = 50; 
  let digerCount = 0;

  for (const [rawName, count] of Object.entries(rawCounts)) {
    if (count >= DYNAMIC_THRESHOLD) {
      // Promote to its own sector
      finalSectors.push({ name: rawName, count });
    } else {
      digerCount += count;
    }
  }

  if (digerCount > 0) {
    finalSectors.push({ name: 'Diğer Hizmetler', count: digerCount });
  }

  return finalSectors.sort((a, b) => b.count - a.count);
}

export async function getUserWallet() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { balance: 0 };

  const { data } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userData.user.id)
    .single();

  return { balance: data?.credits || 0 };
}

export async function unlockLeadPhone(businessId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { success: false, message: 'Oturum süresi doldu, lütfen tekrar giriş yapın.' };

  const lockKey = `${userData.user.id}_${businessId}`;
  if (unlockLocks.has(lockKey)) {
    return { success: false, message: 'İşleminiz şu an devam ediyor, lütfen bekleyin.' };
  }
  unlockLocks.add(lockKey);

  try {
    const { data, error } = await supabase.rpc('unlock_lead_phone', { p_business_id: businessId });
    
    if (error) {
      console.error('unlockLeadPhone Error:', error);
      return { success: false, message: 'Firma verisi alınırken veya güncellenirken bir hata oluştu.' };
    }

    if (data && data.error) {
      return { success: false, message: data.error };
    }

    revalidatePath('/[locale]/(protected)/dashboard'); // Refresh the UI state
    return await getLeadDetails(businessId);
  } catch (err: any) {
    console.error('unlockLeadPhone Catch Error:', err);
    return { success: false, message: 'Sistem hatası oluştu, işlem gerçekleştirilemedi.' };
  } finally {
    unlockLocks.delete(lockKey);
  }
}

export async function getLeadDetails(businessId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('businesses')
    .select(`
      *,
      business_analysis(*),
      user_lead_status(*)
    `)
    .eq('id', businessId)
    .single();

  if (error || !data) return null;

  const analysis = Array.isArray(data.business_analysis) ? data.business_analysis[0] : data.business_analysis;
  const statusRecord = Array.isArray(data.user_lead_status) ? data.user_lead_status.find((s:any) => s.user_id === userData.user.id) : data.user_lead_status;

  // Mask phone and sensitive data if not unlocked
  const isUnlocked = statusRecord?.is_unlocked || false;

  const maskName = (name: string) => {
    if (!name) return 'Gizli Kayıt';
    const words = name.split(' ');
    return words.map(w => w.charAt(0) + '••••').join(' ');
  };

  let parsedReasons = analysis?.opportunity_reasons || [];
  let parsedServices = analysis?.recommended_services || [];

  if (parsedReasons.length === 0 && analysis?.opportunity_reason) {
    try {
      const parsed = JSON.parse(analysis.opportunity_reason);
      parsedReasons = parsed.summary || [];
      parsedServices = parsed.services || [];
    } catch (e) {
      // ignore
    }
  }

  return {
    id: data.id,
    business_name: isUnlocked ? (data.business_name || null) : maskName(data.business_name),
    category: data.category || null,
    city: data.city || null,
    district: data.district || '',
    last_verified_at: data.created_at || null,
    rating: data.rating || null,
    review_count: data.review_count || 0,
    website: isUnlocked ? (data.website || null) : null,
    phone: isUnlocked ? (data.phone || null) : null,
    ai_score: analysis?.ai_score || 0,
    quality_tier: analysis?.quality_tier || 'C',
    opportunity_reasons: parsedReasons,
    recommended_services: parsedServices,
    status: statusRecord?.status || 'NEW',
    pipeline_stage: data.pipeline_stage || 'YENİ'
  };
}

export async function updatePipelineStage(businessId: string, newStage: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('businesses')
    .update({ pipeline_stage: newStage })
    .eq('id', businessId);

  if (error) {
    console.error('Update Pipeline Stage Error:', error);
    throw new Error('Could not update pipeline stage');
  }

  return { success: true };
}
