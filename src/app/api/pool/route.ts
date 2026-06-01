import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    let allBusinesses: any[] = [];
    const MAX_PER_REQUEST = 1000;
    
    for (let offset = 0; offset < limit; offset += MAX_PER_REQUEST) {
      const batchSize = Math.min(MAX_PER_REQUEST, limit - offset);
      const from = offset;
      const to = offset + batchSize - 1; // Supabase range is inclusive on both ends
      
      const { data, error } = await supabase
        .from("businesses")
        .select("*, business_analysis(*)")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      if (data && data.length > 0) {
        allBusinesses = [...allBusinesses, ...data];
      }
      
      // Stop if fewer rows returned than requested — end of table
      if (!data || data.length < batchSize) {
        break;
      }
    }

    // Server-side dedup by id as safety net
    const seen = new Set<string>();
    const unique = allBusinesses.filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });

    return NextResponse.json(unique);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
