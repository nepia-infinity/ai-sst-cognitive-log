import { DefineWorkflow } from "deno-slack-sdk/mod.ts";
import { PostDailyReflectionPromptFunction } from "../functions/post_daily_reflection_prompt.ts";

export const DailyReflectionWorkflow = DefineWorkflow({
  callback_id: "daily_reflection_workflow",
  title: "毎日の出来事の振り返り",
  description: "毎朝、出来事を記録するための案内をDMに投稿します",
  input_parameters: {
    properties: {},
    required: [],
  },
});

DailyReflectionWorkflow.addStep(PostDailyReflectionPromptFunction, {});

export default DailyReflectionWorkflow;
