# ai-sst-cognitive-log
## Slackのイメージ画像
<img src="https://github.com/user-attachments/assets/714295e1-94c2-40af-9083-af107d5e87f1" alt="Slackの画面2" width="600">

## このリポジトリの簡単な説明
CBT（認知行動療法）の考え方に基づいて、日々の出来事、認知、感情を分類し、datastoreで記録し、AIによる振り返りと具体的な対策を届けるSlackのカスタムワークフローです。

## 主な機能

- 毎朝8時（日本時間）に、配信を有効にしたユーザーへ記録の案内をDMで送信します。手動トリガーからも実行できます。
- 感情を12種類から選び、出来事や考えを入力すると、回答をDatastoreに保存します。
- 保存後、OpenAIの `gpt-5-mini` が入力を「出来事・認知・感情」と最大3件の行動案に整理し、DMに表示します。差し迫った危険への応答では通常の分類や行動カードを表示しません。AIの回答は医療行為ではありません。
- 毎週日曜20時（日本時間）に、直近7日間の感情の内訳と記録一覧をDMで送ります。対象期間の記録がなければ送りません。

## ローカルで動かす

Slack CLI、Deno、アプリをインストールできるSlackワークスペースが必要です。以下はWindows PowerShellで `slack-cli.exe` を使う例です。コマンド名が `slack` の環境では読み替えてください。

```powershell
git clone https://github.com/nepia-infinity/ai-sst-cognitive-log.git
cd ai-sst-cognitive-log
slack-cli.exe login
```

既存のチェックアウトでは、必要に応じて `git pull origin master` で更新してください。プロジェクト直下の `.env` にOpenAI APIキーを設定します。

```text
OPENAI_API_KEY=取得したAPIキー
```

`.env` はGit管理対象外です。APIキーをコミットしたり、ログに出したりしないでください。OpenAI APIの利用にはAPIキーと利用枠が必要で、ChatGPTの契約とは別です。入力した感情と自由記述はOpenAIへ送られます。

```powershell
slack-cli.exe run
```

初回起動時はワークスペースとローカルアプリを選択します。起動中はSlackに `(local)` の付いたアプリが表示され、停止するときは `Ctrl+C` を押します。別のPowerShellから次のコマンドを実行します。

### 配信対象の登録とトリガー

`U0123ABCDEF` は対象者のSlackユーザーIDに置き換えてください。`survey_enabled: true` のユーザー全員が配信対象です。

```powershell
slack-cli.exe datastore put --app local --datastore slack_user_profiles '{"item":{"slack_member_id":"U0123ABCDEF","survey_enabled":true}}'
slack-cli.exe trigger create --app local --trigger-def triggers/manual_daily_reflection.ts
```

手動トリガーの作成結果に表示されるリンクを開くと、配信対象の**全員**へ案内を送ります。確認できたら定時トリガーを作成します。

```powershell
slack-cli.exe trigger create --app local --trigger-def triggers/daily_reflection.ts
slack-cli.exe trigger create --app local --trigger-def triggers/weekly_emotion_report.ts
```

トリガーの種類と配信時刻は [triggers/README.md](triggers/README.md) にまとめています。重複配信を避けるため、作成済みのトリガーは `slack-cli.exe trigger list --app local` で確認してください。

### 動作確認

```powershell
slack-cli.exe datastore count --app local --datastore daily_reflections
slack-cli.exe datastore query --app local --datastore daily_reflections '{"limit":10}' --output json
deno task test
```

Datastoreの検索方法と保存項目は [datastores/README.md](datastores/README.md) を参照してください。ローカルアプリへのDatastore操作でサポート警告が出る場合は、`(local)` を選んでいることを確認し、必要に応じて `--force` を追加します。

## 本番環境で運用する

デプロイ版のアプリはローカル版と別環境です。ローカルのDatastoreのレコードとトリガーは本番環境へ自動では移りません。

1. `OPENAI_API_KEY` を用意します。Slack CLIの `slack-cli.exe env set OPENAI_API_KEY` でも設定できます。値の入力を対話形式にすると、コマンド履歴にキーが残りません。`slack-cli.exe deploy` はプロジェクトの `.env` を読み込みます。
2. `slack-cli.exe deploy` でデプロイし、デプロイ環境のアプリを選びます。
3. `slack-cli.exe datastore put --app deployed --datastore slack_user_profiles '{"item":{"slack_member_id":"U0123ABCDEF","survey_enabled":true}}'` で本番側の配信対象を登録します。
4. `slack-cli.exe trigger list --app deployed` で既存トリガーを確認し、必要なものだけ `slack-cli.exe trigger create --app deployed --trigger-def triggers/daily_reflection.ts` と `triggers/weekly_emotion_report.ts` から作成します。手動確認用のトリガーを使う場合は `triggers/manual_daily_reflection.ts` も作成します。

本番の記録は `slack-cli.exe datastore query --app deployed --datastore daily_reflections '{"limit":10}' --output json` で確認できます。ログの確認には `slack-cli.exe activity --tail` を使います。結果には個人的な記述が含まれるため、共有するときは内容を伏せてください。

AI処理が失敗した場合も保存済みの回答は残ります。OpenAIの応答が未完了または構造不正の場合は途中の文章を投稿せず、ワークフローの3番目のステップは失敗として終了します。ローカル実行の関数は外部APIを待つ間に時間制限に達する場合があります。

## ディレクトリ

| 場所 | 役割 |
| --- | --- |
| [blocks/](blocks/) | 入力画面、AIの行動カード、週次レポートのBlock Kit表示 |
| [datastores/](datastores/) | 配信対象と回答のデータ構造 |
| [functions/](functions/) | DM配信、回答保存、AI処理、週次レポートの関数 |
| [prompts/](prompts/) | CBTの指示文とAIの回答形式 |
| [triggers/](triggers/) | 手動・定時実行の開始条件 |
| [workflows/](workflows/) | 日次・週次の処理順序 |
| [.devcontainer/](.devcontainer/) | コンテナを使う開発環境 |
