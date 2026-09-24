# Triggers

ワークフローを始める条件を定義します。

| 定義ファイル | 種類 | 実行タイミング |
| --- | --- | --- |
| [daily_reflection.ts](daily_reflection.ts) | 定時 | 毎朝8時（日本時間）に記録案内をDMへ送信 |
| [manual_daily_reflection.ts](manual_daily_reflection.ts) | リンク | リンクを開くと記録案内を直ちにDMへ送信 |
| [weekly_emotion_report.ts](weekly_emotion_report.ts) | 定時 | 毎週日曜20時（日本時間）に感情レポートをDMへ送信 |

手動トリガーも定時トリガーも、実行時点で `slack_user_profiles` の `survey_enabled: true` の**全ユーザー**を対象にします。手動トリガーを開いた本人だけに送る設定ではありません。

作成するコマンドと環境ごとの登録手順は [ルートREADME](../README.md) にあります。トリガーを再作成する前に `slack-cli.exe trigger list --app local`（本番は `--app deployed`）で既存の設定を確認してください。
