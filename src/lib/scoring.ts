import { Database } from '@/types/supabase';

type LeadInput = Partial<Database['public']['Tables']['leads']['Row']>;

export function calculateLeadScore(lead: LeadInput): number {
  let score = 10; // Base score for existing in the system

  // 1. Company info check
  if (lead.company && lead.company.trim().length > 0) {
    score += 10;
  }

  // 2. LinkedIn URL check
  if (lead.linkedin_url && lead.linkedin_url.trim().length > 0) {
    score += 10;
  }

  // 3. Job Title Analysis
  if (lead.job_title) {
    const title = lead.job_title.toLowerCase();
    const highValueKeywords = ['ceo', 'founder', 'director', 'manager', 'vp', 'head', 'chief', 'president'];
    
    if (highValueKeywords.some(keyword => title.includes(keyword))) {
      score += 20;
    } else if (title.length > 0) {
      // Just having a job title gives some points
      score += 5;
    }
  }

  // 4. Status Impact
  switch (lead.status) {
    case 'contacted':
      score += 10;
      break;
    case 'qualified':
      score += 30;
      break;
    case 'lost':
      // If lost, score becomes 0 regardless of how good the title was
      return 0;
    case 'new':
    default:
      // No extra points for new
      break;
  }

  // Cap score at 100
  return Math.min(score, 100);
}
