import { getDashboardLeads } from '@/app/actions/lead';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const leads = await getDashboardLeads('PREMIUM');
    
    return NextResponse.json({
      count: leads.length,
      sample: leads[0]
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
