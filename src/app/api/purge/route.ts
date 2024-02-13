import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  revalidatePath("/");

  return NextResponse.json({ revalidated: true });
}
