import { TriggerTypes } from "deno-slack-api/mod.ts";
import { Trigger } from "deno-slack-api/types.ts";
import DailyReflectionWorkflow from "../workflows/daily_reflection_workflow.ts";

const ManualDailyReflection: Trigger<
  typeof DailyReflectionWorkflow.definition
> = {
  type: TriggerTypes.Shortcut,
  name: "振り返りを手動実行",
  description: "動作確認用に振り返りメッセージをすぐDMへ投稿します",
  workflow: `#/workflows/${DailyReflectionWorkflow.definition.callback_id}`,
  inputs: {},
};

export default ManualDailyReflection;
