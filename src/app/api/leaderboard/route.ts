import { trendingByFollowerCount } from "@lib/queries";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const revalidate = 21600;
export const maxDuration = 300;

export async function GET() {
  const leaderboard = await trendingByFollowerCount();

  revalidatePath("/");

  return NextResponse.json(leaderboard);
}
