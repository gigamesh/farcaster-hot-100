import { WARPCAST_API_BASE_URL } from "@lib/constants";
import { dummyUserData } from "@lib/dummyData";
import { unstable_cache } from "next/cache";
import { Client } from "pg";

if (!process.env.DATABASE_PW) {
  throw new Error("DATABASE_PW is not set");
}

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not set");
}

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const HOST = "db.neynar.com";
const DATABASE = "farcaster";
const USER = "241468";
const PORT = 5432;
const PASSWORD = process.env.DATABASE_PW;

const db = new Client({
  connectionString: `postgres://${USER}:${PASSWORD}@${HOST}:${PORT}/${DATABASE}?sslmode=prefer`,
});

db.connect();

async function dbCall() {
  console.log("trendingByFollowerCount cache miss");

  if (process.env.NODE_ENV === "development") {
    console.log("Using dummy response");
    return {
      time: new Date().toISOString(),
      userData: dummyUserData,
    };
  }

  const warpcastResponse = (await (
    await fetch(`${WARPCAST_API_BASE_URL}power-badge-users`)
  ).json()) as { result: { fids: number[] } };

  const powerUserFids = warpcastResponse.result.fids;

  const queryResult = await trendingQuery(powerUserFids);

  const userData = queryResult.rows
    .map((u) => {
      return {
        fid: u.target_fid,
        username: u.fname,
        displayName: u.display_name,
        pfpUrl: u.avatar_url,
        followerCount: u.total_link_count,
        newFollowers: u.recent_link_count,
        followerIncrease: u.ratio,
      };
    })
    .sort((a, b) => Number(b.followerIncrease) - Number(a.followerIncrease));

  console.log(userData);

  return {
    time: new Date().toISOString(),
    userData,
  };
}

async function trendingQuery(powerUserFids: number[]) {
  const fids = powerUserFids.map((n) => n.toString()).join(",");

  return await db.query(/* sql */ `WITH RecentLinks AS (
    SELECT
      target_fid,
      COUNT(*) AS recent_link_count
    FROM
      links
    WHERE
      created_at > NOW() - INTERVAL '24 hours'
      AND target_fid IN (${fids})
    GROUP BY
      target_fid
  ),
  TotalLinks AS (
    SELECT
      target_fid,
      COUNT(*) AS total_link_count
    FROM
      links
    WHERE
      target_fid IN (${fids})
    GROUP BY
      target_fid
  ),
  FilteredReactions AS (
    SELECT
      r.target_fid
    FROM
      reactions r
      JOIN casts c ON r.target_hash = c.hash
    WHERE
      r.created_at > NOW() - INTERVAL '24 hours'
      AND NOT (
        (
          LOWER(c.text) LIKE '%like%'
          AND LOWER(c.text) LIKE '%follow%'
        )
        OR (
          LOWER(c.text) LIKE '%like%'
          AND LOWER(c.text) LIKE '%recast%'
        )
        OR (
          LOWER(c.text) LIKE '%like%'
          AND LOWER(c.text) LIKE '%free%'
        )
        OR (
          LOWER(c.text) LIKE '%follow%'
          AND LOWER(c.text) LIKE '%recast%'
        )
        OR (
          LOWER(c.text) LIKE '%follow%'
          AND LOWER(c.text) LIKE '%free%'
        )
        OR (
          LOWER(c.text) LIKE '%recast%'
          AND LOWER(c.text) LIKE '%free%'
        )
      )
    GROUP BY
      r.target_fid
    HAVING
      COUNT(*) >= 200
  ),
  EligibleFIDs AS (
    SELECT
      tl.target_fid
    FROM
      TotalLinks tl
      INNER JOIN FilteredReactions fr ON tl.target_fid = fr.target_fid
  ),
  ProfileData AS (
    SELECT
      fid,
      MAX(display_name) AS display_name,
      -- Assuming taking the max is acceptable
      fname,
      MAX(avatar_url) AS avatar_url -- Assuming taking the max is acceptable
    FROM
      profile_with_addresses
    WHERE
      fid IN (${fids})
    GROUP BY
      fid,
      fname
  )
  SELECT
    e.target_fid,
    pd.display_name,
    pd.fname,
    pd.avatar_url,
    rl.recent_link_count,
    tl.total_link_count,
    COALESCE(rl.recent_link_count, 0) :: DECIMAL / tl.total_link_count AS ratio
  FROM
    EligibleFIDs e
    LEFT JOIN RecentLinks rl ON e.target_fid = rl.target_fid
    INNER JOIN TotalLinks tl ON e.target_fid = tl.target_fid
    LEFT JOIN ProfileData pd ON e.target_fid = pd.fid
  ORDER BY
    ratio DESC
  LIMIT
    100;`);
}

export const trendingByFollowerCount = unstable_cache(
  dbCall,
  ["trending-by-followers"],
  {
    revalidate: 8 * 60 * 60,
  }
);
