import { FOLLOWER_THRESHOLD, REVALIDATION_INTERVAL } from "@lib/constants";
import { unstable_cache } from "next/cache";
import { Client } from "pg";

if (!process.env.DATABASE_PW) {
  throw new Error("DATABASE_PW is not set");
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

export const trendingByFollowerCount = unstable_cache(
  dbCall,
  ["trending-by-followers"],
  {
    revalidate: REVALIDATION_INTERVAL,
  }
);

async function dbCall() {
  if (process.env.NODE_ENV === "development") {
    console.log("Using dummy response");
    return dummyResponse;
  }

  const queryResult = await db.query(/* sql */ `WITH RecentLinks AS (
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

  console.log(processeRows(queryResult.rows));

  return {
    time: new Date().toISOString(),
    rows: processeRows(queryResult.rows),
  };
}

const dummyResponse = {
  time: new Date(1707589585586).toISOString(),
  rows: processeRows([
    {
      target_fid: 332307,
      recent_link_count: 1064,
      total_link_count: 1064,
      ratio: 1,
    },
    {
      target_fid: 331150,
      recent_link_count: 3212,
      total_link_count: 3212,
      ratio: 1,
    },
    {
      target_fid: 6214,
      recent_link_count: 4098,
      total_link_count: 4187,
      ratio: 0.9787437305946979,
    },
    {
      target_fid: 251942,
      recent_link_count: 631,
      total_link_count: 659,
      ratio: 0.9575113808801214,
    },
    {
      target_fid: 193854,
      recent_link_count: 5180,
      total_link_count: 5468,
      ratio: 0.9473299195318216,
    },
    {
      target_fid: 322543,
      recent_link_count: 2104,
      total_link_count: 2242,
      ratio: 0.9384478144513827,
    },
    {
      target_fid: 1992,
      recent_link_count: 3476,
      total_link_count: 4325,
      ratio: 0.803699421965318,
    },
    {
      target_fid: 324362,
      recent_link_count: 2930,
      total_link_count: 3721,
      ratio: 0.7874227358237033,
    },
    {
      target_fid: 16496,
      recent_link_count: 2983,
      total_link_count: 3891,
      ratio: 0.7666409663325623,
    },
    {
      target_fid: 20928,
      recent_link_count: 8409,
      total_link_count: 11018,
      ratio: 0.763205663459793,
    },
    {
      target_fid: 245681,
      recent_link_count: 1315,
      total_link_count: 1896,
      ratio: 0.6935654008438819,
    },
    {
      target_fid: 248389,
      recent_link_count: 566,
      total_link_count: 861,
      ratio: 0.6573751451800233,
    },
    {
      target_fid: 2201,
      recent_link_count: 926,
      total_link_count: 1528,
      ratio: 0.606020942408377,
    },
    {
      target_fid: 261114,
      recent_link_count: 312,
      total_link_count: 553,
      ratio: 0.5641952983725136,
    },
    {
      target_fid: 329883,
      recent_link_count: 9073,
      total_link_count: 16746,
      ratio: 0.5418010271109519,
    },
    {
      target_fid: 7168,
      recent_link_count: 524,
      total_link_count: 995,
      ratio: 0.5266331658291458,
    },
    {
      target_fid: 300839,
      recent_link_count: 278,
      total_link_count: 594,
      ratio: 0.468013468013468,
    },
    {
      target_fid: 255448,
      recent_link_count: 722,
      total_link_count: 1671,
      ratio: 0.4320766008378217,
    },
    {
      target_fid: 10502,
      recent_link_count: 287,
      total_link_count: 682,
      ratio: 0.4208211143695015,
    },
    {
      target_fid: 2824,
      recent_link_count: 407,
      total_link_count: 1026,
      ratio: 0.3966861598440546,
    },
    {
      target_fid: 21071,
      recent_link_count: 5017,
      total_link_count: 13278,
      ratio: 0.37784304865190543,
    },
    {
      target_fid: 294681,
      recent_link_count: 377,
      total_link_count: 1037,
      ratio: 0.36354869816779173,
    },
    {
      target_fid: 268892,
      recent_link_count: 261,
      total_link_count: 726,
      ratio: 0.359504132231405,
    },
    {
      target_fid: 269295,
      recent_link_count: 314,
      total_link_count: 890,
      ratio: 0.35280898876404493,
    },
    {
      target_fid: 227062,
      recent_link_count: 284,
      total_link_count: 821,
      ratio: 0.3459196102314251,
    },
    {
      target_fid: 16176,
      recent_link_count: 185,
      total_link_count: 542,
      ratio: 0.3413284132841328,
    },
    {
      target_fid: 19289,
      recent_link_count: 400,
      total_link_count: 1200,
      ratio: 0.3333333333333333,
    },
    {
      target_fid: 322783,
      recent_link_count: 1167,
      total_link_count: 3543,
      ratio: 0.3293818797629128,
    },
    {
      target_fid: 15303,
      recent_link_count: 265,
      total_link_count: 857,
      ratio: 0.30921820303383896,
    },
    {
      target_fid: 246514,
      recent_link_count: 188,
      total_link_count: 610,
      ratio: 0.3081967213114754,
    },
    {
      target_fid: 252221,
      recent_link_count: 311,
      total_link_count: 1034,
      ratio: 0.30077369439071566,
    },
    {
      target_fid: 17542,
      recent_link_count: 638,
      total_link_count: 2152,
      ratio: 0.29646840148698883,
    },
    {
      target_fid: 244902,
      recent_link_count: 932,
      total_link_count: 3381,
      ratio: 0.2756580893226856,
    },
    {
      target_fid: 16405,
      recent_link_count: 283,
      total_link_count: 1039,
      ratio: 0.27237728585178056,
    },
    {
      target_fid: 5644,
      recent_link_count: 224,
      total_link_count: 843,
      ratio: 0.265717674970344,
    },
    {
      target_fid: 253415,
      recent_link_count: 258,
      total_link_count: 994,
      ratio: 0.2595573440643863,
    },
    {
      target_fid: 249079,
      recent_link_count: 143,
      total_link_count: 562,
      ratio: 0.25444839857651247,
    },
    {
      target_fid: 2902,
      recent_link_count: 899,
      total_link_count: 3563,
      ratio: 0.25231546449621106,
    },
    {
      target_fid: 16601,
      recent_link_count: 171,
      total_link_count: 709,
      ratio: 0.24118476727785615,
    },
    {
      target_fid: 281289,
      recent_link_count: 863,
      total_link_count: 3666,
      ratio: 0.2354064375340971,
    },
    {
      target_fid: 233030,
      recent_link_count: 220,
      total_link_count: 939,
      ratio: 0.23429179978700745,
    },
    {
      target_fid: 287372,
      recent_link_count: 110,
      total_link_count: 501,
      ratio: 0.21956087824351297,
    },
    {
      target_fid: 253424,
      recent_link_count: 162,
      total_link_count: 740,
      ratio: 0.21891891891891893,
    },
    {
      target_fid: 244305,
      recent_link_count: 832,
      total_link_count: 4059,
      ratio: 0.20497659522049766,
    },
    {
      target_fid: 331,
      recent_link_count: 300,
      total_link_count: 1575,
      ratio: 0.19047619047619047,
    },
    {
      target_fid: 277944,
      recent_link_count: 99,
      total_link_count: 531,
      ratio: 0.1864406779661017,
    },
    {
      target_fid: 216557,
      recent_link_count: 159,
      total_link_count: 853,
      ratio: 0.18640093786635403,
    },
    {
      target_fid: 242021,
      recent_link_count: 586,
      total_link_count: 3149,
      ratio: 0.18609082248332803,
    },
    {
      target_fid: 299747,
      recent_link_count: 216,
      total_link_count: 1163,
      ratio: 0.18572656921754085,
    },
    {
      target_fid: 4715,
      recent_link_count: 352,
      total_link_count: 1917,
      ratio: 0.18362023995826812,
    },
    {
      target_fid: 288578,
      recent_link_count: 141,
      total_link_count: 775,
      ratio: 0.18193548387096775,
    },
    {
      target_fid: 276001,
      recent_link_count: 107,
      total_link_count: 597,
      ratio: 0.17922948073701842,
    },
    {
      target_fid: 328757,
      recent_link_count: 1337,
      total_link_count: 7546,
      ratio: 0.17717996289424862,
    },
    {
      target_fid: 2072,
      recent_link_count: 142,
      total_link_count: 855,
      ratio: 0.16608187134502925,
    },
    {
      target_fid: 251452,
      recent_link_count: 180,
      total_link_count: 1095,
      ratio: 0.1643835616438356,
    },
    {
      target_fid: 248216,
      recent_link_count: 392,
      total_link_count: 2404,
      ratio: 0.16306156405990016,
    },
    {
      target_fid: 311600,
      recent_link_count: 154,
      total_link_count: 963,
      ratio: 0.15991692627206647,
    },
    {
      target_fid: 242870,
      recent_link_count: 903,
      total_link_count: 5679,
      ratio: 0.1590068674062335,
    },
    {
      target_fid: 290093,
      recent_link_count: 80,
      total_link_count: 508,
      ratio: 0.15748031496062992,
    },
    {
      target_fid: 18751,
      recent_link_count: 155,
      total_link_count: 991,
      ratio: 0.15640766902119072,
    },
    {
      target_fid: 265108,
      recent_link_count: 109,
      total_link_count: 732,
      ratio: 0.1489071038251366,
    },
    {
      target_fid: 17425,
      recent_link_count: 330,
      total_link_count: 2227,
      ratio: 0.14818140996856757,
    },
    {
      target_fid: 913,
      recent_link_count: 582,
      total_link_count: 4031,
      ratio: 0.14438104688662862,
    },
    {
      target_fid: 281630,
      recent_link_count: 81,
      total_link_count: 568,
      ratio: 0.1426056338028169,
    },
    {
      target_fid: 237205,
      recent_link_count: 216,
      total_link_count: 1520,
      ratio: 0.14210526315789473,
    },
    {
      target_fid: 701,
      recent_link_count: 1181,
      total_link_count: 8414,
      ratio: 0.1403613025909199,
    },
    {
      target_fid: 244349,
      recent_link_count: 463,
      total_link_count: 3362,
      ratio: 0.13771564544913742,
    },
    {
      target_fid: 7715,
      recent_link_count: 205,
      total_link_count: 1521,
      ratio: 0.13477975016436555,
    },
    {
      target_fid: 250726,
      recent_link_count: 276,
      total_link_count: 2052,
      ratio: 0.13450292397660818,
    },
    {
      target_fid: 7909,
      recent_link_count: 201,
      total_link_count: 1502,
      ratio: 0.13382157123834887,
    },
    {
      target_fid: 237641,
      recent_link_count: 137,
      total_link_count: 1053,
      ratio: 0.13010446343779677,
    },
    {
      target_fid: 1631,
      recent_link_count: 103,
      total_link_count: 793,
      ratio: 0.12988650693568726,
    },
    {
      target_fid: 13563,
      recent_link_count: 293,
      total_link_count: 2304,
      ratio: 0.1271701388888889,
    },
    {
      target_fid: 234616,
      recent_link_count: 160,
      total_link_count: 1271,
      ratio: 0.12588512981904013,
    },
    {
      target_fid: 239533,
      recent_link_count: 417,
      total_link_count: 3318,
      ratio: 0.1256781193490054,
    },
    {
      target_fid: 6373,
      recent_link_count: 269,
      total_link_count: 2181,
      ratio: 0.12333791838606144,
    },
    {
      target_fid: 18085,
      recent_link_count: 464,
      total_link_count: 3848,
      ratio: 0.12058212058212059,
    },
    {
      target_fid: 236173,
      recent_link_count: 397,
      total_link_count: 3306,
      ratio: 0.12008469449485784,
    },
    {
      target_fid: 12224,
      recent_link_count: 185,
      total_link_count: 1556,
      ratio: 0.11889460154241645,
    },
    {
      target_fid: 16831,
      recent_link_count: 472,
      total_link_count: 3970,
      ratio: 0.11889168765743073,
    },
    {
      target_fid: 7620,
      recent_link_count: 652,
      total_link_count: 5490,
      ratio: 0.11876138433515483,
    },
    {
      target_fid: 3882,
      recent_link_count: 390,
      total_link_count: 3308,
      ratio: 0.11789600967351874,
    },
    {
      target_fid: 3346,
      recent_link_count: 252,
      total_link_count: 2138,
      ratio: 0.11786716557530402,
    },
    {
      target_fid: 14366,
      recent_link_count: 131,
      total_link_count: 1113,
      ratio: 0.11769991015274034,
    },
    {
      target_fid: 191554,
      recent_link_count: 121,
      total_link_count: 1048,
      ratio: 0.11545801526717557,
    },
    {
      target_fid: 267974,
      recent_link_count: 346,
      total_link_count: 3154,
      ratio: 0.10970196575776792,
    },
    {
      target_fid: 10178,
      recent_link_count: 247,
      total_link_count: 2260,
      ratio: 0.10929203539823008,
    },
    {
      target_fid: 7452,
      recent_link_count: 71,
      total_link_count: 657,
      ratio: 0.1080669710806697,
    },
    {
      target_fid: 6111,
      recent_link_count: 136,
      total_link_count: 1287,
      ratio: 0.10567210567210568,
    },
    {
      target_fid: 289062,
      recent_link_count: 213,
      total_link_count: 2116,
      ratio: 0.10066162570888469,
    },
    {
      target_fid: 301276,
      recent_link_count: 140,
      total_link_count: 1408,
      ratio: 0.09943181818181818,
    },
    {
      target_fid: 368,
      recent_link_count: 5615,
      total_link_count: 56948,
      ratio: 0.09859872164079511,
    },
    {
      target_fid: 223223,
      recent_link_count: 89,
      total_link_count: 909,
      ratio: 0.09790979097909791,
    },
    {
      target_fid: 211693,
      recent_link_count: 64,
      total_link_count: 654,
      ratio: 0.09785932721712538,
    },
    {
      target_fid: 257886,
      recent_link_count: 80,
      total_link_count: 822,
      ratio: 0.09732360097323602,
    },
    {
      target_fid: 16616,
      recent_link_count: 57,
      total_link_count: 594,
      ratio: 0.09595959595959595,
    },
    {
      target_fid: 267965,
      recent_link_count: 83,
      total_link_count: 870,
      ratio: 0.09540229885057472,
    },
    {
      target_fid: 3429,
      recent_link_count: 172,
      total_link_count: 1806,
      ratio: 0.09523809523809523,
    },
    {
      target_fid: 20701,
      recent_link_count: 97,
      total_link_count: 1027,
      ratio: 0.09444985394352483,
    },
    {
      target_fid: 15983,
      recent_link_count: 604,
      total_link_count: 6425,
      ratio: 0.09400778210116731,
    },
  ]),
};
