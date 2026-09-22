# Triggers

リンクやスケジュールなど、ワークフローの開始条件を定義します。

## 毎朝8時の振り返り

PowerShellで投稿先チャンネルのIDを設定してから、スケジュールトリガーを作成します。

```powershell
$env:COGNITIVE_LOG_CHANNEL_ID="C0123456789"
slack-cli trigger create --trigger-def triggers/daily_reflection_at_8.ts
```

トリガーは`Asia/Tokyo`の午前8時に毎日実行されます。ローカル環境に作成したトリガーを動かすには、`slack-cli run`を起動したままにしてください。本番環境では先に`slack-cli deploy`を実行し、デプロイ済みのアプリに対してトリガーを作成します。
