import { DefineWorkflow } from "deno-slack-sdk/mod.ts";
import { PostWeeklyEmotionReportFunction } from "../functions/post_weekly_emotion_report.ts";

export const WeeklyEmotionReportWorkflow = DefineWorkflow({
  callback_id: "weekly_emotion_report_workflow",
  title: "今週の感情記録を振り返る",
  description: "毎週日曜の夜、保存した感情記録の内訳をDMで送ります",
  input_parameters: { properties: {}, required: [] },
});

WeeklyEmotionReportWorkflow.addStep(PostWeeklyEmotionReportFunction, {});

export default WeeklyEmotionReportWorkflow;
