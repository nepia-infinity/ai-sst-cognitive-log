# Blocks

SlackのDM、入力画面、週次レポートで使う表示内容をまとめています。

| ファイル | 役割 |
| --- | --- |
| [daily_reflection_prompt.ts](daily_reflection_prompt.ts) | 記録案内と入力画面。感情の選択肢 `EMOTION_OPTIONS`、入力画面のIDを定義 |
| [ai_reflection.ts](ai_reflection.ts) | AIの構造化回答を検証し、出来事・認知・感情と行動カードを表示 |
| [weekly_emotion_report.ts](weekly_emotion_report.ts) | 直近7日間の感情の円グラフと記録一覧を表示 |

感情は日本語の表示名ではなく `anger` などの固定コードで保存します。表示名を変更しても、集計に使うコードは維持してください。

AIの回答形式は [prompts/reflection_response_format.ts](../prompts/reflection_response_format.ts)、指示文は [prompts/cbt_reflection.ts](../prompts/cbt_reflection.ts) にあります。緊急時には通常の分類や行動カードを表示しません。行動カードのアイコンは回答に含まれる候補から選び、想定外の値には `lightbulb` を使います。

週次レポートは日本時間の日曜20時を区切りとする7日間を集計し、円グラフには全回答、一覧には新しい順に最大100件を表示します。対象期間に回答がなければ表示しません。

表示の確認には `deno task test` を実行してください。
