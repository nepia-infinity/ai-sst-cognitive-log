import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

// daily_reflections.id と同じIDを使い、元の出来事とひも付けます。
const AngerLogDatastore = DefineDatastore({
  name: "anger_log",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string },
    user_id: { type: Schema.slack.types.user_id },
    anger_level: { type: Schema.types.number },
    priority: { type: Schema.types.string },
    recorded_at: { type: Schema.types.number },
  },
});

export default AngerLogDatastore;
