import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  python: { language: "python", version: "3.10.0" },
  javascript: { language: "javascript", version: "18.15.0" },
  java: { language: "java", version: "15.0.2" },
  cpp: { language: "c++", version: "10.2.0" },
};

const MAX_CODE_BYTES = 64_000;
const PISTON_TIMEOUT_MS = 10_000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const language = typeof body?.language === "string" ? body.language : "";
    const code = typeof body?.code === "string" ? body.code : "";

    const mapped = LANGUAGE_MAP[language];
    if (!mapped) {
      return new Response(JSON.stringify({ error: "Unsupported language" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (code.length === 0) {
      return new Response(JSON.stringify({ error: "No code provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new TextEncoder().encode(code).length > MAX_CODE_BYTES) {
      return new Response(JSON.stringify({ error: "Code is too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pistonPayload = {
      language: mapped.language,
      version: mapped.version,
      files: [{ name: "main", content: code }],
      compile_timeout: PISTON_TIMEOUT_MS,
      run_timeout: PISTON_TIMEOUT_MS,
    };

    const pistonRes = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pistonPayload),
    });

    if (!pistonRes.ok) {
      return new Response(JSON.stringify({ error: "Execution service unavailable" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pistonData = await pistonRes.json();

    const output: { stdout: string; stderr: string; compileOutput: string } = {
      stdout: pistonData?.run?.stdout ?? "",
      stderr: pistonData?.run?.stderr ?? "",
      compileOutput: pistonData?.compile?.output ?? pistonData?.compile?.stderr ?? "",
    };

    return new Response(
      JSON.stringify({
        success: true,
        language: mapped.language,
        output,
        signal: pistonData?.run?.signal ?? null,
        exitCode: pistonData?.run?.code ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to run code" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
