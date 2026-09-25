import { DefineWorkflow } from "deno-slack-sdk/mod.ts";
import { PostDailyReflectionPromptFunction } from "../functions/post_daily_reflection_prompt.ts";
import { SaveDailyReflectionFunction } from "../functions/save_daily_reflection.ts";
import { AnalyzeDailyReflectionFunction } from "../functions/analyze_daily_reflection.ts";

export const DailyReflectionWorkflow = DefineWorkflow({
  callback_id: "daily_reflection_workflow",
  title: "毎日の出来事の振り返り",
  description: "毎朝、出来事を記録するための案内をDMに投稿します",
  input_parameters: {
    properties: {},
    required: [],
  },
});

const prompt = DailyReflectionWorkflow.addStep(
  PostDailyReflectionPromptFunction,
  {},
);
const saved = DailyReflectionWorkflow.addStep(SaveDailyReflectionFunction, {
  submissionId: prompt.outputs.submissionId,
  userId: prompt.outputs.userId,
  reflection: prompt.outputs.reflection,
  emotion: prompt.outputs.emotion,
  channelId: prompt.outputs.channelId,
  messageTs: prompt.outputs.messageTs,
});

DailyReflectionWorkflow.addStep(AnalyzeDailyReflectionFunction, {
  reflection: prompt.outputs.reflection,
  emotion: prompt.outputs.emotion,
  channelId: saved.outputs.channelId,
  messageTs: saved.outputs.messageTs,
});

export default DailyReflectionWorkflow;
