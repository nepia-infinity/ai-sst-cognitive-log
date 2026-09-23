import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

// 1回の回答を1レコードとして保持します。recorded_at はUnixミリ秒です。
// ユーザーのタイムゾーンに応じた日付は集計時に算出します。
const DailyReflectionsDatastore = DefineDatastore({
  name: "daily_reflections",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    user_id: { type: Schema.slack.types.user_id },
    reflection: { type: Schema.types.string },
    emotion: { type: Schema.types.string },
    recorded_at: { type: Schema.types.number },
  },
});

export default DailyReflectionsDatastore;
