# ai-sst-cognitive-log

日々の出来事と、そのときの感情をSlackのDMから記録するアプリです。振り返りを蓄積し、後から認知の歪みや自動思考に気付くための土台を作っています。

## 現在できること

- `slack_user_profiles` で `survey_enabled: true` にしたユーザーへ、毎朝8時（日本時間）に振り返りの案内をDMで送ります。手動のリンクトリガーからも同じ案内を送れます。
- DMの「記録する」ボタンで入力画面を開き、感情を12種類から1つ選んで、出来事や感じたことを自由記述できます。感情の選択と自由記述は必須です。
- 送信した内容を `daily_reflections` に1回答1レコードで保存し、保存に成功した後でDMに完了を表示します。続く3番目のステップでOpenAIの `gpt-5-mini` に感情と記述を送り、振り返りを「出来事・認知・感情」と最大3件の行動カードに分けて同じDMへ投稿します。差し迫った危険への応答では分類とカードを省き、安全のための案内を表示します。AIの回答には事実と異なる内容が含まれる場合がある旨もDMに表示します。キャンセルした入力は保存もAI送信もしません。
- 毎週日曜20時（日本時間）に、その週の感情の内訳を円グラフと記録一覧でDMへ送ります。今週の記録がないユーザーには送信しません。

**まだ実装していない機能:** 怒りの強度の判定。画面では怒りの強度を入力しません。

## ローカルで動かす

Slack CLI、Deno、アプリをインストールできるSlackワークスペースが必要です。以下はWindows PowerShellで `slack-cli.exe` を使う例です。CLIを `slack` という名前で導入した場合は読み替えてください。

```powershell
git clone https://github.com/nepia-infinity/ai-sst-cognitive-log.git
cd ai-sst-cognitive-log
slack-cli login
slack-cli run
```

`slack-cli.exe run` を起動している間、Slackには名前の末尾に `(local)` が付いた開発用アプリが表示されます。停止するときは `Ctrl+C` を押します。GitHub上でコードを更新しただけでは手元のアプリに反映されないため、既存のチェックアウトでは `git pull origin master` などでローカルのコードを更新してから起動してください。

### OpenAI APIキーを設定する

OpenAIのAPIキーとAPI利用枠が必要です。ChatGPTの契約とは別にOpenAI APIを利用します。振り返りの感情と自由記述がOpenAIへ送信されるため、利用者への案内と取り扱いに注意してください。プロンプト本文は [`prompts/cbt_reflection.ts`](prompts/cbt_reflection.ts) に保存しています。

ローカル実行ではプロジェクト直下にGit管理対象外の `.env` を作成します。

```text
OPENAI_API_KEY=取得したAPIキー
```

デプロイ環境ではSlack CLIで別途設定します。値を共有したり、Gitにコミットしたりしないでください。

```powershell
slack-cli env set OPENAI_API_KEY "取得したAPIキー"
```

APIキーが未設定、通信失敗、回答生成に失敗した場合も、保存済みの記録は残り、DMには失敗の案内を送ります。OpenAIの応答が未完了や構造不正の場合は、途中の文章を投稿しません。カードには表示のみを実装し、動作が決まっていないボタンは置いていません。ワークフローの3番目のステップは失敗として終了します。

### 配信対象を設定する

`slack_user_profiles` にSlackのユーザーIDを登録します。`survey_enabled` が `true` のレコードだけを配信対象にします。次の例は新規登録と確認です。

```powershell
slack-cli datastore put --app local --datastore slack_user_profiles '{"item":{"slack_member_id":"U0123ABCDEF","survey_enabled":true}}'
slack-cli datastore get --app local --datastore slack_user_profiles '{"id":"U0123ABCDEF"}' --output json
```

`U0123ABCDEF` は対象者のSlackユーザーIDに置き換えてください。このDatastoreの主キー属性は `slack_member_id` ですが、`get` コマンドの検索引数には `id` を指定します。プロフィールの `screen_name` などの属性だけでは配信対象にはなりません。

