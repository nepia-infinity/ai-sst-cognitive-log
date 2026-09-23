import { EMOTION_OPTIONS } from "./daily_reflection_prompt.ts";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MAX_TABLE_RECORDS = 100;
const MAX_REFLECTION_LENGTH = 100;

export type ReflectionRecord = {
  id: string;
  user_id: string;
  reflection: string;
  emotion: string;
  recorded_at: number;
};

export function currentWeekWindow(now: Date): { start: number; end: number } {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  const daysSinceMonday = (jst.getUTCDay() + 6) % 7;
  const start = Date.UTC(
    jst.getUTCFullYear(),
    jst.getUTCMonth(),
    jst.getUTCDate() - daysSinceMonday,
  ) - JST_OFFSET_MS;
  return { start, end: now.getTime() };
}

function jstDateTime(timestamp: number): string {
  return new Date(timestamp + JST_OFFSET_MS).toISOString().slice(0, 16)
    .replace("T", " ");
}

function shorten(text: string): string {
  const characters = Array.from(text.trim());
  return characters.length > MAX_REFLECTION_LENGTH
    ? characters.slice(0, MAX_REFLECTION_LENGTH).join("") + "…"
    : characters.join("");
}

// Slack APIが新しいグラフ・表ブロックを検証するため、SDK側の古いBlock型は使わない。
// deno-lint-ignore no-explicit-any
export function weeklyEmotionBlocks(
  records: ReflectionRecord[],
  window: { start: number; end: number },
  userId: string,
): any[] {
  const labels = new Map<string, string>(
    EMOTION_OPTIONS.map(({ value, label }) => [value, label] as const),
  );
  const selected = records.filter((record) =>
    record.user_id === userId &&
    record.recorded_at >= window.start &&
    record.recorded_at < window.end &&
    labels.has(record.emotion) &&
    Boolean(record.reflection?.trim())
  ).sort((a, b) => b.recorded_at - a.recorded_at || a.id.localeCompare(b.id));

  if (selected.length === 0) return [];

  const counts = new Map<string, number>();
  for (const record of selected) {
    counts.set(record.emotion, (counts.get(record.emotion) ?? 0) + 1);
  }
  const segments = EMOTION_OPTIONS.filter(({ value }) => counts.has(value)).map(
    ({ value, label }) => ({ label, value: counts.get(value)! }),
  );

  const rows = [
    ["記録日時", "感情", "入力内容"].map((text) => ({ type: "raw_text", text })),
    ...selected.slice(0, MAX_TABLE_RECORDS).map((record, index) =>
      [
        `${jstDateTime(record.recorded_at)} (#${index + 1})`,
        labels.get(record.emotion)!,
        shorten(record.reflection),
      ].map((text) => ({ type: "raw_text", text }))
    ),
  ];
  const period = `${jstDateTime(window.start)}〜${jstDateTime(window.end)}（日本時間）`;
  const tableCaption = selected.length > MAX_TABLE_RECORDS
    ? `今週の感情記録（最新${MAX_TABLE_RECORDS}件／全${selected.length}件）`
    : `今週の感情記録（${selected.length}件）`;

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `認知の歪みや自動思考、反芻に気付くための振り返りです。\n集計期間: ${period}`,
      },
    },
    {
      type: "data_visualization",
      block_id: "weekly-emotion-distribution",
      title: "今週記録した感情の内訳",
      chart: { type: "pie", segments },
    },
    {
      type: "data_table",
      block_id: "weekly-emotion-records",
      caption: tableCaption,
      page_size: 7,
      row_header_column_index: 0,
      rows,
    },
  ];
}
