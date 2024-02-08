import React from "react";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import Image from "next/image";
import { ThemeToggle } from "../components/ThemeToggle";
import { Container } from "@components/Container";
import { clampValue, cn } from "@lib/utils";

console.log("here1");

export default async function Home() {
  console.log("here2");
  if (!process.env.NEYNAR_QUERY_URL) {
    throw new Error("NEYNAR_QUERY_URL is not set");
  }

  if (!process.env.NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY is not set");
  }

  let userData: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    followerCount: number;
    newFollowers: number;
    followerIncrease: string;
  }[] = [];

  const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY);

  const res = await fetch(process.env.NEYNAR_QUERY_URL, {
    next: { revalidate: 60 * 60 * 2 },
  }).then((res) => res.json());

  if (res.query_result) {
    const queryRows = res.query_result.data.rows.slice(0, 100);
    const bulkUsers = await neynar.fetchBulkUsers(
      queryRows.map((d: any) => d.target_fid),
      {}
    );

    userData = bulkUsers.users
      .map((u) => {
        const matchingFid = queryRows.find((d: any) => d.target_fid === u.fid);

        return {
          fid: u.fid,
          username: u.username,
          displayName: u.display_name,
          pfpUrl: u.pfp_url,
          followerCount: matchingFid.total_link_count,
          newFollowers: matchingFid.recent_link_count,
          followerIncrease: (
            clampValue({
              value:
                matchingFid.recent_link_count / matchingFid.total_link_count,
              max: 1,
            }) * 100
          ).toFixed(2),
        };
      })
      .sort((a, b) => Number(b.followerIncrease) - Number(a.followerIncrease));

    const rowStyles = "grid grid-cols-[60px_2fr_1fr_1fr] w-full w-full  p-2";

    console.log(userData);

    return (
      <Container variant="page">
        <header className="flex justify-end p-2">
          <ThemeToggle />
        </header>
        <main className="flex min-h-screen flex-col items-center justify-between pb-24">
          <h1>🔥 Farcaster Hot 100 🔥</h1>
          <p className="opacity-70">Trending accounts of the past day</p>
          <div className="mt-6 max-w-[800px]">
            <div
              className={cn(rowStyles, "mb-8 uppercase border-b-[1px] pb-2")}
            >
              <span></span>
              <span className="self-end">Name</span>
              <span className="text-right">
                Follower
                <br />
                Increase
              </span>
              <span className="text-right">
                Follower
                <br />
                Total
              </span>
            </div>
            {userData.map((user) => (
              <a
                href={`https://warpcast.com/${user.username}`}
                target="_blank"
                key={user.fid}
                className={cn(rowStyles, "rounded-lg hover:bg-muted")}
              >
                <Image
                  className="rounded-full h-[30px] w-[30px]"
                  src={user.pfpUrl}
                  alt={user.username}
                  height={30}
                  width={30}
                />
                <span>{user.displayName}</span>
                <span className="text-right">
                  <span className="text-green-500">▲</span>{" "}
                  {user.followerIncrease}%
                </span>
                <span className="text-right">{user.followerCount}</span>
              </a>
            ))}
          </div>
        </main>
      </Container>
    );
  } else {
    return <div>No data</div>;
  }
}
