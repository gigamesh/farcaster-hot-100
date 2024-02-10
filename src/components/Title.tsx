"use client";

import React from "react";

function Title({ lastUpdate }: { lastUpdate?: string }) {
  return (
    <>
      <h1>🔥 Farcaster Hot 100 🔥</h1>
      <p className="flex flex-col text-muted-foreground justify-center items-center">
        <span>Trending accounts of the past day</span>
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
