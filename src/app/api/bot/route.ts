import neynarClient from "@lib/neynarClient";
import { trendingByFollowerCount } from "@lib/queries";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const revalidate = 0;

const BOT_SIGNER_UUID = process.env.BOT_SIGNER_UUID;

/** Called by Vercel cron and posts on Farcaster via Neynar API */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  if (typeof BOT_SIGNER_UUID !== "string") {
    throw new Error("BOT_SIGNER_UUID is not set");
  }

  const { userData } = await trendingByFollowerCount();
  const top10 = userData.slice(0, 10).filter((u) => !!u.username);

  let message = "Congrats to the currently top trending Farcasters 🚀🎉\n\n";
  top10.forEach((user, index) => {
    message += `#${index + 1} @${user.username}\n`;
  });

  // message += `\n\n\nhttps://fc.hot100.xyz\n`;

  console.log(message);

  if (process.env.NODE_ENV !== "development") {
    // IMPORTANT: if you run this in development, it will use the dummy data response!
    try {
      const cast = await neynarClient.publishCast(BOT_SIGNER_UUID, message, {
        channelId: "farcaster",
        embeds: [{ url: "https://fc.hot100.xyz" }],
      });

      console.log("cast published:", cast);

      return NextResponse.json({ success: true, cast });
    } catch (err) {
      console.error(err);
      return new Response("Server error", {
        status: 500,
      });
    }
  }
}
