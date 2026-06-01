console.log("Env keys:", Object.keys(process.env).filter(k => k.toLowerCase().includes("proxy") || k.toLowerCase().includes("http") || k.toLowerCase().includes("env") || k.includes("SUPABASE")));
console.log("HTTP_PROXY:", process.env.HTTP_PROXY);
console.log("HTTPS_PROXY:", process.env.HTTPS_PROXY);
console.log("NO_PROXY:", process.env.NO_PROXY);
console.log("SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
