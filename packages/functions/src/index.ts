import * as functions from "firebase-functions";
import fetch from "node-fetch";
const {  defineString } = require('firebase-functions/params');

const CRON_SECRET = defineString('CRON_SECRET');

exports.bot = functions.pubsub
.schedule('0 19 * * *')
.onRun(async () => {
  fetch('https://fc.hot100.xyz/api/bot', {headers: { 'Authorization': CRON_SECRET }})
});

exports.purge = functions.pubsub
.schedule('0 */8 * * *')
.onRun(async () => {
  fetch('https://fc.hot100.xyz/api/fetch', {headers: { 'Authorization': CRON_SECRET }})
});