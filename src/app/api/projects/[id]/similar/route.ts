import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeProjects } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    if (!projectId) {
      return NextResponse.json({ error: "Missing project ID" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Call get_similar_projects RPC
    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "get_similar_projects",
      {
        target_project_id: projectId,
        match_limit: 4,
      }
    );

    if (rpcErr) {
      console.error("[Similar Projects RPC Error]:", rpcErr.message);
      return NextResponse.json([], {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      });
    }

    const sanitized = sanitizeProjects(rpcData || []);

    return NextResponse.json(sanitized, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("[Similar Projects Exception]:", err);
    return NextResponse.json([], {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  }
}
