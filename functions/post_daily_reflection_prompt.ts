import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import {
  DAILY_REFLECTION_MODAL_CALLBACK_ID,
  dailyReflectionMessageBlocks,
  dailyReflectionModal,
  EMOTION_INPUT_ACTION_ID,
  EMOTION_INPUT_BLOCK_ID,
  EMOTION_OPTIONS,
  REFLECTION_INPUT_ACTION_ID,
  REFLECTION_INPUT_BLOCK_ID,
  START_REFLECTION_ACTION_ID,
} from "../blocks/daily_reflection_prompt.ts";
import SlackUserProfilesDatastore from "../datastores/slack_user_profiles.ts";

export const PostDailyReflectionPromptFunction = DefineFunction({
  callback_id: "post_daily_reflection_prompt",
  title: "毎日の振り返りを投稿",
  description:
    "Datastoreで設定したユーザーのDMに振り返りメッセージを投稿します",
  source_file: "functions/post_daily_reflection_prompt.ts",
  input_parameters: {
    properties: {},
    required: [],
  },
  output_parameters: {
    properties: {
      reflection: {
        type: Schema.types.string,
        description: "ユーザーが入力した出来事の振り返り",
      },
      emotion: {
        type: Schema.types.string,
        description: "ユーザーが選択した感情の固定コード",
      },
      submissionId: { type: Schema.types.string },
      userId: { type: Schema.slack.types.user_id },
      channelId: { type: Schema.slack.types.channel_id },
      messageTs: { type: Schema.types.string },
    },
    required: [],
  },
});

export default SlackFunction(
  PostDailyReflectionPromptFunction,
  async ({ client }) => {
    let cursor: string | undefined;
    let deliveryCount = 0;

    do {
      const recipients = await client.apps.datastore.query<
        typeof SlackUserProfilesDatastore.definition
      >({
        datastore: SlackUserProfilesDatastore.name,
        expression: "#survey_enabled = :enabled",
        expression_attributes: {
          "#survey_enabled": "survey_enabled",
        },
        expression_values: {
          ":enabled": true,
        },
        cursor,
      });

      if (!recipients.ok) {
        return {
          error: `配信対象を取得できませんでした: ${recipients.error}`,
        };
      }

      for (const recipient of recipients.items) {
        const userId = recipient.slack_member_id;
        let dmChannelId = recipient.dm_channel_id;

        if (!userId) {
          continue;
        }

        if (!dmChannelId) {
          const directMessage = await client.conversations.open({
            users: userId,
          });

          if (!directMessage.ok || !directMessage.channel?.id) {
            console.error(
              `ユーザー ${userId} のDMを開けませんでした: ${
                directMessage.error ?? "unknown_error"
              }`,
            );
            continue;
          }

          dmChannelId = directMessage.channel.id;
        }

        const response = await client.chat.postMessage({
          channel: dmChannelId,
          text: "出来事を振り返る時間です。",
          blocks: dailyReflectionMessageBlocks(),
        });

        if (!response.ok) {
          console.error(
            `ユーザー ${userId} に振り返りメッセージを投稿できませんでした: ${response.error}`,
          );
          continue;
        }

        deliveryCount += 1;
      }

      cursor = recipients.response_metadata?.next_cursor;
    } while (cursor);

    if (deliveryCount === 0) {
      return {
        error:
          "配信対象が見つからないか、すべてのDM送信に失敗しました。survey_enabledがtrueのユーザーを確認してください。",
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
        view.state.values[REFLECTION_INPUT_BLOCK_ID]?.[REFLECTION_INPUT_ACTION_ID]
          ?.value?.trim();
      const emotion =
        view.state.values[EMOTION_INPUT_BLOCK_ID]?.[EMOTION_INPUT_ACTION_ID]
          ?.selected_option?.value;
      if (!reflection) {
        return {
          response_action: "errors",
          errors: { [REFLECTION_INPUT_BLOCK_ID]: "出来事を入力してください。" },
        };
      }
      if (
        !emotion ||
        !EMOTION_OPTIONS.some((option) => option.value === emotion)
      ) {
        return {
          response_action: "errors",
          errors: { [EMOTION_INPUT_BLOCK_ID]: "感情を1つ選択してください。" },
        };
      }
      const { channelId, messageTs } = JSON.parse(view.private_metadata!);

      await client.functions.completeSuccess({
        function_execution_id: body.function_data.execution_id,
        outputs: {
          submissionId: body.function_data.execution_id,
          userId: body.user.id,
          reflection,
          emotion,
          channelId,
          messageTs,
        },
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
