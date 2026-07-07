import { NextResponse } from "next/server";
import { getProject } from "@/lib/storage/project-store";
import { exportProjectAsCsv, exportProjectAsJson, exportProjectAsMarkdown } from "@/lib/workflow/exporters";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = await getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "md";
  const safeTitle = project.title.replace(/[\\/:*?"<>|]/g, "-");

  if (format === "json") {
    return new Response(exportProjectAsJson(project), {
      headers: {
        "Content-Disposition": `attachment; filename="${safeTitle}.json"`,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  if (format === "csv") {
    return new Response(`\uFEFF${exportProjectAsCsv(project)}`, {
      headers: {
        "Content-Disposition": `attachment; filename="${safeTitle}-shots.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  return new Response(exportProjectAsMarkdown(project), {
    headers: {
      "Content-Disposition": `attachment; filename="${safeTitle}.md"`,
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
