import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  DAILY_REFLECTION_MODAL_CALLBACK_ID,
  dailyReflectionMessageBlocks,
  dailyReflectionModal,
  REFLECTION_INPUT_ACTION_ID,
  REFLECTION_INPUT_BLOCK_ID,
  START_REFLECTION_ACTION_ID,
} from "../blocks/daily_reflection_prompt.ts";

export const PostDailyReflectionPromptFunction = DefineFunction({
  callback_id: "post_daily_reflection_prompt",
  title: "毎日の振り返りを投稿",
  description: "出来事を振り返るためのBlock Kitメッセージを投稿します",
  source_file: "functions/post_daily_reflection_prompt.ts",
  input_parameters: {
    properties: {
      channel: {
        type: Schema.slack.types.channel_id,
        description: "振り返りメッセージの投稿先チャンネル",
      },
    },
    required: ["channel"],
  },
  output_parameters: {
    properties: {
      reflection: {
        type: Schema.types.string,
        description: "ユーザーが入力した出来事の振り返り",
      },
    },
    required: [],
  },
});

export default SlackFunction(
  PostDailyReflectionPromptFunction,
  async ({ inputs, client }) => {
    const response = await client.chat.postMessage({
      channel: inputs.channel,
      text: "出来事を振り返る時間です。",
      blocks: dailyReflectionMessageBlocks(),
    });

    if (!response.ok) {
      return {
        error: `振り返りメッセージを投稿できませんでした: ${response.error}`,
      };
    }

    return { completed: false };
  },
)
  .addBlockActionsHandler(
    [START_REFLECTION_ACTION_ID],
    async ({ body, client }) => {
      const privateMetadata = JSON.stringify({
        channelId: body.container.channel_id,
        messageTs: body.container.message_ts,
      });

      const response = await client.views.open({
        interactivity_pointer: body.interactivity.interactivity_pointer,
        view: dailyReflectionModal(privateMetadata),
      });

      if (response.error) {
        await client.functions.completeError({
          function_execution_id: body.function_data.execution_id,
          error: `入力画面を開けませんでした: ${response.error}`,
        });
      }
    },
  )
  .addViewSubmissionHandler(
    [DAILY_REFLECTION_MODAL_CALLBACK_ID],
    async ({ body, client, view }) => {
      const reflection =
        view.state.values[REFLECTION_INPUT_BLOCK_ID][REFLECTION_INPUT_ACTION_ID]
          .value;
      const { channelId, messageTs } = JSON.parse(view.private_metadata!);

      await client.chat.update({
        channel: channelId,
        ts: messageTs,
        text: "本日の出来事を記録しました。",
        blocks: [
          ...dailyReflectionMessageBlocks().slice(0, 2),
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: ":white_check_mark: 本日の出来事を記録しました。",
              },
            ],
          },
        ],
      });

      await client.functions.completeSuccess({
        function_execution_id: body.function_data.execution_id,
        outputs: { reflection },
      });

      return { response_action: "clear" };
    },
  )
  .addViewClosedHandler(
    [DAILY_REFLECTION_MODAL_CALLBACK_ID],
    async ({ body, client }) => {
      await client.functions.completeSuccess({
        function_execution_id: body.function_data.execution_id,
        outputs: {},
      });
    },
  );
