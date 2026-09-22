import { Manifest } from "deno-slack-sdk/mod.ts";
import { PostDailyReflectionPromptFunction } from "./functions/post_daily_reflection_prompt.ts";
import { DailyReflectionWorkflow } from "./workflows/daily_reflection_workflow.ts";

export default Manifest({
  name: "ai-sst-cognitive-log",
  description: "日々の出来事や考えを整理するためのAI支援型Slackアプリ",
  icon: "assets/default_new_app_icon.png",
  functions: [PostDailyReflectionPromptFunction],
  workflows: [DailyReflectionWorkflow],
  outgoingDomains: [],
  botScopes: ["commands", "chat:write", "chat:write.public", "triggers:write"],
});
