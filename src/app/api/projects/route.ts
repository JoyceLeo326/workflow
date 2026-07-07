import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/storage/project-store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ projects: await listProjects() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    sourceText?: string;
    modelConfig?: { baseUrl?: string; model?: string };
  };

  if (!body.sourceText?.trim()) {
    return NextResponse.json({ error: "请先输入或上传小说文本。" }, { status: 400 });
  }

  const project = await createProject({
    title: body.title?.trim() || "未命名项目",
    sourceText: body.sourceText,
    modelConfig: body.modelConfig,
  });

  return NextResponse.json({ project }, { status: 201 });
}