### トリガーを作成する

毎朝の案内、日曜夜の集計、動作確認用のトリガーを用意しています。ローカルアプリで利用する場合は、作成時にローカル環境を選びます。

```powershell
slack-cli trigger create --trigger-def triggers/daily_reflection.ts
slack-cli trigger create --trigger-def triggers/weekly_emotion_report.ts
slack-cli trigger create --trigger-def triggers/manual_daily_reflection.ts
```

`daily_reflection.ts` は毎朝8時（日本時間）の定時トリガーです。`manual_daily_reflection.ts` は作成時に表示されるリンクを開くと直ちに実行できます。どちらも、実行時点で `survey_enabled: true` の**全ユーザー**へ案内を送ります。トリガーを起動した本人だけに送る仕組みではありません。

`weekly_emotion_report.ts` は毎週日曜20時（日本時間）に別のワークフローを実行します。配信対象者ごとに、前週日曜20時から今週日曜20時までの7日間に保存した回答を集計します。期間は開始時刻を含み、終了時刻は含みません。日曜20時以降の回答は次週分です。円グラフには期間内の全回答を使い、表には新しい順に最大100件を表示します。対象の回答が0件ならDMを送りません。手動のリンクトリガーは週次レポートには使いません。

## 保存した回答を確認する

`(local)` アプリで新しく回答した後、別のPowerShellで以下を実行します。Datastoreのローカル環境とデプロイ環境は別々です。

```powershell
slack-cli datastore count --app local --datastore daily_reflections
slack-cli datastore query --app local --datastore daily_reflections '{"limit":10}' --output json
```

特定のユーザーの回答を調べる場合は `user_id` で絞り込みます。

```powershell
slack-cli datastore query --app local --datastore daily_reflections '{"expression":"#u = :u","expression_attributes":{"#u":"user_id"},"expression_values":{":u":"U0123ABCDEF"}}' --output json
```

レコードの `id` はユーザーIDではなく回答時の実行IDです。`query` で表示された `id` が分かれば、次のように1件だけ取得できます。

```powershell
slack-cli datastore get --app local --datastore daily_reflections '{"id":"検索結果のid"}' --output json
```

ローカルアプリに対するDatastore操作でCLIがサポート警告を表示した場合は、選択したアプリが `(local)` であることを確かめ、必要に応じて `--force` を追加してください。記録内容は個人的な情報を含むため、コマンドの結果を共有するときは `reflection` を伏せてください。

### 保存する項目

| Datastore | 主キー | 用途 |
| --- | --- | --- |
| `slack_user_profiles` | `slack_member_id` | 配信対象の設定。`survey_enabled` が `true` の人へ送る |
| `daily_reflections` | `id` | 送信された振り返りを1回答ずつ保存 |
| `cognitive_log_user_settings` | `id` | 定義はあるが、現在の配信・保存処理では参照しない |

`daily_reflections` のレコードには以下を保存します。

| 項目 | 内容 |
| --- | --- |
| `id` | 回答を受け付けた関数の実行ID |
| `user_id` | 回答者のSlackユーザーID |
| `reflection` | 入力した自由記述 |
| `emotion` | 選択した感情の固定コード |
| `recorded_at` | 保存時刻（Unixミリ秒） |

感情の選択肢は、怒り・悲しみ・不安・恐怖・焦り・嫉妬・悔しさ・自己嫌悪・戸惑い・喜び・安心・達成感です。保存される値は日本語の表示名ではなく、`anger` などの英語コードです。対応表は [`blocks/daily_reflection_prompt.ts`](blocks/daily_reflection_prompt.ts) の `EMOTION_OPTIONS` を参照してください。

## 開発用コマンド

```powershell
deno task test
slack-cli activity --tail
```

`deno task test` はフォーマット・lint・テストのチェックを実行します。デプロイ版を利用する場合は `slack-cli deploy` でデプロイし、デプロイ環境にも3種類のトリガーと配信対象を設定してください。ローカルのレコードはデプロイ版へ自動では移りません。
