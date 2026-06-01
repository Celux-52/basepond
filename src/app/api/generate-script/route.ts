import { NextRequest, NextResponse } from "next/server";
import { generateSalesScript } from "@/lib/services/ai-script";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { business } = body;

    if (!business || !business.name) {
      return NextResponse.json({ error: "Business data is required" }, { status: 400 });
    }

    // Note: We could deduct a credit here if we wanted to charge per script generation
    const script = await generateSalesScript(business);

    if (!script) {
      throw new Error("Failed to generate script");
    }

    return NextResponse.json({ script });
  } catch (error) {
    console.error("Error generating sales script API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
