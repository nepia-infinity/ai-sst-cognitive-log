export const START_REFLECTION_ACTION_ID = "start_daily_reflection";
export const DAILY_REFLECTION_MODAL_CALLBACK_ID = "daily_reflection_modal";
export const REFLECTION_INPUT_BLOCK_ID = "daily_reflection";
export const REFLECTION_INPUT_ACTION_ID = "reflection_text";

const PURPOSE_TEXT =
  "認知の歪みや自動思考に気付くために日々の出来事を記録します。";
// Block Kitの型はSlack API側で検証されるため、再利用しやすい配列として返します。
// deno-lint-ignore no-explicit-any
export function dailyReflectionMessageBlocks(): any[] {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "出来事の振り返り",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: PURPOSE_TEXT,
      },
    },
    {
      type: "actions",
      block_id: "daily_reflection_actions",
      elements: [
        {
          type: "button",
          action_id: START_REFLECTION_ACTION_ID,
          style: "primary",
          text: {
            type: "plain_text",
            text: "記録する",
            emoji: true,
          },
        },
      ],
    },
  ];
}

// deno-lint-ignore no-explicit-any
export function dailyReflectionModal(privateMetadata: string): any {
  return {
    type: "modal",
    callback_id: DAILY_REFLECTION_MODAL_CALLBACK_ID,
    notify_on_close: true,
    private_metadata: privateMetadata,
    title: {
      type: "plain_text",
      text: "出来事の振り返り",
      emoji: true,
    },
    submit: {
      type: "plain_text",
      text: "記録する",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "キャンセル",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: PURPOSE_TEXT,
        },
      },
      {
        type: "input",
        block_id: REFLECTION_INPUT_BLOCK_ID,
        element: {
          type: "plain_text_input",
          action_id: REFLECTION_INPUT_ACTION_ID,
          multiline: true,
          placeholder: {
            type: "plain_text",
            text:
              "今日の出来事を振り返って、思ったことや感じたことを自由に記述してください。",
          },
        },
        label: {
          type: "plain_text",
          text: "出来事の振り返り",
          emoji: true,
        },
        optional: false,
      },
    ],
  };
}
