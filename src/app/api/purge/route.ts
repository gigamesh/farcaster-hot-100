import { checkToken } from "@lib/utils";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { authorized, response } = checkToken(req);
  if (!authorized) {
    return response;
  }

  revalidatePath("/");

  return NextResponse.json({ revalidated: true });
}
