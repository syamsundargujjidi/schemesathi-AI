import { createFileRoute } from "@tanstack/react-router";
import { checkOfficialLink } from "@/lib/link-check.server";

const JOB_NAME = "link_validation";
const BATCH_SIZE = 25;
const LEASE_MINUTES = 10;
// Re-check a scheme's link at most once per this many hours.
const RECHECK_AFTER_HOURS = 24;

type SchemeRow = {
  id: string;
  slug: string;
  official_source_url: string | null;
  official_website: string | null;
  apply_url: string | null;
  link_status: string;
  link_fail_count: number;
};

async function handle() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: job, error: jobError } = await supabaseAdmin
    .from("validation_jobs")
    .select("*")
    .eq("job_name", JOB_NAME)
    .maybeSingle();

  if (jobError) {
    console.error("[validate-links] job row read failed", jobError);
    return Response.json({ ok: false, error: jobError.message }, { status: 500 });
  }
  if (!job) {
    return Response.json({ ok: false, error: "job row missing" }, { status: 500 });
  }
  if (job.paused) {
    console.log("[validate-links] paused:", job.paused_reason);
    return Response.json({ ok: true, skipped: "paused", reason: job.paused_reason });
  }

  const now = new Date();
  if (job.lease_until && new Date(job.lease_until) > now) {
    console.log("[validate-links] another run holds the lease");
    return Response.json({ ok: true, skipped: "locked" });
  }

  const leaseUntil = new Date(now.getTime() + LEASE_MINUTES * 60_000).toISOString();
  const { data: leased, error: leaseError } = await supabaseAdmin
    .from("validation_jobs")
    .update({ lease_until: leaseUntil, last_run_at: now.toISOString() })
    .eq("job_name", JOB_NAME)
    .or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`)
    .select("id");

  if (leaseError) {
    console.error("[validate-links] lease failed", leaseError);
    return Response.json({ ok: false, error: leaseError.message }, { status: 500 });
  }
  if (!leased || leased.length === 0) {
    return Response.json({ ok: true, skipped: "locked" });
  }

  const staleBefore = new Date(now.getTime() - RECHECK_AFTER_HOURS * 3_600_000).toISOString();
  let checked = 0;
  let invalid = 0;
  let unreachable = 0;
  let ok = 0;

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("schemes")
      .select("id, slug, official_source_url, official_website, apply_url, link_status, link_fail_count")
      .or(`link_checked_at.is.null,link_checked_at.lt.${staleBefore}`)
      .order("link_checked_at", { ascending: true, nullsFirst: true })
      .order("slug", { ascending: true })
      .limit(BATCH_SIZE);

    if (error) throw error;

    const list = (rows ?? []) as SchemeRow[];
    const CONCURRENCY = 5;
    for (let i = 0; i < list.length; i += CONCURRENCY) {
      await Promise.all(
        list.slice(i, i + CONCURRENCY).map(async (row) => {
          const url = row.official_source_url || row.official_website || row.apply_url;
          const result = await checkOfficialLink(url);
          const failCount = result.status === "ok" ? 0 : (row.link_fail_count ?? 0) + 1;

          // Idempotent progress marking: each scheme is stamped as it is processed.
          const { error: upErr } = await supabaseAdmin
            .from("schemes")
            .update({
              link_status: result.status,
              link_http_status: result.httpStatus,
              link_checked_at: new Date().toISOString(),
              link_fail_count: failCount,
            })
            .eq("id", row.id);
          if (upErr) console.error("[validate-links] update failed", row.slug, upErr);

          checked += 1;
          if (result.status === "ok") ok += 1;
          else if (result.status === "invalid") invalid += 1;
          else unreachable += 1;
        }),
      );
    }
  } catch (err) {
    console.error("[validate-links] run failed", err);
    await supabaseAdmin
      .from("validation_jobs")
      .update({ lease_until: null })
      .eq("job_name", JOB_NAME);
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }

  await supabaseAdmin
    .from("validation_jobs")
    .update({
      lease_until: null,
      last_finished_at: new Date().toISOString(),
      checked_last_run: checked,
    })
    .eq("job_name", JOB_NAME);

  console.log(`[validate-links] checked ${checked} (ok ${ok}, unreachable ${unreachable}, invalid ${invalid})`);
  return Response.json({ ok: true, checked, ok_links: ok, unreachable, invalid });
}

export const Route = createFileRoute("/api/public/hooks/validate-links")({
  server: {
    handlers: {
      POST: handle,
      GET: handle,
    },
  },
});
