import { Container } from "@components/Container";
import { ThemeToggle } from "@components/ThemeToggle";
import Title from "@components/Title";
import { trendingByFollowerCount } from "@lib/queries";
import { clampValue, cn, getProfileUrl } from "@lib/utils";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { Metadata } from "next";
import Image from "next/image";
import React from "react";

// export const revalidate = 21600;
export const revalidate = 300;
export const maxDuration = 300;

const TITLE = "🔥 Farcaster Hot 100 🔥";
const DESCRIPTION = "Trending Farcaster accounts";
const SEO_IMAGE = "https://fc.hot100.xyz/seo.png";

export const metadata: Metadata = {
  title: TITLE,
  applicationName: TITLE,
  authors: [
    {
      name: "Gigamesh",
      url: "https://warpcast.com/gigamesh",
    },
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://fc.hot100.xyz",
    siteName: TITLE,
    images: [{ url: SEO_IMAGE, width: 1200, height: 604 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@gigamesh",
    images: [SEO_IMAGE],
  },
  description: DESCRIPTION,
};

const rowStyles =
  "grid grid-cols-[30px_40px_1.5fr_minmax(100px,1fr)_minmax(100px,1fr)] md:grid-cols-[30px_50px_2fr_minmax(100px,1fr)_minmax(100px,1fr)] w-full w-full  py-2";

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
            value: matchingFid.recent_link_count / matchingFid.total_link_count,
            max: 1,
          }) * 100
        ).toFixed(2),
      };
    })
    .sort((a, b) => Number(b.followerIncrease) - Number(a.followerIncrease));

  return (
    <>
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
          <Title lastUpdate={queryResult.time} />
          <div className="mt-6 max-w-[800px]">
            <div
              className={cn(rowStyles, "mb-8 uppercase border-b-[1px] pb-2")}
            >
              <span></span>
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
            {userData.map((user, i) => (
              <a
                href={getProfileUrl(user.username)}
                target="_blank"
                key={user.fid}
                className={cn(rowStyles, "rounded-lg hover:bg-muted")}
              >
                <span>{i + 1}</span>
                <Image
                  className="rounded-full h-[30px] w-[30px]"
                  src={user.pfpUrl}
                  alt={user.username}
                  height={30}
                  width={30}
                  style={{ objectFit: "cover" }}
                />

                <span>{user.displayName}</span>
                <span className="flex justify-end">
                  <span className="text-green-500 mr-1">▲</span>{" "}
                  {user.followerIncrease}%
                </span>
                <span className="text-right">
                  {user.followerCount.toLocaleString()}
                </span>
              </a>
            ))}
          </div>
        </main>
      </Container>
    </>
  );
}
