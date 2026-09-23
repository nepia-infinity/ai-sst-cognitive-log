# Datastores

思考記録など、Slack上で保持するデータ構造を定義します。

## datastoreに登録されたレコードを確かめるコマンド
```
slack-cli datastore query --app local --datastore daily_reflections '{"expression":"#u = :u","expression_attributes":{"#u":"user_id"},"expression_values":{":u":"U0BC46H2U3C"}}' --output json
```
