import { REVALIDATION_INTERVAL } from "@lib/constants";
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
    target_fid: string;
    recent_link_count: string;
    total_link_count: string;
    ratio: string;
  }[]
) {
  return rows.map((d) => {
    return {
      target_fid: parseInt(d.target_fid),
      recent_link_count: parseInt(d.recent_link_count),
      total_link_count: parseInt(d.total_link_count),
      ratio: parseFloat(d.ratio),
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
      COUNT(*) >= 500
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

  return {
    time: new Date(),
    rows: processeRows(queryResult.rows),
  };
}

const dummyResponse = {
  time: new Date(1707536760230),
  rows: processeRows([
    {
      target_fid: "328757",
      recent_link_count: "6730",
      total_link_count: "6730",
      ratio: "1.00000000000000000000",
    },
    {
      target_fid: "329883",
      recent_link_count: "13691",
      total_link_count: "13691",
      ratio: "1.00000000000000000000",
    },
    {
      target_fid: "323085",
      recent_link_count: "1583",
      total_link_count: "1591",
      ratio: "0.99497171590194846009",
    },
    {
      target_fid: "324808",
      recent_link_count: "510",
      total_link_count: "516",
      ratio: "0.98837209302325581395",
    },
    {
      target_fid: "322543",
      recent_link_count: "933",
      total_link_count: "948",
      ratio: "0.98417721518987341772",
    },
    {
      target_fid: "298555",
      recent_link_count: "1182",
      total_link_count: "1202",
      ratio: "0.98336106489184692180",
    },
    {
      target_fid: "20928",
      recent_link_count: "6405",
      total_link_count: "6629",
      ratio: "0.96620908130939809926",
    },
    {
      target_fid: "324362",
      recent_link_count: "2522",
      total_link_count: "2618",
      ratio: "0.96333078686019862490",
    },
    {
      target_fid: "16496",
      recent_link_count: "1397",
      total_link_count: "1477",
      ratio: "0.94583615436696005416",
    },
    {
      target_fid: "257886",
      recent_link_count: "702",
      total_link_count: "758",
      ratio: "0.92612137203166226913",
    },
    {
      target_fid: "302545",
      recent_link_count: "6455",
      total_link_count: "7245",
      ratio: "0.89095928226363008972",
    },
    {
      target_fid: "242090",
      recent_link_count: "1170",
      total_link_count: "1324",
      ratio: "0.88368580060422960725",
    },
    {
      target_fid: "212496",
      recent_link_count: "1599",
      total_link_count: "1824",
      ratio: "0.87664473684210526316",
    },
    {
      target_fid: "268892",
      recent_link_count: "534",
      total_link_count: "657",
      ratio: "0.81278538812785388128",
    },
    {
      target_fid: "16405",
      recent_link_count: "617",
      total_link_count: "784",
      ratio: "0.78698979591836734694",
    },
    {
      target_fid: "2902",
      recent_link_count: "1904",
      total_link_count: "2681",
      ratio: "0.71018276762402088773",
    },
    {
      target_fid: "3346",
      recent_link_count: "1383",
      total_link_count: "1957",
      ratio: "0.70669391926417986714",
    },
    {
      target_fid: "294681",
      recent_link_count: "589",
      total_link_count: "841",
      ratio: "0.70035671819262782402",
    },
    {
      target_fid: "3882",
      recent_link_count: "1901",
      total_link_count: "3014",
      ratio: "0.63072329130723291307",
    },
    {
      target_fid: "289062",
      recent_link_count: "1203",
      total_link_count: "1951",
      ratio: "0.61660686827268067658",
    },
    {
      target_fid: "238351",
      recent_link_count: "4494",
      total_link_count: "7434",
      ratio: "0.60451977401129943503",
    },
    {
      target_fid: "15303",
      recent_link_count: "434",
      total_link_count: "740",
      ratio: "0.58648648648648648649",
    },
    {
      target_fid: "15464",
      recent_link_count: "1081",
      total_link_count: "1867",
      ratio: "0.57900374933047670059",
    },
    {
      target_fid: "318577",
      recent_link_count: "1008",
      total_link_count: "1855",
      ratio: "0.54339622641509433962",
    },
    {
      target_fid: "2201",
      recent_link_count: "670",
      total_link_count: "1247",
      ratio: "0.53728949478748997594",
    },
    {
      target_fid: "239533",
      recent_link_count: "1557",
      total_link_count: "3010",
      ratio: "0.51727574750830564784",
    },
    {
      target_fid: "233030",
      recent_link_count: "402",
      total_link_count: "806",
      ratio: "0.49875930521091811414",
    },
    {
      target_fid: "290132",
      recent_link_count: "1138",
      total_link_count: "2292",
      ratio: "0.49650959860383944154",
    },
    {
      target_fid: "18069",
      recent_link_count: "1678",
      total_link_count: "3521",
      ratio: "0.47656915648963362681",
    },
    {
      target_fid: "288578",
      recent_link_count: "305",
      total_link_count: "677",
      ratio: "0.45051698670605612999",
    },
    {
      target_fid: "269169",
      recent_link_count: "1105",
      total_link_count: "2483",
      ratio: "0.44502617801047120419",
    },
    {
      target_fid: "81",
      recent_link_count: "2092",
      total_link_count: "4745",
      ratio: "0.44088514225500526870",
    },
    {
      target_fid: "235919",
      recent_link_count: "559",
      total_link_count: "1284",
      ratio: "0.43535825545171339564",
    },
    {
      target_fid: "244305",
      recent_link_count: "1463",
      total_link_count: "3430",
      ratio: "0.42653061224489795918",
    },
    {
      target_fid: "3380",
      recent_link_count: "479",
      total_link_count: "1130",
      ratio: "0.42389380530973451327",
    },
    {
      target_fid: "281289",
      recent_link_count: "1324",
      total_link_count: "3151",
      ratio: "0.42018406854966677245",
    },
    {
      target_fid: "256120",
      recent_link_count: "357",
      total_link_count: "894",
      ratio: "0.39932885906040268456",
    },
    {
      target_fid: "317643",
      recent_link_count: "4614",
      total_link_count: "11651",
      ratio: "0.39601750922667582182",
    },
    {
      target_fid: "299747",
      recent_link_count: "431",
      total_link_count: "1104",
      ratio: "0.39039855072463768116",
    },
    {
      target_fid: "301276",
      recent_link_count: "501",
      total_link_count: "1286",
      ratio: "0.38958009331259720062",
    },
    {
      target_fid: "252221",
      recent_link_count: "302",
      total_link_count: "805",
      ratio: "0.37515527950310559006",
    },
    {
      target_fid: "269897",
      recent_link_count: "933",
      total_link_count: "2595",
      ratio: "0.35953757225433526012",
    },
    {
      target_fid: "21071",
      recent_link_count: "4220",
      total_link_count: "12151",
      ratio: "0.34729651880503662250",
    },
    {
      target_fid: "10502",
      recent_link_count: "191",
      total_link_count: "581",
      ratio: "0.32874354561101549053",
    },
    {
      target_fid: "19289",
      recent_link_count: "265",
      total_link_count: "818",
      ratio: "0.32396088019559902200",
    },
    {
      target_fid: "2526",
      recent_link_count: "443",
      total_link_count: "1380",
      ratio: "0.32101449275362318841",
    },
    {
      target_fid: "281630",
      recent_link_count: "164",
      total_link_count: "512",
      ratio: "0.32031250000000000000",
    },
    {
      target_fid: "2824",
      recent_link_count: "290",
      total_link_count: "906",
      ratio: "0.32008830022075055188",
    },
    {
      target_fid: "3498",
      recent_link_count: "262",
      total_link_count: "846",
      ratio: "0.30969267139479905437",
    },
    {
      target_fid: "303837",
      recent_link_count: "337",
      total_link_count: "1102",
      ratio: "0.30580762250453720508",
    },
    {
      target_fid: "311600",
      recent_link_count: "254",
      total_link_count: "857",
      ratio: "0.29638273045507584597",
    },
    {
      target_fid: "235284",
      recent_link_count: "330",
      total_link_count: "1171",
      ratio: "0.28181041844577284372",
    },
    {
      target_fid: "237880",
      recent_link_count: "266",
      total_link_count: "976",
      ratio: "0.27254098360655737705",
    },
    {
      target_fid: "533",
      recent_link_count: "5046",
      total_link_count: "18637",
      ratio: "0.27075173042871706820",
    },
    {
      target_fid: "7061",
      recent_link_count: "3964",
      total_link_count: "14937",
      ratio: "0.26538126799223404968",
    },
    {
      target_fid: "913",
      recent_link_count: "973",
      total_link_count: "3715",
      ratio: "0.26191117092866756393",
    },
    {
      target_fid: "214212",
      recent_link_count: "302",
      total_link_count: "1161",
      ratio: "0.26012058570198105082",
    },
    {
      target_fid: "2266",
      recent_link_count: "443",
      total_link_count: "1737",
      ratio: "0.25503742084052964882",
    },
    {
      target_fid: "251760",
      recent_link_count: "863",
      total_link_count: "3409",
      ratio: "0.25315341742446465239",
    },
    {
      target_fid: "244414",
      recent_link_count: "491",
      total_link_count: "2067",
      ratio: "0.23754233188195452346",
    },
    {
      target_fid: "4461",
      recent_link_count: "3211",
      total_link_count: "13699",
      ratio: "0.23439667128987517337",
    },
    {
      target_fid: "251452",
      recent_link_count: "220",
      total_link_count: "950",
      ratio: "0.23157894736842105263",
    },
    {
      target_fid: "227062",
      recent_link_count: "152",
      total_link_count: "677",
      ratio: "0.22451994091580502216",
    },
    {
      target_fid: "7657",
      recent_link_count: "263",
      total_link_count: "1214",
      ratio: "0.21663920922570016474",
    },
    {
      target_fid: "242188",
      recent_link_count: "186",
      total_link_count: "868",
      ratio: "0.21428571428571428571",
    },
    {
      target_fid: "18751",
      recent_link_count: "196",
      total_link_count: "918",
      ratio: "0.21350762527233115468",
    },
    {
      target_fid: "216548",
      recent_link_count: "124",
      total_link_count: "597",
      ratio: "0.20770519262981574539",
    },
    {
      target_fid: "5860",
      recent_link_count: "115",
      total_link_count: "565",
      ratio: "0.20353982300884955752",
    },
    {
      target_fid: "253424",
      recent_link_count: "123",
      total_link_count: "614",
      ratio: "0.20032573289902280130",
    },
    {
      target_fid: "602",
      recent_link_count: "8815",
      total_link_count: "45362",
      ratio: "0.19432564701732727834",
    },
    {
      target_fid: "331",
      recent_link_count: "259",
      total_link_count: "1335",
      ratio: "0.19400749063670411985",
    },
    {
      target_fid: "235074",
      recent_link_count: "246",
      total_link_count: "1281",
      ratio: "0.19203747072599531616",
    },
    {
      target_fid: "250726",
      recent_link_count: "354",
      total_link_count: "1848",
      ratio: "0.19155844155844155844",
    },
    {
      target_fid: "252936",
      recent_link_count: "144",
      total_link_count: "778",
      ratio: "0.18508997429305912596",
    },
    {
      target_fid: "234616",
      recent_link_count: "207",
      total_link_count: "1156",
      ratio: "0.17906574394463667820",
    },
    {
      target_fid: "248216",
      recent_link_count: "382",
      total_link_count: "2151",
      ratio: "0.17759181775918177592",
    },
    {
      target_fid: "189905",
      recent_link_count: "108",
      total_link_count: "632",
      ratio: "0.17088607594936708861",
    },
    {
      target_fid: "272453",
      recent_link_count: "1832",
      total_link_count: "10738",
      ratio: "0.17060905196498416837",
    },
    {
      target_fid: "251333",
      recent_link_count: "1173",
      total_link_count: "6927",
      ratio: "0.16933737548722390645",
    },
    {
      target_fid: "14978",
      recent_link_count: "256",
      total_link_count: "1571",
      ratio: "0.16295353278166772756",
    },
    {
      target_fid: "2072",
      recent_link_count: "130",
      total_link_count: "816",
      ratio: "0.15931372549019607843",
    },
    {
      target_fid: "14366",
      recent_link_count: "157",
      total_link_count: "1008",
      ratio: "0.15575396825396825397",
    },
    {
      target_fid: "244902",
      recent_link_count: "391",
      total_link_count: "2517",
      ratio: "0.15534366309098132698",
    },
    {
      target_fid: "4715",
      recent_link_count: "269",
      total_link_count: "1746",
      ratio: "0.15406643757159221077",
    },
    {
      target_fid: "18085",
      recent_link_count: "507",
      total_link_count: "3443",
      ratio: "0.14725530060993319779",
    },
    {
      target_fid: "7452",
      recent_link_count: "84",
      total_link_count: "591",
      ratio: "0.14213197969543147208",
    },
    {
      target_fid: "318864",
      recent_link_count: "870",
      total_link_count: "6221",
      ratio: "0.13984889889085356052",
    },
    {
      target_fid: "3973",
      recent_link_count: "290",
      total_link_count: "2078",
      ratio: "0.13955726660250240616",
    },
    {
      target_fid: "3046",
      recent_link_count: "240",
      total_link_count: "1726",
      ratio: "0.13904982618771726535",
    },
    {
      target_fid: "16831",
      recent_link_count: "499",
      total_link_count: "3594",
      ratio: "0.13884251530328324986",
    },
    {
      target_fid: "7963",
      recent_link_count: "843",
      total_link_count: "6096",
      ratio: "0.13828740157480314961",
    },
    {
      target_fid: "13465",
      recent_link_count: "214",
      total_link_count: "1575",
      ratio: "0.13587301587301587302",
    },
    {
      target_fid: "6111",
      recent_link_count: "161",
      total_link_count: "1189",
      ratio: "0.13540790580319596299",
    },
    {
      target_fid: "285542",
      recent_link_count: "110",
      total_link_count: "825",
      ratio: "0.13333333333333333333",
    },
    {
      target_fid: "236173",
      recent_link_count: "401",
      total_link_count: "3026",
      ratio: "0.13251817580964970258",
    },
    {
      target_fid: "16617",
      recent_link_count: "90",
      total_link_count: "685",
      ratio: "0.13138686131386861314",
    },
    {
      target_fid: "4275",
      recent_link_count: "198",
      total_link_count: "1527",
      ratio: "0.12966601178781925344",
    },
    {
      target_fid: "255448",
      recent_link_count: "127",
      total_link_count: "981",
      ratio: "0.12945973496432212029",
    },
    {
      target_fid: "7960",
      recent_link_count: "344",
      total_link_count: "2721",
      ratio: "0.12642410878353546490",
    },
    {
      target_fid: "3429",
      recent_link_count: "218",
      total_link_count: "1725",
      ratio: "0.12637681159420289855",
    },
  ]),
};
