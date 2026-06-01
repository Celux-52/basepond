import { createClient } from "@supabase/supabase-js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { count, error } = await supabase
    .from("business_analysis")
    .select("*", { count: "exact", head: true })
    .is("ai_score", null);
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Remaining pending analysis records:", count);
  }
}

test();
