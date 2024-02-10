import React from "react";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import Image from "next/image";
import { ThemeToggle } from "../components/ThemeToggle";
import { Container } from "@components/Container";
import { clampValue, cn } from "@lib/utils";
import { trendingByFollowerCount } from "@lib/queries";

export default async function Home() {
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

  try {
    const queryResult = await trendingByFollowerCount();

    if (!queryResult.rows) {
      return <div>No data</div>;
    }

    const queryRows = queryResult.rows.slice(0, 100);
    const bulkUsers = await neynar.fetchBulkUsers(
      queryRows.map((d: any) => d.target_fid),
      {}
    );

    userData = bulkUsers.users
      .map((u) => {
        const matchingFid = queryRows.find((d: any) => d.target_fid === u.fid);

        if (!matchingFid) {
          throw new Error(`No matching fid for user ${u.fid}`);
        }

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

    return (
      <Container variant="page">
        <header className="flex justify-between p-2">
          <ThemeToggle />
          <div>
            <a href="https://warpcast.com/gigamesh" target="_blank">
              <span> By Gigamesh</span>
              <Image
                className="rounded-full h-[30px] w-[30px] inline ml-2"
                src="https://res.cloudinary.com/merkle-manufactory/image/fetch/c_fill,f_jpg,w_168/https%3A%2F%2Fi.imgur.com%2F3hrPNK8.jpg"
                alt="Gigamesh"
                height={30}
                width={30}
              />
            </a>
          </div>
        </header>
        <main className="flex min-h-screen flex-col items-center justify-between pb-24">
          <h1>🔥 Farcaster Hot 100 🔥</h1>
          <p className="flex flex-col text-muted-foreground justify-center items-center">
            <span>Trending accounts of the past day</span>
            <span>
              Last updated:{" "}
              {new Intl.DateTimeFormat("en-GB", {
                weekday: "short",
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: true,
              }).format(new Date(queryResult.time))}
            </span>
          </p>
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
                <span className="text-right flex">
                  <span className="text-green-500 mr-1">▲</span>{" "}
                  {user.followerIncrease}%
                </span>
                <span className="text-right">{user.followerCount}</span>
              </a>
            ))}
          </div>
        </main>
      </Container>
    );
  } catch (error) {
    console.error(error);
    return <div>Error</div>;
  }
}
