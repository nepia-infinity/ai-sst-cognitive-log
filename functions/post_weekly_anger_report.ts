import { DefineFunction, SlackFunction } from "deno-slack-sdk/mod.ts";
import { weeklyAngerBlocks } from "../blocks/weekly_anger_report.ts";
import type { AngerRecord } from "../blocks/weekly_anger_report.ts";
import { currentWeekWindow } from "../blocks/weekly_emotion_report.ts";
import AngerLogDatastore from "../datastores/anger_log.ts";
import SlackUserProfilesDatastore from "../datastores/slack_user_profiles.ts";

export const PostWeeklyAngerReportFunction = DefineFunction({
  callback_id: "post_weekly_anger_report",
  title: "今週のアンガーログをDMに送る",
  source_file: "functions/post_weekly_anger_report.ts",
  input_parameters: { properties: {}, required: [] },
});

export default SlackFunction(
  PostWeeklyAngerReportFunction,
  async ({ client }) => {
    const window = currentWeekWindow(new Date());
    let recipientsCursor: string | undefined;
    do {
      const recipients = await client.apps.datastore.query<
        typeof SlackUserProfilesDatastore.definition
      >({
        datastore: SlackUserProfilesDatastore.name,
        expression: "#enabled = :enabled",
        expression_attributes: { "#enabled": "survey_enabled" },
        expression_values: { ":enabled": true },
        cursor: recipientsCursor,
      });
      if (!recipients.ok) {
        return { error: "配信対象を取得できませんでした: " + recipients.error };
      }

      for (const recipient of recipients.items) {
        const userId = recipient.slack_member_id;
        if (!userId) continue;

        const records: AngerRecord[] = [];
        let recordsCursor: string | undefined;
        let queryFailed = false;
        do {
          const response = await client.apps.datastore.query<
            typeof AngerLogDatastore.definition
          >({
            datastore: AngerLogDatastore.name,
            expression: "#user = :user AND #time BETWEEN :start AND :end",
            expression_attributes: {
              "#user": "user_id",
              "#time": "recorded_at",
            },
            expression_values: {
              ":user": userId,
              ":start": window.start,
              ":end": window.end,
            },
            cursor: recordsCursor,
          });
          if (!response.ok) {
            console.error(
              "ユーザー " + userId + " の怒りの記録を取得できませんでした: " +
                response.error,
            );
            queryFailed = true;
            break;
          }
          records.push(...response.items as AngerRecord[]);
          recordsCursor = response.response_metadata?.next_cursor;
        } while (recordsCursor);
        if (queryFailed) continue;

        const blocks = weeklyAngerBlocks(records, window, userId);
        if (blocks.length === 0) continue;

        const dm = await client.conversations.open({ users: userId });
        if (!dm.ok || !dm.channel?.id) {
          console.error(
            "ユーザー " + userId + " のDMを開けませんでした: " + dm.error,
          );
          continue;
        }

        const message = await client.chat.postMessage({
          channel: dm.channel.id,
          text: "今週の怒りの強度と記録を振り返りましょう。",
          blocks,
        });
        if (!message.ok) {
          console.error(
            "ユーザー " + userId + " に週次アンガーログを送れませんでした: " +
              message.error,
          );
        }
      }
      recipientsCursor = recipients.response_metadata?.next_cursor;
    } while (recipientsCursor);

    return { outputs: {} };
  },
);
