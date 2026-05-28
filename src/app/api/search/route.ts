import { NextRequest, NextResponse } from "next/server";
import { runBusinessDiscovery } from "@/lib/engine/orchestrator";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const city = searchParams.get("city");
  const category = searchParams.get("category");
  const amountStr = searchParams.get("amount");

  if (!city || !category || !amountStr) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  const amount = parseInt(amountStr, 10);
  
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check user credits
  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
  const requiredCredits = amount * 7; // Max possible cost
  
  // NOTE: For MVP, we allow searching if they have ANY credits, but we should strictly check in production.
  if (!profile || profile.credits <= 0) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  const query = `${city} ${category}`;

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Run the orchestrator in the background and pipe results to stream
  (async () => {
    try {
      const generator = runBusinessDiscovery(query, city, category, amount, user.id);
      
      for await (const result of generator) {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(result)}\n\n`)
        );
      }
      
      await writer.write(encoder.encode(`data: [DONE]\n\n`));
      await writer.close();
    } catch (error) {
      console.error("Stream Error:", error);
      await writer.write(
        encoder.encode(`data: {"error": "Internal Server Error"}\n\n`)
      );
      await writer.close();
    }
  })();

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
