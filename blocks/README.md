# Blocks

SlackのDM、入力画面、週次レポートで使う表示内容をまとめています。

## functions と blocks の役割

`functions`
はSlackのイベント処理、Datastoreの読み書き、OpenAIへの問い合わせ、メッセージの送信・更新を担当します。
`blocks` は受け取ったデータから、Slackに表示するBlock
Kitの配列や入力画面を組み立てます。 送信先や送信タイミングは呼び出し元の
`functions` が決めます。

## ファイルと呼び出し元

| ファイル                                                 | 役割                                                                   | 主な呼び出し元（functions）                                                                                                                                                                                                                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [daily_reflection_prompt.ts](daily_reflection_prompt.ts) | 記録案内と入力画面。感情の選択肢 `EMOTION_OPTIONS`、入力画面のIDを定義 | [post_daily_reflection_prompt.ts](../functions/post_daily_reflection_prompt.ts)、[save_daily_reflection.ts](../functions/save_daily_reflection.ts)、[save_anger_log.ts](../functions/save_anger_log.ts)、[analyze_daily_reflection.ts](../functions/analyze_daily_reflection.ts) |
| [ai_reflection.ts](ai_reflection.ts)                     | AIの構造化回答を検証し、出来事・認知・感情と行動カードを表示           | [analyze_daily_reflection.ts](../functions/analyze_daily_reflection.ts)                                                                                                                                                                                                          |
| [weekly_emotion_report.ts](weekly_emotion_report.ts)     | 直近7日間の感情の円グラフと記録一覧を表示。共通の集計期間も計算        | [post_weekly_emotion_report.ts](../functions/post_weekly_emotion_report.ts)、[post_weekly_anger_report.ts](../functions/post_weekly_anger_report.ts)                                                                                                                             |
| [weekly_anger_report.ts](weekly_anger_report.ts)         | 怒りの強度の折れ線グラフと記録一覧を表示                               | [post_weekly_anger_report.ts](../functions/post_weekly_anger_report.ts)                                                                                                                                                                                                          |

## 日次の処理を追う順番

[日次ワークフロー](../workflows/daily_reflection_workflow.ts)
が次の順番で関数を呼び出します。

1. `post_daily_reflection_prompt.ts` が `dailyReflectionMessageBlocks`
   でDMを送り、ボタン操作で `dailyReflectionModal`
   を開きます。同じblocksファイルのIDと選択肢を使って入力を検証します。
2. `save_daily_reflection.ts` が記録を保存し、`savedReflectionMessageBlocks`
   で元のDMを保存完了の表示に更新します。
3. `analyze_daily_reflection.ts` がOpenAIの回答を取得し、`parseAiReflection`
   で検証します。`aiReflectionBlocks` で表示を作り、`aiReflectionFallback`
   で通知用テキストを作って、同じDMを更新します。感情名の取得には
   `EMOTION_OPTIONS` を使います。
4. `save_anger_log.ts` が、感情が `anger`
   の場合だけ怒りの記録を保存します。`ANGER_LEVEL_OPTIONS` と
   `ANGER_PRIORITY_OPTIONS` は入力検証に使い、この関数から画面は送信しません。

## ファイル間で共有しているもの

- `daily_reflection_prompt.ts` の `EMOTION_OPTIONS`
  は感情の入力、AIへ渡す表示名、週次の感情集計で共有します。`ANGER_PRIORITY_OPTIONS`
  は怒りの入力・検証と週次アンガーログの表示名で共有します。
- `weekly_emotion_report.ts` の `currentWeekWindow`
  は、感情と怒りの両方の週次配信関数が使います。Datastoreからの取得は各配信関数、対象ユーザー・期間の絞り込みとグラフ・表の生成は各blocksファイルが担当します。
- `ai_reflection.ts` は例外的に
  [functions/format_slack_reflection.ts](../functions/format_slack_reflection.ts)
  を参照します。この関数は文字列整形の補助関数で、Slackイベントの処理やAPI送信は行いません。MarkdownリンクなどをSlackの表記に直します。

## 保存値と表示のルール

感情は日本語の表示名ではなく `anger`
などの固定コードで保存します。表示名を変更しても、集計に使うコードは維持してください。

AIの回答形式は
[prompts/reflection_response_format.ts](../prompts/reflection_response_format.ts)、指示文は
[prompts/cbt_reflection.ts](../prompts/cbt_reflection.ts)
にあります。緊急時には通常の分類や行動カードを表示しません。行動カードのアイコンは回答に含まれる候補から選び、想定外の値には
`lightbulb` を使います。

週次レポートは日本時間の日曜20時を区切りとする7日間を集計し、円グラフには全回答、一覧には新しい順に最大100件を表示します。対象期間に回答がなければ表示しません。

怒りの折れ線グラフは記録がある日ごとの最大強度を表示し、一覧には新しい順に最大100件を表示します。

## テスト

表示のテストは [blocks/tests](tests/)、文字列整形のテストは
[functions/tests](../functions/tests/) に置きます。 既存のファイル名 `*_test.ts`
を維持し、テストから親ディレクトリの実装を `../` で参照します。

リポジトリのルートで全体のチェックを実行します。

```sh
deno task test
```

このコマンドは整形チェック、lint、テストを実行します。Denoは `tests` 内の
`*_test.ts` も自動で検出します。
表示と文字列整形のテストだけを実行する場合は次のコマンドを使います。

```sh
deno test --allow-read blocks/tests functions/tests
```
