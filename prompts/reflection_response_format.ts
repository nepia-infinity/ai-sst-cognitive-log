// Slack表示用の項目をAIから安定して受け取るための契約。
export const REFLECTION_RESPONSE_FORMAT = {
  type: "json_schema",
  name: "cognitive_reflection",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      kind: { type: "string", enum: ["reflection", "urgent"] },
      message: { type: "string" },
      event: { type: "string" },
      cognition: { type: "string" },
      emotion: { type: "string" },
      actions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            body: { type: "string" },
          },
          required: ["title", "subtitle", "body"],
        },
      },
    },
    required: ["kind", "message", "event", "cognition", "emotion", "actions"],
  },
} as const;
