import { TriggerTypes } from "deno-slack-api/mod.ts";
import { ScheduledTrigger } from "deno-slack-api/typed-method-types/workflows/triggers/scheduled.ts";
import WeeklyEmotionReportWorkflow from "../workflows/weekly_emotion_report_workflow.ts";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nextSundayEightPmJst(now = new Date()): string {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const daysUntilSunday = (7 - jst.getUTCDay()) % 7;
  let targetUtc = Date.UTC(
    jst.getUTCFullYear(),
    jst.getUTCMonth(),
    jst.getUTCDate() + daysUntilSunday,
    20,
  ) - JST_OFFSET_MS;
  if (targetUtc <= now.getTime()) {
    targetUtc += 7 * 24 * 60 * 60 * 1000;
  }
  return new Date(targetUtc).toISOString();
}

const WeeklyEmotionReport: ScheduledTrigger<
  typeof WeeklyEmotionReportWorkflow.definition
> = {
  type: TriggerTypes.Scheduled,
  name: "毎週日曜20時の感情記録",
  description: "今週の感情の内訳と記録一覧をDMに送ります",
  workflow: `#/workflows/${WeeklyEmotionReportWorkflow.definition.callback_id}`,
  inputs: {},
  schedule: {
    start_time: nextSundayEightPmJst(),
    timezone: "Asia/Tokyo",
    frequency: {
      type: "weekly",
      repeats_every: 1,
      on_days: ["Sunday"],
    },
  },
};

export default WeeklyEmotionReport;
