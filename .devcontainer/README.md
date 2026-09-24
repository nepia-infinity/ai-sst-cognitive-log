# 開発コンテナ

[Dockerfile](Dockerfile) はDeno、Slack CLI、Gitなどを含む開発環境を用意します。[devcontainer.json](devcontainer.json) はVS Codeの拡張機能と実行ユーザーを設定します。

コンテナで開発する場合は、VS CodeのDev ContainersまたはGitHub Codespacesでリポジトリを開いてください。アプリの起動、OpenAI APIキー、Datastore、トリガーの設定は [ルートREADME](../README.md) にまとめています。コンテナ内ではCLIコマンド名を `slack` として実行します。
