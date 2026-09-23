import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { EMOTION_OPTIONS } from "../blocks/daily_reflection_prompt.ts";
import { CBT_SYSTEM_PROMPT } from "../prompts/cbt_reflection.ts";
import { formatSlackReflection } from "./format_slack_reflection.ts";

export const AnalyzeDailyReflectionFunction = DefineFunction({
  callback_id: "analyze_daily_reflection",
  title: "AIと振り返る",
  description: "保存した振り返りをOpenAIで整理し、回答者のDMへ返します",
  source_file: "functions/analyze_daily_reflection.ts",
  input_parameters: {
    properties: {
      reflection: { type: Schema.types.string },
      emotion: { type: Schema.types.string },
      channelId: { type: Schema.slack.types.channel_id },
    },
    // 入力画面を閉じたときは前のステップから空の出力を受け取ります。
    required: [],
  },
});

type OpenAIResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

export default SlackFunction(
  AnalyzeDailyReflectionFunction,
  async ({ inputs, client, env }) => {
    const { reflection, emotion, channelId } = inputs;
    if (!reflection && !emotion && !channelId) {
      return { outputs: {} };
    }
    if (!reflection || !emotion || !channelId) {
      return { error: "AIとの振り返りに必要な入力が不足しています。" };
    }

    const apiKey = env["OPENAI_API_KEY"] ??
      Deno.env.get("OPENAI_API_KEY");

    if (!apiKey) {
      console.error("OPENAI_API_KEY が設定されていません。");
      await client.chat.postMessage({
        channel: channelId,
        text: "記録は保存しましたが、AIの振り返りを表示できませんでした。",
      });
      return { error: "OPENAI_API_KEY が設定されていません。" };
    }

    try {
      const emotionLabel = EMOTION_OPTIONS.find((option) =>
        option.value === emotion
      )?.label ?? emotion;
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          instructions: CBT_SYSTEM_PROMPT,
          input: `選んだ感情: ${emotionLabel}\n記述: ${reflection}`,
          max_output_tokens: 2000,
          store: false,
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (!response.ok) {
        console.error(`OpenAI API request failed: HTTP ${response.status}`);
        throw new Error("OpenAI API request failed");
      }

      const data = await response.json() as OpenAIResponse;
      const answer = data.output
        ?.filter((item) => item.type === "message")
        .flatMap((item) => item.content ?? [])
        .filter((item) => item.type === "output_text")
        .map((item) => item.text ?? "")
        .join("\n")
        .trim();
      if (!answer) {
        throw new Error("OpenAI API returned no text");
      }

      const message = await client.chat.postMessage({
        channel: channelId,
        text: `*AIとの振り返り*\n${formatSlackReflection(answer)}`,
        unfurl_links: false,
      });
      if (!message.ok) {
        console.error(
          `AIの振り返りをDMへ送信できませんでした: ${message.error}`,
        );
        return { error: "AIの振り返りをDMへ送信できませんでした。" };
      }
      return { outputs: {} };
    } catch (error) {
      console.error("AIとの振り返りに失敗しました:", error);
      await client.chat.postMessage({
        channel: channelId,
        text:
          "記録は保存しましたが、AIの振り返りを表示できませんでした。時間をおいて再度お試しください。",
      });
      return { error: "AIとの振り返りに失敗しました。" };
    }
  },
);
