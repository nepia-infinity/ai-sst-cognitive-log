# Triggers

リンクやスケジュールなど、ワークフローの開始条件を定義します。

## 毎朝8時の振り返り

プライベートな記録を扱うため、振り返りメッセージはチャンネルではなくDMへ送信します。
送信先は表示名ではなく、変更や重複の影響を受けないSlackユーザーIDでDatastoreに登録します。

Slackのプロフィール画面から「メンバーIDをコピー」し、`U0123456789`を実際のユーザーIDに置き換えてください。

ローカル実行用のアプリを起動します。

```powershell
slack-cli run
```

別のPowerShellを開き、送信先をDatastoreに登録します。

```powershell
slack-cli datastore put '{"datastore":"cognitive_log_user_settings","item":{"id":"daily_reflection_recipient","user_id":"U0123456789"}}'
```

続けてスケジュールトリガーを作成します。

```powershell
slack-cli trigger create --trigger-def triggers/daily_reflection_at_8.ts
```

トリガーは`Asia/Tokyo`の午前8時に毎日実行されます。`COGNITIVE_LOG_CHANNEL_ID`の環境変数は不要です。

ローカル環境では`slack-cli run`を起動したままにしてください。本番環境では先に`slack-cli deploy`を実行し、デプロイ先と同じ環境のDatastoreにユーザーIDを登録してからトリガーを作成します。
