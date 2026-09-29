import { ANGER_PRIORITY_OPTIONS } from "./daily_reflection_prompt.ts";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MAX_TABLE_RECORDS = 100;
const MAX_REFLECTION_LENGTH = 100;

// Slack APIが新しいグラフ・表ブロックを検証するため、SDK側の古いBlock型は使わない。
// deno-lint-ignore no-explicit-any
type WeeklyAngerBlocks = any[];

export type AngerRecord = {
  id: string;
  user_id: string;
  reflection?: string;
  anger_level: number | string;
  priority?: string;
  recorded_at: number;
};

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

function validLevel(value: number | string): boolean {
  const level = Number(value);
  return Number.isInteger(level) && level >= 1 && level <= 10;
}

export function weeklyAngerBlocks(
  records: AngerRecord[],
  window: { start: number; end: number },
  userId: string,
): WeeklyAngerBlocks {
  const selected = records.filter((record) =>
    record.user_id === userId &&
    record.recorded_at >= window.start &&
    record.recorded_at < window.end &&
    validLevel(record.anger_level)
  ).sort((a, b) => b.recorded_at - a.recorded_at || a.id.localeCompare(b.id));

  if (selected.length === 0) return [];

  // 同じ日の記録は最大値を折れ線グラフに採用し、表には全件を残す。
  const maximumByDate = new Map<string, number>();
  for (const record of selected) {
    const date = jstDateTime(record.recorded_at).slice(0, 10);
    maximumByDate.set(
      date,
      Math.max(maximumByDate.get(date) ?? 0, Number(record.anger_level)),
    );
  }
  const dates = Array.from(maximumByDate.keys()).sort();
  const categories = dates.map((date) => date.slice(5).replace("-", "/"));
  const priorityLabels = new Map<string, string>(
    ANGER_PRIORITY_OPTIONS.map(({ value, label }) => [value, label] as const),
  );
  const rows = [
    ["日付", "投稿内容", "怒りの強度", "重要度"].map((text) => ({
      type: "raw_text",
      text,
    })),
    ...selected.slice(0, MAX_TABLE_RECORDS).map((record, index) => [
      {
        type: "raw_text",
        text: jstDateTime(record.recorded_at) + " (#" + (index + 1) + ")",
      },
      {
        type: "raw_text",
        text: shorten(record.reflection?.trim() || "（投稿内容なし）"),
      },
      { type: "raw_number", value: Number(record.anger_level) },
      {
        type: "raw_text",
        text: priorityLabels.get(record.priority ?? "") ?? "未設定",
      },
    ]),
  ];
  const period = jstDateTime(window.start) + "〜" +
    jstDateTime(window.end) + "（日本時間）";
  const caption = selected.length > MAX_TABLE_RECORDS
    ? "週次アンガーログ（最新" + MAX_TABLE_RECORDS + "件／全" +
      selected.length + "件）"
    : "週次アンガーログ（" + selected.length + "件）";

  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "集計期間: " + period + "\nグラフは記録のある日ごとの最大強度です。",
      },
    },
    {
      type: "data_visualization",
      block_id: "weekly-anger-intensity",
      title: "日別の最大怒り強度（1〜10）",
      chart: {
        type: "line",
        series: [{
          name: "怒りの強度",
          data: dates.map((date, index) => ({
            label: categories[index],
            value: maximumByDate.get(date)!,
          })),
        }],
        axis_config: {
          categories,
          x_label: "日付",
          y_label: "強度",
        },
      },
    },
    {
      type: "data_table",
      block_id: "weekly-anger-records",
      caption,
      page_size: 7,
      row_header_column_index: 0,
      rows,
    },
  ];
}
