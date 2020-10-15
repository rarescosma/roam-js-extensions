import format from "date-fns/format";
import {
  asyncType,
  getConfigFromPage,
  parseRoamDate,
  pushBullets,
} from "roam-client";
import { addButtonListener } from "../entry-helpers";
import axios from "axios";
import subDays from "date-fns/subDays";

const OURA_COMMAND = "Import Oura Ring";

const secondsToTimeString = (s: number) => {
  const hours = `${Math.floor(s / 3600)}`;
  const minutes = `${Math.floor(s / 60) % 60}`;
  const seconds = `${s % 60}`;
  return `${hours.padStart(2, "0")}:${minutes.padStart(
    2,
    "0"
  )}:${seconds.padStart(2, "0")}`;
};

const importOuraRing = async (_: any, blockUid: string, parentUid: string) => {
  const config = getConfigFromPage("roam/js/oura-ring");
  const pageTitle = document.getElementsByClassName(
    "rm-title-display"
  )[0] as HTMLHeadingElement;
  const dateFromPage = parseRoamDate(pageTitle.innerText);
  const token = config["Token"]?.trim();
  if (!token) {
    await asyncType(
      `Error: Could not find the required "Token" attribute configured in the [[roam/js/oura-ring]] page.`
    );
    return;
  }
  const dateToUse = isNaN(dateFromPage.valueOf()) ? new Date() : dateFromPage;
  const formattedDate = format(subDays(dateToUse, 1), "yyyy-MM-dd");
  const sleepData = await axios.get(
    `https://api.ouraring.com/v1/sleep?start=${formattedDate}&end=${formattedDate}&access_token=${token}`
  );
  const activityData = await axios.get(
    `https://api.ouraring.com/v1/activity?start=${formattedDate}&end=${formattedDate}&access_token=${token}`
  );
  const readinessData = await axios.get(
    `https://api.ouraring.com/v1/readiness?start=${formattedDate}&end=${formattedDate}&access_token=${token}`
  );
  const bullets = [];

  const sleep = sleepData.data.sleep[0];
  if (!sleep) {
    bullets.push(`There is no sleep data available for ${formattedDate}`);
  } else {
    const { bedtime_start, bedtime_end } = sleep;
    const formattedStart = format(new Date(bedtime_start), "hh:mm:ss");
    const formattedEnd = format(new Date(bedtime_end), "hh:mm:ss");
    bullets.push(
      `Bedtime Start:: ${formattedStart}`,
      `Bedtime End:: ${formattedEnd}`,
      `Sleep Score:: ${sleep.score}`,
      `Sleep Efficiency:: ${sleep.efficiency}`,
      `Sleep Duration:: ${secondsToTimeString(sleep.duration)}`,
      `Total Sleep:: ${secondsToTimeString(sleep.total)}`,
      `Total Awake:: ${secondsToTimeString(sleep.awake)}`,
      `Sleep Latency:: ${secondsToTimeString(sleep.onset_latency)}`,
      `Light Sleep:: ${secondsToTimeString(sleep.light)}`,
      `Rem Sleep:: ${secondsToTimeString(sleep.rem)}`,
      `Deep Sleep:: ${secondsToTimeString(sleep.deep)}`
    );
  }

  const activity = activityData.data.activity[0];
  if (!activity) {
    bullets.push(`There is no activity data available for ${formattedDate}`);
  } else {
    const { day_start, day_end } = activity;
    const formattedStart = format(new Date(day_start), "hh:mm:ss");
    const formattedEnd = format(new Date(day_end), "hh:mm:ss");
    bullets.push(
      `Day Start:: ${formattedStart}`,
      `Day End:: ${formattedEnd}`,
      `Activity Score:: ${activity.score}`,
      `Low Activity:: ${secondsToTimeString(activity.low * 60)}`,
      `Medium Activity:: ${secondsToTimeString(activity.medium * 60)}`,
      `High Activity:: ${secondsToTimeString(activity.high * 60)}`,
      `Rest Activity:: ${secondsToTimeString(activity.rest * 60)}`,
      `Steps:: ${activity.steps}`
    );
  }

  const readiness = readinessData.data.readiness[0];
  if (!readiness) {
    bullets.push(`There is no activity data available for ${formattedDate}`);
  } else {
    bullets.push(`Readiness Score:: ${readiness.score}`);
  }

  await pushBullets(bullets);
};

addButtonListener(OURA_COMMAND, importOuraRing);
