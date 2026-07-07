import mammoth from "mammoth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传 .txt 或 .docx 文件。" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) {
    return NextResponse.json({ text: await file.text() });
  }

  if (name.endsWith(".docx")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return NextResponse.json({ text: result.value });
  }

  return NextResponse.json({ error: "仅支持 .txt 和 .docx 文件。" }, { status: 400 });
}
