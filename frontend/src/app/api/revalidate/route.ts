import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const expected = process.env.REVALIDATE_SECRET;

    if (!expected || body?.secret !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paths: string[] = Array.isArray(body?.paths) ? body.paths : ["/"];
    for (const p of paths) {
      if (typeof p === "string" && p.startsWith("/")) {
        revalidatePath(p);
      }
    }

    return NextResponse.json({ revalidated: true, paths });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

