import {
  ANGER_LEVEL_BLOCK_ID,
  ANGER_PRIORITY_BLOCK_ID,
  ANGER_PRIORITY_OPTIONS,
  dailyReflectionModal,
  EMOTION_INPUT_BLOCK_ID,
  REFLECTION_INPUT_BLOCK_ID,
} from "./daily_reflection_prompt.ts";

function inputBlocks(emotion?: string) {
  return dailyReflectionModal("metadata", emotion).blocks.filter(
    // deno-lint-ignore no-explicit-any
    (block: any) => block.type === "input",
  );
}

Deno.test("怒りだけに専用項目を表示し、元の入力欄を維持する", () => {
  for (const emotion of [undefined, "sadness", "anger", "joy"]) {
    const blocks = inputBlocks(emotion);
    const ids = blocks.map((block: { block_id: string }) => block.block_id);
    if (
      !ids.includes(EMOTION_INPUT_BLOCK_ID) ||
      !ids.includes(REFLECTION_INPUT_BLOCK_ID)
    ) {
      throw new Error("共通の入力欄がありません");
    }
    const angerFields = ids.includes(ANGER_LEVEL_BLOCK_ID) &&
      ids.includes(ANGER_PRIORITY_BLOCK_ID);
    if (angerFields !== (emotion === "anger")) {
      throw new Error(`怒り専用欄の表示が不正です: ${emotion}`);
    }
  }
});

Deno.test("怒りの強さは1〜10、重要度の保存値は4種類", () => {
  const blocks = inputBlocks("anger");
  const level = blocks.find((block: { block_id: string }) =>
    block.block_id === ANGER_LEVEL_BLOCK_ID
  );
  const values = level.element.options.map((option: { value: string }) =>
    option.value
  );
  if (values.join(",") !== "1,2,3,4,5,6,7,8,9,10") {
    throw new Error("怒りの強さの選択肢が不正です");
  }
  if (
    new Set(ANGER_PRIORITY_OPTIONS.map((option) => option.value)).size !== 4
  ) {
    throw new Error("重要度の保存値が重複しています");
  }
});
