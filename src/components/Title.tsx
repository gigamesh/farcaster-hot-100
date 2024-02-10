"use client";

import { Tooltip } from "@components/ui/Tooltip";
import { FOLLOWER_THRESHOLD } from "@lib/constants";
import { Info } from "lucide-react";
import React from "react";

function Title({ lastUpdate }: { lastUpdate?: string }) {
  return (
    <>
      <h1>🔥 Farcaster Hot 100 🔥</h1>
      <p className="flex flex-col text-muted-foreground justify-center items-center">
        <span className="flex">
          Trending accounts of the past day{" "}
          <Tooltip
            content={
              <p className="max-w-[300px]">
                Accounts with {FOLLOWER_THRESHOLD} or less followers are not
                included, as well as accounts with spammy keywords in recent
                casts.
              </p>
            }
          >
            <Info className="ml-2" />
          </Tooltip>
        </span>
        {lastUpdate && (
          <span>
            Last updated:{" "}
            {new Intl.DateTimeFormat("en-GB", {
              weekday: "short",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              hour12: true,
            }).format(new Date(lastUpdate))}
          </span>
        )}
      </p>
    </>
  );
}

export default Title;
