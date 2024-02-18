import { trendingByFollowerCount } from "@lib/queries";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const revalidate = 8 * 60 * 60;
export const maxDuration = 300;

export async function GET() {
  const leaderboard = await trendingByFollowerCount();

  revalidatePath("/");

  return NextResponse.json(leaderboard);
}
