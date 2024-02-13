import neynarClient from "@lib/neynarClient";
import { trendingByFollowerCount } from "@lib/queries";
import { NextResponse } from "next/server";
import { isApiErrorResponse } from "@neynar/nodejs-sdk";

export const revalidate = 21600;
export const maxDuration = 300;

const BOT_SIGNER_UUID = process.env.BOT_SIGNER_UUID;

/** Called by Vercel cron and posts on Farcaster via Neynar API */
export async function POST() {
  if (typeof BOT_SIGNER_UUID !== "string") {
    throw new Error("BOT_SIGNER_UUID is not set");
  }

  const { userData } = await trendingByFollowerCount();
  const firstTen = userData.slice(0, 10);

  let message =
    "Congrats to the top 10 trending users from the past day! 🚀🎉\n\n";
  firstTen.forEach((user, index) => {
    message += `#${index + 1} @${user.username}\n`;
  });

  message += `\nhttps://fc.hot100.xyz\n\n`;

  try {
    await neynarClient.publishCast(BOT_SIGNER_UUID, message, {
      channelId: "farcaster",
      embeds: [{ url: "https://fc.hot100.xyz" }],
    });
  } catch (err) {
    if (isApiErrorResponse(err)) {
      console.log(err.response.data);
    } else console.log(err);
  }

  // const leaderboard = await trendingByFollowerCount();

  // revalidatePath("/");

  // return NextResponse.json(leaderboard);

  return NextResponse.json({ success: true });
}
