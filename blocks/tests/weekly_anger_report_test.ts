import { weeklyAngerBlocks } from "../weekly_anger_report.ts";
import type { AngerRecord } from "../weekly_anger_report.ts";

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const window = {
  start: Date.parse("2026-09-27T11:00:00.000Z"),
  end: Date.parse("2026-10-04T11:00:00.000Z"),
};

function record(
  id: string,
  at: string,
  level: number | string,
  userId = "user-a",
): AngerRecord {
  return {
    id,
    user_id: userId,
    reflection: "出来事 " + id,
    anger_level: level,
    priority: "important_changeable",
    recorded_at: Date.parse(at),
  };
}

Deno.test("週次アンガーログは同日の最大強度を描画し、表には全件を表示する", () => {
  const blocks = weeklyAngerBlocks(
    [
      record("first", "2026-09-28T00:00:00.000Z", 5),
      record("second", "2026-09-28T13:00:00.000Z", "7"),
      record("third", "2026-09-30T00:00:00.000Z", 4),
      record("other", "2026-09-28T14:00:00.000Z", 10, "user-b"),
      record("before", "2026-09-27T10:59:59.999Z", 10),
      record("after", "2026-10-04T11:00:00.000Z", 10),
      record("invalid", "2026-09-29T00:00:00.000Z", "bad"),
    ],
    window,
    "user-a",
  );

  check(blocks.length === 3, "説明、グラフ、表の順");
  check(
    blocks[1].chart.axis_config.categories.join(",") === "09/28,09/30",
    "記録のある日だけを日付順に並べる",
  );
  check(
    blocks[1].chart.series[0].data.map(
      (point: { value: number }) => point.value,
    ).join(",") === "7,4",
    "同日の最大値と文字列の数値化",
  );
  check(blocks[2].rows.length === 4, "表は見出し＋3件");
  check(blocks[2].rows[1][1].text === "出来事 third", "表は新しい順");
  check(blocks[2].rows[2][2].value === 7, "強度は数値セル");
  check(
    blocks[2].rows[2][3].text === "重要かつ自分で変えることができる",
    "重要度の表示名",
  );
});

Deno.test("境界と過去の本文なし記録を扱い、表の件数を制限する", () => {
  const records = Array.from({ length: 105 }, (_, index) =>
    record(
      String(index),
      new Date(window.start + index * 1000).toISOString(),
      1 + index % 10,
    ));
  records[0].reflection = undefined;
  const blocks = weeklyAngerBlocks(records, window, "user-a");
  check(blocks[1].chart.series[0].data.length === 1, "1日のグラフ");
  check(blocks[2].rows.length === 101, "見出し＋最新100件");
  check(blocks[2].caption.includes("全105件"), "省略件数の表示");

  const old = weeklyAngerBlocks([records[0]], window, "user-a");
  check(old[2].rows[1][1].text === "（投稿内容なし）", "既存記録の本文");
  check(weeklyAngerBlocks([], window, "user-a").length === 0, "記録なし");
  check(
    weeklyAngerBlocks(
      [record("end", "2026-10-04T11:00:00.000Z", 5)],
      window,
      "user-a",
    ).length === 0,
    "終了時刻は翌週",
  );
});
