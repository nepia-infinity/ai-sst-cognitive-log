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

const channelId = Deno.env.get("COGNITIVE_LOG_CHANNEL_ID");

if (!channelId) {
  throw new Error(
    "COGNITIVE_LOG_CHANNEL_IDを設定してからトリガーを作成してください。",
  );
}

const DailyReflectionAtEight: ScheduledTrigger<
  typeof DailyReflectionWorkflow.definition
> = {
  type: TriggerTypes.Scheduled,
  name: "毎朝8時の出来事の振り返り",
  description: "毎朝8時に振り返りメッセージを投稿します",
  workflow: `#/workflows/${DailyReflectionWorkflow.definition.callback_id}`,
  inputs: {
    channel: {
      value: channelId,
    },
  },
  schedule: {
    start_time: nextEightAmJst(),
    timezone: "Asia/Tokyo",
    frequency: {
      type: "daily",
    },
  },
};

export default DailyReflectionAtEight;
