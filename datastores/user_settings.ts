import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const DAILY_REFLECTION_RECIPIENT_ID = "daily_reflection_recipient";

const UserSettingsDatastore = DefineDatastore({
  name: "cognitive_log_user_settings",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
    },
    user_id: {
      type: Schema.slack.types.user_id,
    },
  },
});

export default UserSettingsDatastore;
