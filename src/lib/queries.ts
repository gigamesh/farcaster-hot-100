import { FOLLOWER_THRESHOLD } from "@lib/constants";
import { dummyUserData } from "@lib/dummyData";
import { clampValue } from "@lib/utils";
import { Client } from "pg";

if (!process.env.DATABASE_PW) {
  throw new Error("DATABASE_PW is not set");
}

if (!process.env.NEYNAR_API_KEY) {
  throw new Error("NEYNAR_API_KEY is not set");
}

const db = new Client({
  host: "db.neynar.com",
  database: "farcaster",
  user: "241468",
  port: 5432,
  password: process.env.DATABASE_PW,
});

db.connect();

function processeRows(
  rows: {
    target_fid: string | number;
    recent_link_count: string | number;
    total_link_count: string | number;
    ratio: string | number;
  }[]
) {
  return rows.map((d) => {
    return {
      target_fid: parseInt(d.target_fid.toString()),
      recent_link_count: parseInt(d.recent_link_count.toString()),
      total_link_count: parseInt(d.total_link_count.toString()),
      ratio: parseFloat(d.ratio.toString()),
    };
  });
}

export async function trendingByFollowerCount() {
  console.log("trendingByFollowerCount cache miss");

  if (process.env.NODE_ENV === "development") {
    console.log("Using dummy response");
    return {
      time: new Date().toISOString(),
      userData: dummyUserData,
    };
  }

  const queryResult = await trendingQuery();
  const profileData = await getProfileData(
    queryResult.rows.map((d) => d.target_fid)
  );
  const queryRows = processeRows(queryResult.rows).slice(0, 100);

  const userData = profileData.rows
    .map((u) => {
      const matchingFid = queryRows.find((d: any) => d.target_fid === u.fid);

      if (!matchingFid) {
        throw new Error(`No matching fid for user ${u.fid}`);
      }

      return {
        fid: u.fid,
        username: u.fname,
        displayName: u.display_name,
        pfpUrl: u.avatar_url,
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

  console.log(userData);

  return {
    time: new Date().toISOString(),
    userData,
  };
}

async function trendingQuery() {
  return await db.query(/* sql */ `WITH RecentLinks AS (
    SELECT
      target_fid,
      COUNT(*) AS recent_link_count
    FROM
      links
    WHERE
      created_at > NOW() - INTERVAL '24 hours'
    GROUP BY
      target_fid
  ),
  TotalLinks AS (
    SELECT
      target_fid,
      COUNT(*) AS total_link_count
    FROM
      links
    GROUP BY
      target_fid
    HAVING
      COUNT(*) >= ${FOLLOWER_THRESHOLD}
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
  )
  SELECT
    e.target_fid,
    rl.recent_link_count,
    tl.total_link_count,
    COALESCE(rl.recent_link_count, 0) :: DECIMAL / tl.total_link_count AS ratio
  FROM
    EligibleFIDs e
    LEFT JOIN RecentLinks rl ON e.target_fid = rl.target_fid
    INNER JOIN TotalLinks tl ON e.target_fid = tl.target_fid
    LEFT JOIN FilteredReactions fr ON e.target_fid = fr.target_fid -- Correctly join FilteredReactions here
  WHERE
    tl.total_link_count >= 500 -- Ensure consistency with TotalLinks CTE condition
  ORDER BY
    ratio DESC
  LIMIT
    100;`);
}

export async function getProfileData(fids: string[]) {
  return await db.query(
    /* sql */ `SELECT fid, fname, display_name, avatar_url
              FROM profile_with_addresses
              WHERE fid = ANY($1::bigint[]);`,
    [fids]
  );
}
