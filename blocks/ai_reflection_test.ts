import {
  aiReflectionBlocks,
  aiReflectionFallback,
  parseAiReflection,
} from "./ai_reflection.ts";

function check(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

Deno.test("通常の回答は分類と行動カードを分けて表示する", () => {
  const result = parseAiReflection({
    kind: "reflection",
    message: "不安に感じているのですね。",
    event: "処分の予定を伝えられた",
    cognition: "転職が難しいと考えた",
    emotion: "不安",
    actions: [
      { title: "事実を整理する", subtitle: "判断材料を揃える", body: "書面を確認する", icon: "clipboard" },
      { title: "相談する", subtitle: "選択肢を知る", body: "日本労働弁護団 https://roudou-bengodan.com/", icon: "user" },
    ],
  });
  const blocks = aiReflectionBlocks(result);
  const callout = blocks.find((block) => block.type === "callout");
  check(callout?.background_color === "green", "AIのメッセージは緑のcalloutで表示する");
  check(callout?.child_blocks.length === 1 && callout.child_blocks[0].type === "section", "callout内はセクション1件");
  check(callout.child_blocks[0].text.text.includes("不安に感じている"), "AIのメッセージをcalloutに表示する");
  check(!blocks.some((block) => block.type === "section" && block.text.text.includes("不安に感じている")), "メッセージを外側に重複表示しない");
  check(blocks.filter((block) => block.type === "card").length === 2, "カード2件");
  check(blocks.filter((block) => block.type === "card").map((block) => block.slack_icon.name).join(",") === "clipboard,user", "行動に応じたアイコン");
  check(blocks.filter((block) => block.type === "header").length === 2, "見出し2件");
  check(blocks.at(-1).type === "context", "注意書きは末尾");
  check(!blocks.some((block) => block.actions), "動作のないボタンを置かない");
  check(aiReflectionFallback(result).includes("処分の予定"), "通知用の本文");
});

Deno.test("緊急時は分類や行動カードを表示しない", () => {
  const result = parseAiReflection({
    kind: "urgent",
    message: "今は行動を止めて、身近な人に連絡してください。",
    event: "表示しない",
    cognition: "表示しない",
    emotion: "表示しない",
    actions: [{ title: "表示しない", subtitle: "", body: "表示しない", icon: "heart" }],
  });
  const blocks = aiReflectionBlocks(result);
  check(blocks.length === 3, "安全案内と注意書きのみ");
  check(blocks[1].text.text.includes("身近な人"), "安全案内の本文");
  check(!aiReflectionFallback(result).includes("表示しない"), "通知にも分類を混ぜない");
});

Deno.test("カードの文字数上限を超えると全文をセクションで表示する", () => {
  const body = "長".repeat(210);
  const result = parseAiReflection({
    kind: "reflection",
    message: "",
    event: "",
    cognition: "",
    emotion: "",
    actions: [{ title: "相談", subtitle: "", body, icon: "user" }],
  });
  const blocks = aiReflectionBlocks(result);
  check(!blocks.some((block) => block.type === "card"), "長文をカードに入れない");
  check(blocks.some((block) => block.type === "section" && block.text.text.includes(body)), "本文を省略しない");
});

Deno.test("壊れた構造化出力は表示しない", () => {
  let rejected = false;
  try {
    parseAiReflection({ kind: "reflection", actions: [] });
  } catch {
    rejected = true;
  }
  check(rejected, "必須項目を検証する");
});

Deno.test("想定外のアイコン名は安全な候補に置き換える", () => {
  const result = parseAiReflection({
    kind: "reflection",
    message: "",
    event: "",
    cognition: "",
    emotion: "",
    actions: [{ title: "一歩を考える", subtitle: "", body: "できることを考える", icon: "unknown" }],
  });
  const card = aiReflectionBlocks(result).find((block) => block.type === "card");
  check(card?.slack_icon.name === "lightbulb", "対応しないアイコンは表示しない");
});
