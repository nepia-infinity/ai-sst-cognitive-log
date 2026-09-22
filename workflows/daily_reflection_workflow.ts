import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { PostDailyReflectionPromptFunction } from "../functions/post_daily_reflection_prompt.ts";

export const DailyReflectionWorkflow = DefineWorkflow({
  callback_id: "daily_reflection_workflow",
  title: "毎日の出来事の振り返り",
  description: "毎朝、出来事を記録するための案内を投稿します",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
        description: "振り返りメッセージの投稿先チャンネル",
      },
    },
    required: ["channel"],
  },
});

DailyReflectionWorkflow.addStep(PostDailyReflectionPromptFunction, {
  channel: DailyReflectionWorkflow.inputs.channel,
});

export default DailyReflectionWorkflow;
