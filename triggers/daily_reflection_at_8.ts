import { TriggerTypes } from "deno-slack-api/mod.ts";
import { ScheduledTrigger } from "deno-slack-api/typed-method-types/workflows/triggers/scheduled.ts";
import DailyReflectionWorkflow from "../workflows/daily_reflection_workflow.ts";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nextEightAmJst(now = new Date()): string {
  const nowInJst = new Date(now.getTime() + JST_OFFSET_MS);
  let targetUtc = Date.UTC(
    nowInJst.getUTCFullYear(),
    nowInJst.getUTCMonth(),
    nowInJst.getUTCDate(),
    8,
  ) - JST_OFFSET_MS;

  if (targetUtc <= now.getTime()) {
    targetUtc += 24 * 60 * 60 * 1000;
  }

  return new Date(targetUtc).toISOString();
}

const DailyReflectionAtEight: ScheduledTrigger<
  typeof DailyReflectionWorkflow.definition
> = {
  type: TriggerTypes.Scheduled,
  name: "毎朝8時の出来事の振り返り",
  description: "毎朝8時にDatastoreで設定したユーザーのDMへ投稿します",
  workflow: `#/workflows/${DailyReflectionWorkflow.definition.callback_id}`,
  inputs: {},
  schedule: {
    start_time: nextEightAmJst(),
    timezone: "Asia/Tokyo",
    frequency: {
      type: "daily",
    },
  },
};

export default DailyReflectionAtEight;
