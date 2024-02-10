"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@components/ui/Popover";
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
          <Popover>
            <PopoverTrigger>
              <Info className="ml-2" />
            </PopoverTrigger>
            <PopoverContent>
              <p className="max-w-[300px]">
                Accounts with {FOLLOWER_THRESHOLD} or less followers are not
                included, as well as accounts with spammy keywords in recent
                casts.
              </p>
            </PopoverContent>
          </Popover>
        </span>
        {lastUpdate && typeof window !== "undefined" && (
          <span>
            Last updated:{" "}
            {new Intl.DateTimeFormat(navigator.language, {
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
