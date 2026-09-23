import { Manifest } from "deno-slack-sdk/mod.ts";
import SlackUserProfilesDatastore from "./datastores/slack_user_profiles.ts";
import DailyReflectionsDatastore from "./datastores/daily_reflections.ts";
import UserSettingsDatastore from "./datastores/user_settings.ts";
import { PostDailyReflectionPromptFunction } from "./functions/post_daily_reflection_prompt.ts";
import { SaveDailyReflectionFunction } from "./functions/save_daily_reflection.ts";
import { AnalyzeDailyReflectionFunction } from "./functions/analyze_daily_reflection.ts";
import { PostWeeklyEmotionReportFunction } from "./functions/post_weekly_emotion_report.ts";
import { DailyReflectionWorkflow } from "./workflows/daily_reflection_workflow.ts";
import { WeeklyEmotionReportWorkflow } from "./workflows/weekly_emotion_report_workflow.ts";

export default Manifest({
  name: "ai-sst-cognitive-log",
  description: "日々の出来事や考えを整理するためのAI支援型Slackアプリ",
  icon: "assets/default_new_app_icon.png",
  functions: [
    PostDailyReflectionPromptFunction,
    SaveDailyReflectionFunction,
    AnalyzeDailyReflectionFunction,
    PostWeeklyEmotionReportFunction,
  ],
  workflows: [DailyReflectionWorkflow, WeeklyEmotionReportWorkflow],
  datastores: [
    UserSettingsDatastore,
    SlackUserProfilesDatastore,
    DailyReflectionsDatastore,
  ],
  outgoingDomains: ["api.openai.com"],
  botScopes: [
    "commands",
    "chat:write",
    "datastore:read",
    "datastore:write",
    "im:write",
    "triggers:write",
  ],
});
