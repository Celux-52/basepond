import { createClient } from "@/lib/supabase/server";
import { runBusinessDiscovery } from "../engine/orchestrator";

// This function processes a single job from the queue
export async function processNextJob() {
  const supabase = await createClient();

  // 1. Fetch the next pending job
  const { data: job, error: fetchError } = await supabase
    .from("job_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (fetchError || !job) {
    return { status: "no_jobs", count: 0 };
  }

  // 2. Mark as processing to prevent duplicate processing
  await supabase
    .from("job_queue")
    .update({ status: "processing", started_at: new Date().toISOString() })
    .eq("id", job.id);

  try {
    const payload = job.payload as any;

    if (job.job_type === "deep_scan") {
      // Run the orchestrator completely in the background
      const generator = runBusinessDiscovery(
        payload.query,
        payload.city,
        payload.category,
        payload.amount,
        job.user_id
      );

      // Iterate the generator to completion without streaming
      let scannedCount = 0;
      for await (const result of generator) {
        scannedCount++;
      }

      // Mark completed
      await supabase
        .from("job_queue")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", job.id);

      return { status: "success", type: job.job_type, scanned: scannedCount };
    }

    // Other job types (enrichment, batch_ai) can go here
    throw new Error(`Unsupported job type: ${job.job_type}`);

  } catch (error: any) {
    console.error("Job Processing Error:", error);
    await supabase
      .from("job_queue")
      .update({ 
        status: "failed", 
        error_message: error?.message || "Unknown error",
        completed_at: new Date().toISOString() 
      })
      .eq("id", job.id);
      
    return { status: "failed", error: error?.message };
  }
}
