import { type ClassValue, clsx } from "clsx";
import { NextRequest, NextResponse } from "next/server";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clampValue({
  value,
  min = 0,
  max,
}: {
  value: number;
  min?: number;
  max: number;
}) {
  return Math.min(Math.max(value, min), max);
}

export function getProfileUrl({
  fid,
  username,
}: {
  fid: string;
  username: string | null;
}) {
  if (!username) {
    return `https://warpcast.com/profiles/${fid}`;
  }

  if (username.startsWith("!")) {
    return `https://warpcast.com/~/profiles/${username.slice(1)}`; // Removes the leading '!'
  }

  return `https://warpcast.com/${username}`;
}

export function checkToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    const response = new Response("Unauthorized", {
      status: 401,
    });
    return { response, authorized: false };
  }
  return { authorized: true };
}
