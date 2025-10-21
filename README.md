# play-n8n

n8nをDocker Composeで動かして、Custom Nodesを作って試すサンプルリポジトリです。

## 構成

- custom/: Custom Nodesのソースコードを配置するディレクトリ
    - n8n-nodes-add-extension-to-drive/: Google Driveのダウンロードノードの後にくっつけたりすると便利な拡張ノードのサンプル
- Dockerfile.n8n: n8nのカスタムDockerイメージをビルドするためのDockerfile
- compose.yaml: Docker Composeの設定ファイル

## 使い方

1. .env.templateをコピーして.envファイルを作成し、必要に応じて環境変数を設定
2. Docker Composeでn8nサービスをビルド・起動

```sh
docker compose up -d --build
```
