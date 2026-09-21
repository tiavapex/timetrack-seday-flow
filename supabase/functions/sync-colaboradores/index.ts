import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SYNC_SECRET = Deno.env.get("SYNC_SECRET");
  const VPS_API_URL = Deno.env.get("VPS_API_URL");
  const VPS_API_KEY = Deno.env.get("VPS_API_KEY");

  if (!SYNC_SECRET || !VPS_API_URL || !VPS_API_KEY) {
    return json({ error: "Integração não configurada (VPS_API_URL / VPS_API_KEY / SYNC_SECRET)" }, 500);
  }
  if (req.headers.get("x-sync-secret") !== SYNC_SECRET) {
    return json({ error: "Não autorizado" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let body: { full?: boolean; triggered_by?: string } = {};
  try {
    body = await req.json();
  } catch (_e) {
    body = {};
  }
  const full = body.full === true;

  let batchId: string | null = null;

  try {
    // marca d'agua: extracted_at do ultimo lote bem sucedido
    let updatedSince: string | null = null;
    if (!full) {
      const { data: last } = await supabase
        .schema("bronze")
        .from("ingest_batches")
        .select("extracted_at")
        .eq("entity", "colaboradores")
        .in("status", ["success", "partial"])
        .not("extracted_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      updatedSince = last?.extracted_at ?? null;
    }

    const { data: batch, error: batchError } = await supabase
      .schema("bronze")
      .from("ingest_batches")
      .insert({
        source: "vps_fponto",
        entity: "colaboradores",
        status: "running",
        triggered_by: body.triggered_by ?? (full ? "manual_full" : "manual"),
      })
      .select("id")
      .single();
    if (batchError) throw batchError;
    batchId = batch.id as string;

    const limit = 200;
    let offset = 0;
    let total = 0;
    let extractedAt: string | null = null;

    while (true) {
      const url = new URL("/v1/colaboradores", VPS_API_URL);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));
      if (updatedSince) url.searchParams.set("updated_since", updatedSince);

      const res = await fetch(url.toString(), { headers: { "X-API-Key": VPS_API_KEY } });
      if (!res.ok) {
        throw new Error(`API da VPS respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
      }
      const page = await res.json();
      const rows: Array<Record<string, unknown>> = page?.rows ?? [];
      extractedAt = page?.extracted_at ?? extractedAt;

      if (rows.length > 0) {
        const { error: rawError } = await supabase
          .schema("bronze")
          .from("colaboradores_raw")
          .insert(
            rows.map((r) => ({
              batch_id: batchId,
              origem_id: r.origem_id != null ? String(r.origem_id) : null,
              payload: r,
              extracted_at: extractedAt,
            })),
          );
        if (rawError) throw rawError;
        total += rows.length;
      }

      const next = page?.next_offset;
      if (rows.length < limit || next == null) break;
      offset = Number(next);
    }

    await supabase
      .schema("bronze")
      .from("ingest_batches")
      .update({ extracted_at: extractedAt ?? new Date().toISOString(), rows_fetched: total })
      .eq("id", batchId);

    const { data: result, error: pipeError } = await supabase
      .schema("gold")
      .rpc("fn_run_pipeline", { p_batch: batchId });
    if (pipeError) throw pipeError;

    return json({ ok: true, batch_id: batchId, full, ...(result ?? {}) });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (batchId) {
      await supabase
        .schema("bronze")
        .from("ingest_batches")
        .update({ status: "error", finished_at: new Date().toISOString(), error_message: message })
        .eq("id", batchId);
    }
    console.error("sync-colaboradores falhou:", message);
    return json({ ok: false, batch_id: batchId, error: message }, 500);
  }
});
