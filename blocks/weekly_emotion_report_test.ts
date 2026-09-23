import {
  currentWeekWindow,
  weeklyEmotionBlocks,
} from "./weekly_emotion_report.ts";
import type { ReflectionRecord } from "./weekly_emotion_report.ts";

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

Deno.test("日曜20時で7日間を区切り、月またぎの記録も漏らさない", () => {
  const now = new Date("2026-10-04T11:00:00.000Z"); // 日曜20時
  const window = currentWeekWindow(now);
  check(window.start === Date.parse("2026-09-27T11:00:00.000Z"), "前週日曜20時");
  check(window.end === now.getTime(), "配信時刻");

  const previous = currentWeekWindow(new Date(window.start));
  check(previous.end === window.start, "前週と次週の境界がつながる");
  const record: ReflectionRecord = {
    id: "sunday-night",
    user_id: "user-a",
    reflection: "日曜21時の出来事",
    emotion: "anger",
    recorded_at: window.start + 60 * 60 * 1000,
  };
  check(weeklyEmotionBlocks([record], window, "user-a").length === 3, "日曜夜の記録");
  check(weeklyEmotionBlocks([record], previous, "user-a").length === 0, "前週には含めない");

  const delayed = currentWeekWindow(new Date("2026-10-04T11:05:00.000Z"));
  check(delayed.start === window.start && delayed.end === window.end, "配信が遅れても期間は固定");

  const justBefore = currentWeekWindow(new Date("2026-10-04T10:59:59.999Z"));
  check(justBefore.end === window.start, "日曜20時の直前は前週分");
});

Deno.test("他人・期間外の記録を除き、円グラフと表を同じ回答から作る", () => {
  const window = currentWeekWindow(new Date("2026-09-27T11:00:00.000Z"));
  const record = (id: string, user: string, emotion: string, at: number): ReflectionRecord => ({
    id,
    user_id: user,
    emotion,
    reflection: "振り返り",
    recorded_at: at,
  });
  const blocks = weeklyEmotionBlocks([
    record("1", "user-a", "anger", window.start),
    record("2", "user-a", "joy", window.end - 1),
    record("3", "user-b", "fear", window.end - 1),
    record("4", "user-a", "anger", window.end),
    record("5", "user-a", "anger", window.start - 1),
  ], window, "user-a");

  check(blocks.length === 3, "ブロック数");
  check(blocks[1].chart.segments.length === 2, "円グラフの種類");
  check(blocks[1].chart.segments.reduce(
    (sum: number, segment: { value: number }) => sum + segment.value,
    0,
  ) === 2, "円グラフの回答数");
  check(blocks[2].rows.length === 3, "見出し＋回答2件");
  check(blocks[2].rows[1][1].text === "喜び", "新しい順");
});

Deno.test("記録がない人にはブロックを返さない", () => {
  const window = currentWeekWindow(new Date("2026-09-27T11:00:00.000Z"));
  check(weeklyEmotionBlocks([], window, "user-a").length === 0, "通知を抑止");
});

Deno.test("記録が多い場合も円グラフは全件、表は最新100件", () => {
  const window = currentWeekWindow(new Date("2026-09-27T11:00:00.000Z"));
  const records: ReflectionRecord[] = Array.from({ length: 105 }, (_, index) => ({
    id: String(index),
    user_id: "user-a",
    emotion: "anger",
    reflection: "記録",
    recorded_at: window.start + index * 1000,
  }));
  const blocks = weeklyEmotionBlocks(records, window, "user-a");
  check(blocks[1].chart.segments[0].value === 105, "円グラフは全件");
  check(blocks[2].rows.length === 101, "表は見出し＋100件");
  check(blocks[2].caption.includes("全105件"), "表の省略を表示");
});
