import * as functions from "firebase-functions";
import { defineString } from "firebase-functions/params";

const CRON_SECRET = defineString("CRON_SECRET");

exports.bot = functions.pubsub.schedule("0 10 * * *").onRun(async () => {
  try {
    const response = await fetch("https://fc.hot100.xyz/api/bot", {
      headers: { Authorization: `Bearer ${CRON_SECRET.value()}` },
    });

    if (response.status !== 200) {
      throw new Error(`Bot failed with status ${response.status}`);
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
});

exports.purge = functions.pubsub.schedule("0 */8 * * *").onRun(async () => {
  try {
    const response = await fetch("https://fc.hot100.xyz/api/purge", {
      headers: { Authorization: `Bearer ${CRON_SECRET.value()}` },
    });

    if (response.status !== 200) {
      throw new Error(`Purge failed with status ${response.status}`);
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error(e);
    }
  }
});
