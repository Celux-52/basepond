'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { calculateLeadScore } from '@/lib/scoring';
import { enrichLeadWithApollo } from '@/lib/enrichment';

export async function getLeads() {
  const supabase = await createClient();
  
  // RLS will ensure user only sees their own leads
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return { error: error.message, leads: [] };
  }

  return { error: null, leads: leads || [] };
}

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const email = formData.get('email') as string;
  const company = formData.get('company') as string | null;
  const jobTitle = formData.get('job_title') as string | null;

  if (!firstName || !lastName || !email) {
    return { error: 'First Name, Last Name and Email are required.' };
  }

  let enrichedData = null;
  
  // Eğer şirket veya ünvan girilmemişse, Apollo API'den bulmaya çalışalım.
  if (!company || !jobTitle) {
    enrichedData = await enrichLeadWithApollo(email);
  }

  const finalFirstName = firstName || enrichedData?.first_name || 'Unknown';
  const finalLastName = lastName || enrichedData?.last_name || 'Unknown';
  const finalCompany = company || enrichedData?.company || null;
  const finalJobTitle = jobTitle || enrichedData?.job_title || null;
  const finalLinkedIn = enrichedData?.linkedin_url || null;

  const leadData = {
    user_id: user.id,
    first_name: finalFirstName,
    last_name: finalLastName,
    email: email,
    company: finalCompany,
    job_title: finalJobTitle,
    linkedin_url: finalLinkedIn,
    status: 'new' as const
  };

  const initialScore = calculateLeadScore(leadData);

  const { data, error } = await supabase
    .from('leads')
    .insert({ ...leadData, score: initialScore })
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    // Handle unique constraint error
    if (error.code === '23505') {
      return { error: 'A lead with this email already exists in your list.' };
    }
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { error: null, lead: data };
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { error: null };
}

export async function updateLeadStatus(leadId: string, status: 'new' | 'contacted' | 'qualified' | 'lost') {
  const supabase = await createClient();
  
  // 1. Durumu güncellenecek lead'i çekiyoruz
  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single();
  
  if (!lead) {
    return { error: 'Lead not found' };
  }

  // 2. Yeni duruma göre yeni skoru hesaplıyoruz
  const newScore = calculateLeadScore({ ...lead, status });

  // 3. Status ve Score'u aynı anda güncelliyoruz
  const { error } = await supabase
    .from('leads')
    .update({ status, score: newScore })
    .eq('id', leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { error: null };
}
