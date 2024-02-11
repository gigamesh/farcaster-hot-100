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

export async function trendingByFollowerCount() {
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
  time: new Date(1707635937275).toISOString(),
  rows: processeRows([
    {
      target_fid: 336788,
      recent_link_count: 7802,
      total_link_count: 7802,
      ratio: 1,
    },
    {
      target_fid: 336612,
      recent_link_count: 838,
      total_link_count: 838,
      ratio: 1,
    },
    {
      target_fid: 295519,
      recent_link_count: 7666,
      total_link_count: 7671,
      ratio: 0.9993481944987616,
    },
    {
      target_fid: 332307,
      recent_link_count: 5986,
      total_link_count: 6018,
      ratio: 0.994682618810236,
    },
    {
      target_fid: 236238,
      recent_link_count: 3220,
      total_link_count: 3239,
      ratio: 0.9941339919728311,
    },
    {
      target_fid: 332281,
      recent_link_count: 1326,
      total_link_count: 1346,
      ratio: 0.9851411589895989,
    },
    {
      target_fid: 296697,
      recent_link_count: 607,
      total_link_count: 631,
      ratio: 0.9619651347068146,
    },
    {
      target_fid: 193854,
      recent_link_count: 5693,
      total_link_count: 5982,
      ratio: 0.9516883985289201,
    },
    {
      target_fid: 6214,
      recent_link_count: 4029,
      total_link_count: 4368,
      ratio: 0.9223901098901099,
    },
    {
      target_fid: 217248,
      recent_link_count: 931,
      total_link_count: 1098,
      ratio: 0.8479052823315119,
    },
    {
      target_fid: 1992,
      recent_link_count: 3590,
      total_link_count: 4555,
      ratio: 0.7881448957189902,
    },
    {
      target_fid: 195640,
      recent_link_count: 687,
      total_link_count: 917,
      ratio: 0.7491821155943293,
    },
    {
      target_fid: 327771,
      recent_link_count: 1527,
      total_link_count: 2044,
      ratio: 0.74706457925636,
    },
    {
      target_fid: 331150,
      recent_link_count: 2141,
      total_link_count: 3390,
      ratio: 0.6315634218289086,
    },
    {
      target_fid: 255448,
      recent_link_count: 1193,
      total_link_count: 2185,
      ratio: 0.5459954233409611,
    },
    {
      target_fid: 3362,
      recent_link_count: 3463,
      total_link_count: 6392,
      ratio: 0.5417709637046307,
    },
    {
      target_fid: 7168,
      recent_link_count: 509,
      total_link_count: 1083,
      ratio: 0.46999076638965837,
    },
    {
      target_fid: 248389,
      recent_link_count: 481,
      total_link_count: 1085,
      ratio: 0.4433179723502304,
    },
    {
      target_fid: 19289,
      recent_link_count: 579,
      total_link_count: 1409,
      ratio: 0.41092973740241306,
    },
    {
      target_fid: 16405,
      recent_link_count: 422,
      total_link_count: 1225,
      ratio: 0.34448979591836737,
    },
    {
      target_fid: 258682,
      recent_link_count: 196,
      total_link_count: 591,
      ratio: 0.3316412859560068,
    },
    {
      target_fid: 17542,
      recent_link_count: 756,
      total_link_count: 2291,
      ratio: 0.32998690528153646,
    },
    {
      target_fid: 303039,
      recent_link_count: 170,
      total_link_count: 516,
      ratio: 0.32945736434108525,
    },
    {
      target_fid: 16496,
      recent_link_count: 1299,
      total_link_count: 4388,
      ratio: 0.29603463992707385,
    },
    {
      target_fid: 16601,
      recent_link_count: 225,
      total_link_count: 769,
      ratio: 0.2925877763328999,
    },
    {
      target_fid: 315256,
      recent_link_count: 230,
      total_link_count: 787,
      ratio: 0.29224904701397714,
    },
    {
      target_fid: 234616,
      recent_link_count: 485,
      total_link_count: 1695,
      ratio: 0.2861356932153392,
    },
    {
      target_fid: 322783,
      recent_link_count: 1095,
      total_link_count: 3829,
      ratio: 0.28597545050927137,
    },
    {
      target_fid: 273014,
      recent_link_count: 417,
      total_link_count: 1587,
      ratio: 0.2627599243856333,
    },
    {
      target_fid: 300839,
      recent_link_count: 167,
      total_link_count: 654,
      ratio: 0.25535168195718655,
    },
    {
      target_fid: 1220,
      recent_link_count: 164,
      total_link_count: 646,
      ratio: 0.25386996904024767,
    },
    {
      target_fid: 233754,
      recent_link_count: 1364,
      total_link_count: 5392,
      ratio: 0.2529673590504451,
    },
    {
      target_fid: 192539,
      recent_link_count: 538,
      total_link_count: 2197,
      ratio: 0.24487938097405554,
    },
    {
      target_fid: 253415,
      recent_link_count: 265,
      total_link_count: 1110,
      ratio: 0.23873873873873874,
    },
    {
      target_fid: 324362,
      recent_link_count: 838,
      total_link_count: 3744,
      ratio: 0.22382478632478633,
    },
    {
      target_fid: 252221,
      recent_link_count: 244,
      total_link_count: 1091,
      ratio: 0.2236480293308891,
    },
    {
      target_fid: 6804,
      recent_link_count: 282,
      total_link_count: 1270,
      ratio: 0.2220472440944882,
    },
    {
      target_fid: 315622,
      recent_link_count: 118,
      total_link_count: 532,
      ratio: 0.22180451127819548,
    },
    {
      target_fid: 261114,
      recent_link_count: 125,
      total_link_count: 589,
      ratio: 0.21222410865874364,
    },
    {
      target_fid: 270228,
      recent_link_count: 103,
      total_link_count: 508,
      ratio: 0.20275590551181102,
    },
    {
      target_fid: 272479,
      recent_link_count: 104,
      total_link_count: 515,
      ratio: 0.20194174757281552,
    },
    {
      target_fid: 16086,
      recent_link_count: 110,
      total_link_count: 548,
      ratio: 0.20072992700729927,
    },
    {
      target_fid: 301080,
      recent_link_count: 211,
      total_link_count: 1082,
      ratio: 0.19500924214417745,
    },
    {
      target_fid: 294681,
      recent_link_count: 200,
      total_link_count: 1099,
      ratio: 0.18198362147406733,
    },
    {
      target_fid: 2526,
      recent_link_count: 385,
      total_link_count: 2162,
      ratio: 0.1780758556891767,
    },
    {
      target_fid: 18085,
      recent_link_count: 744,
      total_link_count: 4265,
      ratio: 0.17444314185228604,
    },
    {
      target_fid: 254141,
      recent_link_count: 256,
      total_link_count: 1474,
      ratio: 0.17367706919945725,
    },
    {
      target_fid: 253424,
      recent_link_count: 135,
      total_link_count: 781,
      ratio: 0.17285531370038412,
    },
    {
      target_fid: 271946,
      recent_link_count: 124,
      total_link_count: 733,
      ratio: 0.16916780354706684,
    },
    {
      target_fid: 242021,
      recent_link_count: 572,
      total_link_count: 3402,
      ratio: 0.16813639035861258,
    },
    {
      target_fid: 322543,
      recent_link_count: 376,
      total_link_count: 2281,
      ratio: 0.16483998246383166,
    },
    {
      target_fid: 7331,
      recent_link_count: 91,
      total_link_count: 556,
      ratio: 0.16366906474820145,
    },
    {
      target_fid: 235669,
      recent_link_count: 85,
      total_link_count: 521,
      ratio: 0.16314779270633398,
    },
    {
      target_fid: 701,
      recent_link_count: 1359,
      total_link_count: 8615,
      ratio: 0.15774811375507836,
    },
    {
      target_fid: 265108,
      recent_link_count: 122,
      total_link_count: 775,
      ratio: 0.15741935483870967,
    },
    {
      target_fid: 287372,
      recent_link_count: 82,
      total_link_count: 527,
      ratio: 0.1555977229601518,
    },
    {
      target_fid: 233030,
      recent_link_count: 149,
      total_link_count: 975,
      ratio: 0.15282051282051282,
    },
    {
      target_fid: 245681,
      recent_link_count: 290,
      total_link_count: 1937,
      ratio: 0.1497160557563242,
    },
    {
      target_fid: 4482,
      recent_link_count: 922,
      total_link_count: 6187,
      ratio: 0.1490221432034912,
    },
    {
      target_fid: 223223,
      recent_link_count: 144,
      total_link_count: 979,
      ratio: 0.1470888661899898,
    },
    {
      target_fid: 17425,
      recent_link_count: 338,
      total_link_count: 2322,
      ratio: 0.14556416881998277,
    },
    {
      target_fid: 281289,
      recent_link_count: 549,
      total_link_count: 3827,
      ratio: 0.14345440292657435,
    },
    {
      target_fid: 244305,
      recent_link_count: 577,
      total_link_count: 4226,
      ratio: 0.13653573118788453,
    },
    {
      target_fid: 288578,
      recent_link_count: 110,
      total_link_count: 815,
      ratio: 0.13496932515337423,
    },
    {
      target_fid: 329883,
      recent_link_count: 2373,
      total_link_count: 18039,
      ratio: 0.13154831199068684,
    },
    {
      target_fid: 248216,
      recent_link_count: 342,
      total_link_count: 2604,
      ratio: 0.1313364055299539,
    },
    {
      target_fid: 8136,
      recent_link_count: 175,
      total_link_count: 1338,
      ratio: 0.13079222720478326,
    },
    {
      target_fid: 8109,
      recent_link_count: 165,
      total_link_count: 1267,
      ratio: 0.13022888713496447,
    },
    {
      target_fid: 7468,
      recent_link_count: 152,
      total_link_count: 1168,
      ratio: 0.13013698630136986,
    },
    {
      target_fid: 17979,
      recent_link_count: 81,
      total_link_count: 636,
      ratio: 0.12735849056603774,
    },
    {
      target_fid: 255619,
      recent_link_count: 124,
      total_link_count: 994,
      ratio: 0.12474849094567404,
    },
    {
      target_fid: 244349,
      recent_link_count: 441,
      total_link_count: 3573,
      ratio: 0.12342569269521411,
    },
    {
      target_fid: 311600,
      recent_link_count: 124,
      total_link_count: 1008,
      ratio: 0.12301587301587301,
    },
    {
      target_fid: 276001,
      recent_link_count: 76,
      total_link_count: 621,
      ratio: 0.12238325281803543,
    },
    {
      target_fid: 244902,
      recent_link_count: 434,
      total_link_count: 3584,
      ratio: 0.12109375,
    },
    {
      target_fid: 7909,
      recent_link_count: 188,
      total_link_count: 1568,
      ratio: 0.11989795918367346,
    },
    {
      target_fid: 6373,
      recent_link_count: 278,
      total_link_count: 2327,
      ratio: 0.11946712505371723,
    },
    {
      target_fid: 237205,
      recent_link_count: 184,
      total_link_count: 1570,
      ratio: 0.11719745222929936,
    },
    {
      target_fid: 7452,
      recent_link_count: 80,
      total_link_count: 692,
      ratio: 0.11560693641618497,
    },
    {
      target_fid: 256829,
      recent_link_count: 95,
      total_link_count: 832,
      ratio: 0.1141826923076923,
    },
    {
      target_fid: 4275,
      recent_link_count: 200,
      total_link_count: 1756,
      ratio: 0.11389521640091116,
    },
    {
      target_fid: 20928,
      recent_link_count: 1262,
      total_link_count: 11393,
      ratio: 0.11076977091196348,
    },
    {
      target_fid: 7620,
      recent_link_count: 609,
      total_link_count: 5591,
      ratio: 0.10892505812913611,
    },
    {
      target_fid: 251452,
      recent_link_count: 124,
      total_link_count: 1140,
      ratio: 0.10877192982456141,
    },
    {
      target_fid: 211693,
      recent_link_count: 75,
      total_link_count: 695,
      ratio: 0.1079136690647482,
    },
    {
      target_fid: 301276,
      recent_link_count: 159,
      total_link_count: 1486,
      ratio: 0.10699865410497982,
    },
    {
      target_fid: 16831,
      recent_link_count: 447,
      total_link_count: 4181,
      ratio: 0.10691222195646974,
    },
    {
      target_fid: 212496,
      recent_link_count: 221,
      total_link_count: 2069,
      ratio: 0.10681488641855968,
    },
    {
      target_fid: 13563,
      recent_link_count: 251,
      total_link_count: 2374,
      ratio: 0.10572872788542544,
    },
    {
      target_fid: 6111,
      recent_link_count: 145,
      total_link_count: 1397,
      ratio: 0.10379384395132427,
    },
    {
      target_fid: 5644,
      recent_link_count: 89,
      total_link_count: 864,
      ratio: 0.10300925925925926,
    },
    {
      target_fid: 244128,
      recent_link_count: 241,
      total_link_count: 2350,
      ratio: 0.1025531914893617,
    },
    {
      target_fid: 267974,
      recent_link_count: 334,
      total_link_count: 3270,
      ratio: 0.10214067278287461,
    },
    {
      target_fid: 239533,
      recent_link_count: 346,
      total_link_count: 3459,
      ratio: 0.10002891008962128,
    },
    {
      target_fid: 252936,
      recent_link_count: 90,
      total_link_count: 900,
      ratio: 0.1,
    },
    {
      target_fid: 250726,
      recent_link_count: 213,
      total_link_count: 2131,
      ratio: 0.0999530736743313,
    },
    {
      target_fid: 18751,
      recent_link_count: 102,
      total_link_count: 1041,
      ratio: 0.09798270893371758,
    },
    {
      target_fid: 267965,
      recent_link_count: 89,
      total_link_count: 914,
      ratio: 0.09737417943107221,
    },
    {
      target_fid: 15357,
      recent_link_count: 81,
      total_link_count: 854,
      ratio: 0.09484777517564402,
    },
    {
      target_fid: 318982,
      recent_link_count: 48,
      total_link_count: 513,
      ratio: 0.0935672514619883,
    },
  ]),
};
