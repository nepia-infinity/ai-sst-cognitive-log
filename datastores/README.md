# Datastores

思考記録など、Slack上で保持するデータ構造を定義します。

## datastoreに登録されたレコードを確かめるコマンド
```
slack-cli datastore query --app A0C3YGVBN9J --datastore daily_reflections '{"expression":"#u = :u","expression_attributes":{"#u":"user_id"},"expression_values":{":u":"U0BC46H2U3C"}}' --output json
```

## datastoreに登録されたレコードを確かめるコマンド
```
slack-cli datastore get --app A0C3YGVBN9J --datastore slack_user_profiles '{"id":"U0BC46H2U3C"}' --output json
```
